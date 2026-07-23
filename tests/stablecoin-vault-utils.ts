import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  AdminUpdated,
  Deposited,
  GovernanceUpdated,
  RedeemExecuted,
  TokenConfigUpdated,
  TreasuryTransferred
} from "../generated/StablecoinVault/StablecoinVault"

export function createAdminUpdatedEvent(
  oldAdmin: Address,
  newAdmin: Address
): AdminUpdated {
  let adminUpdatedEvent = changetype<AdminUpdated>(newMockEvent())

  adminUpdatedEvent.parameters = new Array()

  adminUpdatedEvent.parameters.push(
    new ethereum.EventParam("oldAdmin", ethereum.Value.fromAddress(oldAdmin))
  )
  adminUpdatedEvent.parameters.push(
    new ethereum.EventParam("newAdmin", ethereum.Value.fromAddress(newAdmin))
  )

  return adminUpdatedEvent
}

export function createDepositedEvent(
  orderId: BigInt,
  user: Address,
  token: Address,
  amount: BigInt,
  maturityTime: BigInt
): Deposited {
  let depositedEvent = changetype<Deposited>(newMockEvent())

  depositedEvent.parameters = new Array()

  depositedEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  )
  depositedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  depositedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  depositedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  depositedEvent.parameters.push(
    new ethereum.EventParam(
      "maturityTime",
      ethereum.Value.fromUnsignedBigInt(maturityTime)
    )
  )

  return depositedEvent
}

export function createGovernanceUpdatedEvent(
  oldGovernance: Address,
  newGovernance: Address
): GovernanceUpdated {
  let governanceUpdatedEvent = changetype<GovernanceUpdated>(newMockEvent())

  governanceUpdatedEvent.parameters = new Array()

  governanceUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldGovernance",
      ethereum.Value.fromAddress(oldGovernance)
    )
  )
  governanceUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newGovernance",
      ethereum.Value.fromAddress(newGovernance)
    )
  )

  return governanceUpdatedEvent
}

export function createRedeemExecutedEvent(
  orderId: BigInt,
  user: Address,
  token: Address,
  payoutTo: Address,
  payoutAmount: BigInt,
  settlementRef: Bytes
): RedeemExecuted {
  let redeemExecutedEvent = changetype<RedeemExecuted>(newMockEvent())

  redeemExecutedEvent.parameters = new Array()

  redeemExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  )
  redeemExecutedEvent.parameters.push(
    new ethereum.EventParam("user", ethereum.Value.fromAddress(user))
  )
  redeemExecutedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  redeemExecutedEvent.parameters.push(
    new ethereum.EventParam("payoutTo", ethereum.Value.fromAddress(payoutTo))
  )
  redeemExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "payoutAmount",
      ethereum.Value.fromUnsignedBigInt(payoutAmount)
    )
  )
  redeemExecutedEvent.parameters.push(
    new ethereum.EventParam(
      "settlementRef",
      ethereum.Value.fromFixedBytes(settlementRef)
    )
  )

  return redeemExecutedEvent
}

export function createTokenConfigUpdatedEvent(
  token: Address,
  supported: boolean,
  minDepositAmount: BigInt
): TokenConfigUpdated {
  let tokenConfigUpdatedEvent = changetype<TokenConfigUpdated>(newMockEvent())

  tokenConfigUpdatedEvent.parameters = new Array()

  tokenConfigUpdatedEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  tokenConfigUpdatedEvent.parameters.push(
    new ethereum.EventParam("supported", ethereum.Value.fromBoolean(supported))
  )
  tokenConfigUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "minDepositAmount",
      ethereum.Value.fromUnsignedBigInt(minDepositAmount)
    )
  )

  return tokenConfigUpdatedEvent
}

export function createTreasuryTransferredEvent(
  token: Address,
  to: Address,
  amount: BigInt,
  reason: Bytes
): TreasuryTransferred {
  let treasuryTransferredEvent = changetype<TreasuryTransferred>(newMockEvent())

  treasuryTransferredEvent.parameters = new Array()

  treasuryTransferredEvent.parameters.push(
    new ethereum.EventParam("token", ethereum.Value.fromAddress(token))
  )
  treasuryTransferredEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  treasuryTransferredEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  treasuryTransferredEvent.parameters.push(
    new ethereum.EventParam("reason", ethereum.Value.fromFixedBytes(reason))
  )

  return treasuryTransferredEvent
}
