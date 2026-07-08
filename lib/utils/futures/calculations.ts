import type { FuturesContract } from './contracts'
import { RISK_PERCENTAGES } from './contracts'

export type Direction = 'long' | 'short'

export type PositionResult = {
  riskDollars: number
  slPoints: number
  tpPoints: number
  slTicks: number
  tpTicks: number
  contracts: number
  maxLoss: number
  maxProfit: number
  riskRewardRatio: number
  directionWarning: string | null
}

export type RiskMatrixRow = {
  riskPercent: number
  maxRisk: number
  contracts: number
}

export type ContractMatrixRow = {
  contracts: number
  maxRisk: number
  riskPercent: number
}

type CalculatePositionParams = {
  accountSize: number
  riskPercent: number
  entryPrice: number
  stopLossPrice: number
  takeProfitPrice: number
  direction: Direction
  contract: FuturesContract
}

/**
 * Position sizing per contract guide:
 *   Contracts = Risk $ ÷ (Stop Loss Points × Tick Value per Point)
 *
 * `pointValue` is the dollar value per index point (PDF: "Tick Value per Point").
 */
export function calculatePosition(params: CalculatePositionParams): PositionResult {
  const { accountSize, riskPercent, entryPrice, stopLossPrice, takeProfitPrice, direction, contract } = params

  const riskDollars = accountSize * (riskPercent / 100)
  const slPoints = Math.abs(entryPrice - stopLossPrice)
  const tpPoints = Math.abs(takeProfitPrice - entryPrice)
  const slTicks = slPoints / contract.tickSize
  const tpTicks = tpPoints / contract.tickSize
  const contracts = slPoints > 0 ? riskDollars / (slPoints * contract.pointValue) : 0
  const maxLoss = contracts * slPoints * contract.pointValue
  const maxProfit = contracts * tpPoints * contract.pointValue
  const riskRewardRatio = slPoints > 0 ? tpPoints / slPoints : 0
  const directionWarning = getDirectionWarning(direction, entryPrice, stopLossPrice, takeProfitPrice)

  return {
    riskDollars,
    slPoints: round(slPoints, 4),
    tpPoints: round(tpPoints, 4),
    slTicks: round(slTicks, 2),
    tpTicks: round(tpTicks, 2),
    contracts: round(contracts, 2),
    maxLoss: round(maxLoss, 2),
    maxProfit: round(maxProfit, 2),
    riskRewardRatio: round(riskRewardRatio, 2),
    directionWarning,
  }
}

export function getRiskMatrix(
  accountSize: number,
  slPoints: number,
  contract: FuturesContract,
): RiskMatrixRow[] {
  return RISK_PERCENTAGES.map((riskPercent) => {
    const maxRisk = accountSize * (riskPercent / 100)
    const contracts = slPoints > 0 ? maxRisk / (slPoints * contract.pointValue) : 0
    return {
      riskPercent,
      maxRisk: round(maxRisk, 2),
      contracts: round(contracts, 2),
    }
  })
}

export function getContractMatrix(
  accountSize: number,
  slPoints: number,
  contract: FuturesContract,
): ContractMatrixRow[] {
  return Array.from({ length: 10 }, (_, index) => {
    const contracts = index + 1
    const maxRisk = contracts * slPoints * contract.pointValue
    const riskPercent = accountSize > 0 ? (maxRisk / accountSize) * 100 : 0
    return {
      contracts,
      maxRisk: round(maxRisk, 2),
      riskPercent: round(riskPercent, 2),
    }
  })
}

function getDirectionWarning(
  direction: Direction,
  entry: number,
  stopLoss: number,
  takeProfit: number,
): string | null {
  if (direction === 'long') {
    if (stopLoss >= entry) return 'Long stop loss must be below entry price'
    if (takeProfit <= entry) return 'Long take profit must be above entry price'
  } else {
    if (stopLoss <= entry) return 'Short stop loss must be above entry price'
    if (takeProfit >= entry) return 'Short take profit must be below entry price'
  }
  return null
}

/**
 * Dollar risk for one contract given a stop-loss distance in ticks.
 */
export function getRiskPerContract(slTicks: number, contract: FuturesContract): number {
  const slPoints = slTicks * contract.tickSize
  return round(slPoints * contract.pointValue, 2)
}

function round(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}
