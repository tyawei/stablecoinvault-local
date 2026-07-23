import {
  AdminUpdated as AdminUpdatedEvent,
  Deposited as DepositedEvent,
  GovernanceUpdated as GovernanceUpdatedEvent,
  RedeemExecuted as RedeemExecutedEvent,
  TokenConfigUpdated as TokenConfigUpdatedEvent,
  TreasuryTransferred as TreasuryTransferredEvent
} from "../generated/StablecoinVault/StablecoinVault"
import {
  AdminUpdated,
  Deposited,
  GovernanceUpdated,
  RedeemExecuted,
  TokenConfigUpdated,
  TreasuryTransferred
} from "../generated/schema"

export function handleAdminUpdated(event: AdminUpdatedEvent): void {
  let entity = new AdminUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldAdmin = event.params.oldAdmin
  entity.newAdmin = event.params.newAdmin

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleDeposited(event: DepositedEvent): void {
  let entity = new Deposited(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.orderId = event.params.orderId
  entity.user = event.params.user
  entity.token = event.params.token
  entity.amount = event.params.amount
  entity.maturityTime = event.params.maturityTime

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleGovernanceUpdated(event: GovernanceUpdatedEvent): void {
  let entity = new GovernanceUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.oldGovernance = event.params.oldGovernance
  entity.newGovernance = event.params.newGovernance

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRedeemExecuted(event: RedeemExecutedEvent): void {
  let entity = new RedeemExecuted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.orderId = event.params.orderId
  entity.user = event.params.user
  entity.token = event.params.token
  entity.payoutTo = event.params.payoutTo
  entity.payoutAmount = event.params.payoutAmount
  entity.settlementRef = event.params.settlementRef

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTokenConfigUpdated(event: TokenConfigUpdatedEvent): void {
  let entity = new TokenConfigUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.supported = event.params.supported
  entity.minDepositAmount = event.params.minDepositAmount

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleTreasuryTransferred(
  event: TreasuryTransferredEvent
): void {
  let entity = new TreasuryTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.token = event.params.token
  entity.to = event.params.to
  entity.amount = event.params.amount
  entity.reason = event.params.reason

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
