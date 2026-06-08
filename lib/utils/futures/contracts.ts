export type FuturesContract = {
  symbol: string
  name: string
  pointValue: number
  tickSize: number
  ticksPerPoint: number
  yahooSymbol: string
  isMicro: boolean
  exchange: string
  description: string
}

export const FUTURES_CONTRACTS: FuturesContract[] = [
  {
    symbol: 'MNQ',
    name: 'Micro Nasdaq 100',
    pointValue: 2,
    tickSize: 0.25,
    ticksPerPoint: 4,
    yahooSymbol: 'MNQ=F',
    isMicro: true,
    exchange: 'CME',
    description: '$0.50 per tick · 4 ticks per point · $2 per point',
  },
  {
    symbol: 'MES',
    name: 'Micro S&P 500',
    pointValue: 5,
    tickSize: 0.25,
    ticksPerPoint: 4,
    yahooSymbol: 'MES=F',
    isMicro: true,
    exchange: 'CME',
    description: '$1.25 per tick · 4 ticks per point · $5 per point',
  },
  {
    symbol: 'MYM',
    name: 'Micro Dow Jones',
    pointValue: 0.5,
    tickSize: 1,
    ticksPerPoint: 1,
    yahooSymbol: 'MYM=F',
    isMicro: true,
    exchange: 'CBOT',
    description: '$0.50 per tick · 1 tick per point · $0.50 per point',
  },
  {
    symbol: 'M2K',
    name: 'Micro Russell 2000',
    pointValue: 5,
    tickSize: 0.1,
    ticksPerPoint: 10,
    yahooSymbol: 'M2K=F',
    isMicro: true,
    exchange: 'CME',
    description: '$0.50 per tick · 10 ticks per point · $5 per point',
  },
  {
    symbol: 'MGC',
    name: 'Micro Gold',
    pointValue: 10,
    tickSize: 0.1,
    ticksPerPoint: 10,
    yahooSymbol: 'MGC=F',
    isMicro: true,
    exchange: 'COMEX',
    description: '$1.00 per tick · 10 ticks per point · $10 per point',
  },
  {
    symbol: 'NQ',
    name: 'Nasdaq 100 (E-mini)',
    pointValue: 20,
    tickSize: 0.25,
    ticksPerPoint: 4,
    yahooSymbol: 'NQ=F',
    isMicro: false,
    exchange: 'CME',
    description: '$5.00 per tick · 4 ticks per point · $20 per point',
  },
  {
    symbol: 'ES',
    name: 'S&P 500 (E-mini)',
    pointValue: 50,
    tickSize: 0.25,
    ticksPerPoint: 4,
    yahooSymbol: 'ES=F',
    isMicro: false,
    exchange: 'CME',
    description: '$12.50 per tick · 4 ticks per point · $50 per point',
  },
  {
    symbol: 'YM',
    name: 'Dow Jones (E-mini)',
    pointValue: 5,
    tickSize: 1,
    ticksPerPoint: 1,
    yahooSymbol: 'YM=F',
    isMicro: false,
    exchange: 'CBOT',
    description: '$5.00 per tick · 1 tick per point · $5 per point',
  },
  {
    symbol: 'GC',
    name: 'Gold',
    pointValue: 100,
    tickSize: 0.1,
    ticksPerPoint: 10,
    yahooSymbol: 'GC=F',
    isMicro: false,
    exchange: 'COMEX',
    description: '$10.00 per tick · 10 ticks per point · $100 per point',
  },
]

export const RISK_PERCENTAGES = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7]

export function getContractBySymbol(symbol: string): FuturesContract | undefined {
  return FUTURES_CONTRACTS.find((contract) => contract.symbol === symbol)
}
