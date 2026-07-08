'use client'

/**
 * FuturesCalculator Component
 *
 * Main position sizing calculator for micro & standard futures contracts.
 * Fetches live prices from Yahoo Finance (via API proxy) with manual fallback.
 *
 * Features:
 * - Contract selector (micro-first)
 * - Long / Short direction toggle
 * - Live price fetch with manual override
 * - Price or Ticks input mode toggle for SL/TP
 * - Risk % matrix table (0.5% – 7%)
 * - Contracts, SL/TP ticks & points, max P&L, R:R ratio
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FUTURES_CONTRACTS,
  RISK_PERCENTAGES,
  getContractBySymbol,
  getMicroAlternative,
  type FuturesContract,
} from '@/lib/utils/futures/contracts'
import {
  calculatePosition,
  getContractMatrix,
  getRiskPerContract,
  type Direction,
} from '@/lib/utils/futures/calculations'

// ============================================================================
// Types
// ============================================================================

type InputMode = 'price' | 'ticks'

type PriceState = {
  loading: boolean
  error: string | null
}

type PriceInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

type StatCardProps = {
  label: string
  value: string
  colorClass?: string
}

// ============================================================================
// Sub-components
// ============================================================================

function PriceInput({ label, value, onChange, placeholder }: PriceInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? '0.00'}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm tabular-nums focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>
  )
}

function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${colorClass ?? 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function FuturesCalculator() {
  // ============================================================================
  // Contract & Direction State
  // ============================================================================
  const [selectedSymbol, setSelectedSymbol] = useState('MNQ')
  const [direction, setDirection] = useState<Direction>('long')

  // ============================================================================
  // Account & Risk State
  // ============================================================================
  const [accountSize, setAccountSize] = useState(50000)
  const [riskPercent, setRiskPercent] = useState(2)

  // ============================================================================
  // Price Input State
  // ============================================================================
  const [inputMode, setInputMode] = useState<InputMode>('ticks')
  const [entryPrice, setEntryPrice] = useState('')
  const [stopLossPrice, setStopLossPrice] = useState('')
  const [takeProfitPrice, setTakeProfitPrice] = useState('')
  const [priceState, setPriceState] = useState<PriceState>({ loading: false, error: null })

  // ============================================================================
  // Calculation Results State
  // ============================================================================
  const [tradingContracts, setTradingContracts] = useState(1)
  const [tradingContractsInput, setTradingContractsInput] = useState('1')

  const selectedContract: FuturesContract =
    getContractBySymbol(selectedSymbol) ?? FUTURES_CONTRACTS[0]

  const microAlternative = getMicroAlternative(selectedSymbol)

  const microContracts = FUTURES_CONTRACTS.filter((contract) => contract.isMicro)
  const standardContracts = FUTURES_CONTRACTS.filter((contract) => !contract.isMicro)

  // ============================================================================
  // Live Price Fetch
  // ============================================================================

  const fetchLivePrice = useCallback(async (symbol: string) => {
    setPriceState({ loading: true, error: null })
    try {
      const response = await fetch(`/api/futures-price?symbol=${symbol}`)
      const data = await response.json()

      if (data.error || !data.price) {
        setPriceState({ loading: false, error: 'Live price unavailable — enter manually' })
        return
      }

      setEntryPrice(String(data.price))
      setPriceState({ loading: false, error: null })
    } catch (e) {
      console.error('[FuturesCalculator] fetchLivePrice:', e instanceof Error ? e.message : 'Unknown error')
      setPriceState({ loading: false, error: 'Live price unavailable — enter manually' })
    }
  }, [])

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLivePrice(selectedSymbol)
    setStopLossPrice('')
    setTakeProfitPrice('')
    setTradingContractCount(1)
  }, [selectedSymbol, fetchLivePrice])

  const computedResults = useMemo(() => {
    const entry = parseFloat(entryPrice)
    const slRaw = parseFloat(stopLossPrice)
    const tpRaw = parseFloat(takeProfitPrice)

    if (!entry || !slRaw) {
      const slPoints = inputMode === 'ticks'
        ? (slRaw || 0) * selectedContract.tickSize
        : slRaw && entry ? Math.abs(entry - slRaw) : 0
      return {
        results: null,
        contractMatrix: getContractMatrix(accountSize, slPoints, selectedContract),
      }
    }

    let resolvedSlPrice: number
    let resolvedTpPrice: number

    if (inputMode === 'ticks') {
      const slPoints = slRaw * selectedContract.tickSize
      const tpPoints = tpRaw ? tpRaw * selectedContract.tickSize : 0
      resolvedSlPrice = direction === 'long' ? entry - slPoints : entry + slPoints
      resolvedTpPrice = tpRaw
        ? direction === 'long' ? entry + tpPoints : entry - tpPoints
        : entry
    } else {
      resolvedSlPrice = slRaw
      resolvedTpPrice = tpRaw || entry
    }

    const position = calculatePosition({
      accountSize,
      riskPercent,
      entryPrice: entry,
      stopLossPrice: resolvedSlPrice,
      takeProfitPrice: resolvedTpPrice,
      direction,
      contract: selectedContract,
    })

    return {
      results: position,
      contractMatrix: getContractMatrix(accountSize, position.slPoints, selectedContract),
    }
  }, [accountSize, riskPercent, entryPrice, stopLossPrice, takeProfitPrice, direction, selectedContract, inputMode])

  const displayResults = computedResults.results
  const displayContractMatrix = computedResults.contractMatrix

  const slTicksInput = parseFloat(stopLossPrice) || 0
  const perContractRisk = inputMode === 'ticks' && slTicksInput > 0
    ? getRiskPerContract(slTicksInput, selectedContract)
    : displayResults
      ? displayResults.slPoints * selectedContract.pointValue
      : 0
  const tickValue = selectedContract.pointValue / selectedContract.ticksPerPoint

  // ============================================================================
  // Input Mode Toggle Handler
  // ============================================================================

  const handleToggleInputMode = () => {
    setInputMode((previous) => (previous === 'price' ? 'ticks' : 'price'))
    setStopLossPrice('')
    setTakeProfitPrice('')
  }

  // ============================================================================
  // Trading Contracts Handlers
  // ============================================================================

  const setTradingContractCount = (count: number) => {
    setTradingContracts(count)
    setTradingContractsInput(String(count))
  }

  const handleTradingContractsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    if (raw === '') {
      setTradingContractsInput('')
      return
    }
    if (!/^\d+$/.test(raw)) return
    setTradingContractsInput(raw)
    setTradingContracts(parseInt(raw, 10))
  }

  const handleTradingContractsBlur = () => {
    const parsed = parseInt(tradingContractsInput, 10)
    if (!tradingContractsInput || isNaN(parsed) || parsed < 1) {
      setTradingContractsInput('1')
      setTradingContracts(1)
    }
  }

  // ============================================================================
  // Account Size Handlers
  // ============================================================================

  const handleStepAccountSize = (delta: number) => {
    setAccountSize((previous) => Math.max(1000, previous + delta))
  }

  const handleAccountSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAccountSize(Math.max(1000, parseInt(event.target.value) || 0))
  }

  // ============================================================================
  // R:R color helper
  // ============================================================================

  const getRRColorClass = (ratio: number): string => {
    if (ratio >= 2) return 'text-emerald-400'
    if (ratio >= 1.5) return 'text-emerald-300'
    if (ratio >= 1) return 'text-amber-400'
    return 'text-red-400'
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ====================================================================
            Header: Title + Contract Selector
        ==================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Futures Calculator</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">Contract</label>
            <select
              value={selectedSymbol}
              onChange={(event) => setSelectedSymbol(event.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <optgroup label="Micro Contracts">
                {microContracts.map((contract) => (
                  <option key={contract.symbol} value={contract.symbol}>
                    {contract.symbol} — {contract.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Standard (E-mini)">
                {standardContracts.map((contract) => (
                  <option key={contract.symbol} value={contract.symbol}>
                    {contract.symbol} — {contract.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ==============================================================
              Left Column: Inputs
          ============================================================== */}
          <div className="flex flex-col gap-6">

            {/* Direction Toggle */}
            <div>
              <h2 className="text-base font-semibold text-gray-300 mb-3">Direction</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDirection('long')}
                  className={`py-3 rounded font-semibold text-sm transition-colors ${
                    direction === 'long'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  ↑ Long
                </button>
                <button
                  onClick={() => setDirection('short')}
                  className={`py-3 rounded font-semibold text-sm transition-colors ${
                    direction === 'short'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  ↓ Short
                </button>
              </div>
            </div>

            {/* Price Inputs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-300">Price Details</h2>
                <div className="flex items-center gap-2">
                  {/* SL/TP input mode toggle */}
                  <div className="flex rounded border border-gray-700 overflow-hidden text-xs">
                    <button
                      onClick={() => inputMode !== 'price' && handleToggleInputMode()}
                      className={`px-3 py-1 transition-colors ${
                        inputMode === 'price'
                          ? 'bg-gray-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      Price
                    </button>
                    <button
                      onClick={() => inputMode !== 'ticks' && handleToggleInputMode()}
                      className={`px-3 py-1 transition-colors ${
                        inputMode === 'ticks'
                          ? 'bg-gray-600 text-white'
                          : 'text-gray-400 hover:bg-gray-800'
                      }`}
                    >
                      Ticks
                    </button>
                  </div>
                  <button
                    onClick={() => fetchLivePrice(selectedSymbol)}
                    disabled={priceState.loading}
                    className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-800 hover:border-emerald-600 px-3 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {priceState.loading ? 'Fetching…' : 'Refresh Live Price'}
                  </button>
                </div>
              </div>

              {priceState.error && (
                <p className="text-xs text-amber-400 mb-3 bg-amber-950/40 border border-amber-800/40 px-3 py-2 rounded">
                  {priceState.error}
                </p>
              )}

              <div className="flex flex-col gap-3">
                <PriceInput
                  label={priceState.loading ? 'Entry Price (fetching…)' : 'Entry Price'}
                  value={entryPrice}
                  onChange={setEntryPrice}
                  placeholder="Enter or fetch live price"
                />
                <div className="grid grid-cols-2 gap-3">
                  <PriceInput
                    label={inputMode === 'ticks' ? 'Stop Loss (ticks)' : 'Stop Loss'}
                    value={stopLossPrice}
                    onChange={setStopLossPrice}
                    placeholder={inputMode === 'ticks' ? 'e.g. 40' : '0.00'}
                  />
                  <PriceInput
                    label={inputMode === 'ticks' ? 'Take Profit (ticks, optional)' : 'Take Profit (optional)'}
                    value={takeProfitPrice}
                    onChange={setTakeProfitPrice}
                    placeholder={inputMode === 'ticks' ? 'e.g. 80' : '0.00'}
                  />
                </div>
                {inputMode === 'ticks' && stopLossPrice && slTicksInput > 0 && (
                  <p className="text-xs text-gray-500">
                    {slTicksInput} ticks = {(slTicksInput / selectedContract.ticksPerPoint).toFixed(2)} pts ={' '}
                    <span className="text-red-400 font-medium tabular-nums">
                      ${perContractRisk.toFixed(2)} per contract
                    </span>
                    <span className="text-gray-600"> (${tickValue.toFixed(2)}/tick)</span>
                  </p>
                )}
                {inputMode === 'ticks' && entryPrice && stopLossPrice && (
                  <p className="text-xs text-gray-500">
                    SL price:{' '}
                    <span className="text-red-400 tabular-nums">
                      {(direction === 'long'
                        ? parseFloat(entryPrice) - parseFloat(stopLossPrice) * selectedContract.tickSize
                        : parseFloat(entryPrice) + parseFloat(stopLossPrice) * selectedContract.tickSize
                      ).toFixed(selectedContract.tickSize < 1 ? 2 : 0)}
                    </span>
                    {takeProfitPrice && (
                      <>
                        {' · '}TP price:{' '}
                        <span className="text-emerald-400 tabular-nums">
                          {(direction === 'long'
                            ? parseFloat(entryPrice) + parseFloat(takeProfitPrice) * selectedContract.tickSize
                            : parseFloat(entryPrice) - parseFloat(takeProfitPrice) * selectedContract.tickSize
                          ).toFixed(selectedContract.tickSize < 1 ? 2 : 0)}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>

              {inputMode === 'price' && displayResults?.directionWarning && (
                <p className="text-xs text-red-400 mt-2 bg-red-950/40 border border-red-800/40 px-3 py-2 rounded">
                  {displayResults.directionWarning}
                </p>
              )}
            </div>

            {/* Account Size */}
            <div>
              <h2 className="text-base font-semibold text-gray-300 mb-3">Account Size</h2>
              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => handleStepAccountSize(-1000)}
                  className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 font-bold transition-colors flex items-center justify-center"
                >
                  −
                </button>
                <input
                  type="number"
                  value={accountSize}
                  onChange={handleAccountSizeChange}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm tabular-nums text-center focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleStepAccountSize(1000)}
                  className="w-9 h-9 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 font-bold transition-colors flex items-center justify-center"
                >
                  +
                </button>
              </div>

              {/* Risk % selector */}
              <div className="flex items-center gap-3 mb-5">
                <label className="text-sm text-gray-400 shrink-0">Risk %</label>
                <select
                  value={riskPercent}
                  onChange={(event) => setRiskPercent(parseFloat(event.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {RISK_PERCENTAGES.map((pct) => (
                    <option key={pct} value={pct}>{pct}%</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  = ${(accountSize * riskPercent / 100).toLocaleString()} risk budget
                </span>
              </div>

              {/* Contract count matrix (1–10) */}
              <h2 className="text-base font-semibold text-gray-300 mb-3">Portfolio Risk</h2>
              <div className="overflow-x-auto rounded border border-gray-800">
                <table className="w-full text-sm tabular-nums border-collapse min-w-max">
                  <thead>
                    <tr>
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">Contracts</td>
                      {displayContractMatrix.map((row) => (
                        <th
                          key={row.contracts}
                          onClick={() => setTradingContractCount(row.contracts)}
                          className={`px-3 py-2 text-center font-semibold cursor-pointer transition-colors ${
                            tradingContracts === row.contracts
                              ? 'bg-emerald-600 text-white'
                              : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          {row.contracts}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-800">
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">Max Risk $</td>
                      {displayContractMatrix.map((row) => (
                        <td
                          key={row.contracts}
                          onClick={() => setTradingContractCount(row.contracts)}
                          className={`px-3 py-2 text-center cursor-pointer transition-colors ${
                            tradingContracts === row.contracts
                              ? 'bg-emerald-600/20 text-red-400 font-semibold'
                              : 'text-red-400 hover:bg-gray-800'
                          }`}
                        >
                          {row.maxRisk > 0 ? `-${row.maxRisk.toLocaleString()}` : '—'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-800">
                      <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">Risk %</td>
                      {displayContractMatrix.map((row) => (
                        <td
                          key={row.contracts}
                          onClick={() => setTradingContractCount(row.contracts)}
                          className={`px-3 py-2 text-center cursor-pointer transition-colors ${
                            tradingContracts === row.contracts
                              ? 'bg-emerald-600/20 text-amber-400 font-semibold'
                              : 'text-gray-400 hover:bg-gray-800'
                          }`}
                        >
                          {row.riskPercent > 0 ? `${row.riskPercent.toFixed(2)}%` : '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ==============================================================
              Right Column: Results + Contract Info
          ============================================================== */}
          <div className="flex flex-col gap-6">

            {/* Calculation Results */}
            <div>
              <h2 className="text-base font-semibold text-gray-300 mb-3">Results</h2>

              {displayResults ? (() => {
                const actualMaxLoss = tradingContracts * perContractRisk
                const actualMaxProfit = tradingContracts * displayResults.tpPoints * selectedContract.pointValue
                const actualRiskPercent = (actualMaxLoss / accountSize) * 100

                return (
                  <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 flex flex-col gap-5">

                    {/* Recommended (calculated) contracts */}
                    <div className="text-center pb-1">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommended Contracts</p>
                      <p className="text-4xl font-bold text-gray-400 tabular-nums">
                        {displayResults.contracts.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        based on {riskPercent}% risk · ${displayResults.riskDollars.toLocaleString()}
                        {perContractRisk > 0 && (
                          <> · ${perContractRisk.toFixed(2)}/contract at this SL</>
                        )}
                      </p>
                      {displayResults.contracts < 1 && microAlternative && (
                        <p className="text-xs text-amber-400 mt-2 bg-amber-950/40 border border-amber-800/40 px-3 py-2 rounded">
                          Less than 1 contract — you can&apos;t trade a fractional contract.
                          Consider switching to {microAlternative.symbol} (micro) instead.
                        </p>
                      )}
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* Trading contracts override */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">You Will Trade</p>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={tradingContractsInput}
                        onChange={handleTradingContractsChange}
                        onBlur={handleTradingContractsBlur}
                        placeholder="1"
                        className="w-full bg-gray-800 border border-emerald-700 rounded px-3 py-2 text-white text-2xl font-bold tabular-nums text-center focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Actual risk:{' '}
                        <span className="text-red-400 font-medium">
                          ${actualMaxLoss.toFixed(2)} total
                        </span>
                        {tradingContracts > 1 && (
                          <>
                            {' '}({tradingContracts} × ${perContractRisk.toFixed(2)})
                          </>
                        )}
                        {' '}·{' '}
                        <span className={`font-medium ${actualRiskPercent > 5 ? 'text-red-400' : actualRiskPercent > 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {actualRiskPercent.toFixed(2)}% of account
                        </span>
                      </p>
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* SL / TP Breakdown — based on trading contracts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Stop Loss</p>
                        <StatCard label="Ticks" value={displayResults.slTicks.toFixed(2)} colorClass="text-red-400" />
                        <StatCard label="Points" value={displayResults.slPoints.toFixed(2)} colorClass="text-red-400" />
                        <StatCard label="Max Loss" value={`$${actualMaxLoss.toFixed(2)}`} colorClass="text-red-400" />
                      </div>
                      <div className="flex flex-col gap-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Take Profit</p>
                        <StatCard label="Ticks" value={displayResults.tpTicks.toFixed(2)} colorClass="text-emerald-400" />
                        <StatCard label="Points" value={displayResults.tpPoints.toFixed(2)} colorClass="text-emerald-400" />
                        <StatCard label="Max Profit" value={`$${actualMaxProfit.toFixed(2)}`} colorClass="text-emerald-400" />
                      </div>
                    </div>

                    <div className="border-t border-gray-800" />

                    {/* Risk / Reward */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Risk / Reward Ratio</span>
                      <span className={`text-2xl font-bold tabular-nums ${getRRColorClass(displayResults.riskRewardRatio)}`}>
                        1 : {displayResults.riskRewardRatio.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )
              })() : (
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 flex flex-col items-center justify-center gap-2 min-h-[220px]">
                  <p className="text-gray-500 text-sm">Enter entry price and stop loss to calculate</p>
                  <p className="text-gray-600 text-xs">Take profit is optional</p>
                </div>
              )
              }
            </div>

            {/* Contract Info Panel */}
            <div>
              <h2 className="text-base font-semibold text-gray-300 mb-3">Contract Details</h2>
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 flex items-center justify-between gap-3">
                  <span className="font-bold text-lg">{selectedContract.symbol}</span>
                  <span className="text-sm text-gray-400 flex-1">{selectedContract.name}</span>
                  {selectedContract.isMicro && (
                    <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded shrink-0">
                      MICRO
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-800">
                  {([
                    ['Tick Value per Point', `$${selectedContract.pointValue.toFixed(2)}`],
                    ['Tick Size', selectedContract.tickSize.toString()],
                    ['Ticks per Point', selectedContract.ticksPerPoint.toString()],
                    ['$ per Tick', `$${(selectedContract.pointValue / selectedContract.ticksPerPoint).toFixed(2)}`],
                    ['Exchange', selectedContract.exchange],
                    ['Formula', `Risk $ ÷ (SL pts × $${selectedContract.pointValue})`],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm text-white font-medium tabular-nums">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-gray-800/50 text-xs text-gray-500">
                  {selectedContract.description}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
