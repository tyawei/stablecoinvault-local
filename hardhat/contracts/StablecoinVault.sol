// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StablecoinVault is ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint256 private constant DEPOSIT_PRECISION_UNIT = 10_000;

    // 订单最小状态集：未创建 / 已入金 / 已兑付
    enum OrderStatus {
        None,
        Deposited,
        Redeemed
    }

    // 单笔链上订单。每次 deposit 都会生成一个独立订单
    struct Order {
        address user;
        address token;
        uint256 principal;
        uint256 depositTime;
        uint256 maturityTime;
        uint256 settledPayout;
        OrderStatus status;
    }

    // 代币配置：是否支持 + 最小入金金额（最小单位）
    struct TokenConfig {
        bool supported;
        uint256 minDepositAmount;
    }

    // 核心全局参数：
    // - nextOrderId: 从 1 开始递增
    // - admin / governance: 管理、归集治理角色
    uint256 public nextOrderId;
    address public admin;
    address public governance;

    // orders 用于按 orderId 查询订单；tokenConfig 用于代币白名单与最小金额校验
    mapping(uint256 orderId => Order order) public orders;
    mapping(address token => TokenConfig config) public tokenConfig;

    error Unauthorized();
    error TokenNotSupported(address token);
    error InvalidAmount();
    error InvalidDepositPrecision(uint256 amount, uint256 precisionUnit);
    error AmountBelowMinimum(address token, uint256 minAmount, uint256 actualAmount);
    error UnsupportedTokenBehavior();
    error InvalidStatus();
    error AlreadySettled();
    error InvalidSettlementRef();
    error InvalidReason();
    error InsufficientVaultBalance(address token, uint256 requiredAmount, uint256 availableAmount);
    error ZeroAddress();
    event Deposited(
        uint256 indexed orderId,
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 maturityTime
    );

    event RedeemExecuted(
        uint256 indexed orderId,
        address indexed user,
        address indexed token,
        address payoutTo,
        uint256 payoutAmount,
        bytes32 settlementRef
    );

    event TreasuryTransferred(address indexed token, address indexed to, uint256 amount, bytes32 reason);
    event TokenConfigUpdated(address indexed token, bool supported, uint256 minDepositAmount);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);
    event GovernanceUpdated(address indexed oldGovernance, address indexed newGovernance);

    // 构造函数只做初始化，不做业务配置：
    // 代币白名单与最小入金通过 admin 函数单独设置
    constructor(address initialGovernance) {
        if (initialGovernance == address(0)) {
            revert ZeroAddress();
        }

        admin = msg.sender;
        governance = initialGovernance;
        nextOrderId = 1;
    }

    // 用户充值入口：
    // 1) 参数和白名单校验
    // 2) safeTransferFrom 入金
    // 3) 通过余额前后差拒绝 fee-on-transfer/异常代币
    // 4) 创建订单并发出 Deposited 事件
    function deposit(address token, uint256 amount) external nonReentrant {
        TokenConfig memory config = tokenConfig[token];
        if (!config.supported) {
            revert TokenNotSupported(token);
        }
        if (amount == 0) {
            revert InvalidAmount();
        }
        if (amount % DEPOSIT_PRECISION_UNIT != 0) {
            revert InvalidDepositPrecision(amount, DEPOSIT_PRECISION_UNIT);
        }
        if (amount < config.minDepositAmount) {
            revert AmountBelowMinimum(token, config.minDepositAmount, amount);
        }

        IERC20 asset = IERC20(token);
        uint256 balanceBefore = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        uint256 balanceAfter = asset.balanceOf(address(this));

        // 强约束：实际到账必须等于用户声明的 amount
        if (balanceAfter < balanceBefore || balanceAfter - balanceBefore != amount) {
            revert UnsupportedTokenBehavior();
        }

        uint256 orderId = nextOrderId;
        uint256 depositTime = block.timestamp;
        // 链上不做锁仓控制：到期时间恒为 0，由 Go 按业务口径控制可赎回时间
        uint256 maturityTime = 0;

        orders[orderId] = Order({
            user: msg.sender,
            token: token,
            principal: amount,
            depositTime: depositTime,
            maturityTime: maturityTime,
            settledPayout: 0,
            status: OrderStatus.Deposited
        });

        unchecked {
            nextOrderId = orderId + 1;
        }

        emit Deposited(orderId, msg.sender, token, amount, maturityTime);
    }

    // 兑付执行入口（仅 admin）：
    // 1) 校验订单状态
    // 2) 校验兑付参数和金库余额
    // 3) 落订单终态并转账
    // 4) 发出 RedeemExecuted 供 Go 审计和对账
    function executeRedeem(
        uint256 orderId,
        address payoutTo,
        uint256 payoutAmount,
        bytes32 settlementRef
    ) external nonReentrant {
        _checkAdmin(msg.sender);

        if (payoutTo == address(0)) {
            revert ZeroAddress();
        }
        if (payoutAmount == 0) {
            revert InvalidAmount();
        }
        if (settlementRef == bytes32(0)) {
            revert InvalidSettlementRef();
        }

        Order storage order = orders[orderId];
        if (order.status == OrderStatus.Redeemed) {
            revert AlreadySettled();
        }
        if (order.status != OrderStatus.Deposited) {
            revert InvalidStatus();
        }

        IERC20 asset = IERC20(order.token);
        uint256 availableAmount = asset.balanceOf(address(this));
        if (availableAmount < payoutAmount) {
            revert InsufficientVaultBalance(order.token, payoutAmount, availableAmount);
        }

        // 先更新订单状态，再执行转账，避免重复结算
        order.settledPayout = payoutAmount;
        order.status = OrderStatus.Redeemed;

        asset.safeTransfer(payoutTo, payoutAmount);

        emit RedeemExecuted(orderId, order.user, order.token, payoutTo, payoutAmount, settlementRef);
    }

    // 治理归集入口：仅 governance 可执行，不改订单状态，只做资金转移并落审计事件
    function transferTreasury(address token, address to, uint256 amount, bytes32 reason) external nonReentrant {
        _checkGovernance(msg.sender);

        if (token == address(0) || to == address(0)) {
            revert ZeroAddress();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }
        if (reason == bytes32(0)) {
            revert InvalidReason();
        }

        IERC20(token).safeTransfer(to, amount);
        emit TreasuryTransferred(token, to, amount, reason);
    }

    // 更新白名单代币与最小入金金额（仅 admin）
    function setTokenConfig(address token, bool supported, uint256 minDepositAmount) external {
        _checkAdmin(msg.sender);

        if (token == address(0)) {
            revert ZeroAddress();
        }
        if (supported && minDepositAmount == 0) {
            revert InvalidAmount();
        }

        tokenConfig[token] = TokenConfig({supported: supported, minDepositAmount: minDepositAmount});
        emit TokenConfigUpdated(token, supported, minDepositAmount);
    }

    // 更新管理地址（仅当前 admin）
    function setAdmin(address newAdmin) external {
        _checkAdmin(msg.sender);

        if (newAdmin == address(0)) {
            revert ZeroAddress();
        }

        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    // 更新治理账户（仅 admin）
    function setGovernance(address newGovernance) external {
        _checkAdmin(msg.sender);

        if (newGovernance == address(0)) {
            revert ZeroAddress();
        }

        address oldGovernance = governance;
        governance = newGovernance;
        emit GovernanceUpdated(oldGovernance, newGovernance);
    }

    // 统一管理权限检查
    function _checkAdmin(address operator) internal view {
        if (operator != admin) {
            revert Unauthorized();
        }
    }

    // 统一治理权限检查
    function _checkGovernance(address operator) internal view {
        if (operator != governance) {
            revert Unauthorized();
        }
    }
}