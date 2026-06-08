/**
 * Futures Price API Route
 *
 * Proxies Yahoo Finance to fetch real-time futures prices.
 * Free, no API key required.
 *
 * @module app/api/futures-price/route
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/futures-price?symbol=MNQ
 *
 * Flow:
 * 1. Validate symbol param
 * 2. Fetch from Yahoo Finance chart API
 * 3. Extract regularMarketPrice and return
 */
export async function GET(request: NextRequest) {
  // ============================================================================
  // STEP 1: Validate symbol param
  // ============================================================================
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
  }

  const yahooSymbol = symbol.includes('=F') ? symbol : `${symbol}=F`

  // ============================================================================
  // STEP 2: Fetch from Yahoo Finance
  // ============================================================================
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 30 },
      },
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Price fetch failed' }, { status: 502 })
    }

    // ============================================================================
    // STEP 3: Extract price and return
    // ============================================================================
    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      return NextResponse.json({ error: 'No data returned for symbol' }, { status: 404 })
    }

    const price = result.meta.regularMarketPrice as number

    return NextResponse.json({ price, symbol: yahooSymbol })
  } catch (e) {
    console.error('[futures-price] Error:', e instanceof Error ? e.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 500 })
  }
}
