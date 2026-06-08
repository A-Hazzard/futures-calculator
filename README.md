# Futures Calculator

A modern, high-performance web application for calculating futures trading metrics, position sizing, and risk management parameters.

Built with **Next.js 15+**, **TypeScript**, **Tailwind CSS**, and **Bun**, it provides traders with an intuitive interface to compute P&L, margin requirements, and optimal position sizes across multiple futures contracts.

---

## Key Features

- 📊 **Multi-Contract Support**: Comprehensive support for major futures contracts (E-mini S&P 500, Micro E-mini S&P 500, Crude Oil, Gold, Forex, and more)
- 🎯 **Position Sizing Calculator**: Automatically compute optimal position sizes based on risk parameters
- 💰 **P&L Calculations**: Real-time profit/loss calculations with multiple price scenarios
- 📈 **Margin Requirements**: Instant margin requirements and available equity calculations
- 🔒 **Professional-Grade UI**: Clean, responsive dark-mode interface built with Tailwind CSS
- ⚡ **Fast & Lightweight**: Optimized Next.js app with zero external dependencies for calculations

---

## Technical Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + CSS Modules
- **Runtime**: Bun (or Node.js compatible)
- **API**: Next.js Route Handlers

---

## Getting Started

### Prerequisites
- Node.js 18+ or Bun 1.0+
- npm, pnpm, or Bun package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/A-Hazzard/futures-calculator.git
   cd futures-calculator
   ```

2. **Install dependencies**:
   ```bash
   bun install
   # or
   npm install
   # or
   pnpm install
   ```

3. **Run the development server**:
   ```bash
   bun run dev
   # or
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
bun run build
bun run start
```

---

## Project Structure

```
app/
  page.tsx              Main calculator page
  layout.tsx            Root layout
  api/
    futures-price/      API endpoint for real-time futures prices
  globals.css           Global styles

components/
  futures-calculator/   Main calculator component

lib/
  utils/
    calculations.ts     Core calculation utilities
    contracts.ts        Futures contract definitions & specs

public/                 Static assets

.instructions/          Development guidelines
  rules/
    naming-conventions.md
    nextjs-rules.md
    type-safety.md
```

---

## Usage

1. **Select a futures contract** from the dropdown
2. **Enter your trading parameters**:
   - Entry price
   - Exit price (or target profit)
   - Stop loss level
   - Account balance
   - Risk percentage per trade

3. **View instant calculations**:
   - Required margin
   - Position size (contracts)
   - Profit/Loss on target
   - Risk-to-reward ratio

---

## Supported Contracts

The calculator includes specifications for:

- **Index Futures**: ES (E-mini S&P 500), MES (Micro E-mini S&P 500), NQ (E-mini Nasdaq 100), MNQ (Micro E-mini Nasdaq 100)
- **Commodity Futures**: CL (Crude Oil), GC (Gold), ZB (30-Year T-Bonds)
- **Forex Futures**: EUR/USD, GBP/USD, USD/JPY
- **Crypto Futures**: BTC, ETH

Add more contracts in `lib/utils/contracts.ts`.

---

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint configured for Next.js
- Tailwind CSS for styling (no external UI libraries)

### Building & Testing

```bash
# Lint
bun run lint

# Type check
bun run build
```

---

## API Reference

### `GET /api/futures-price`

Fetch current futures prices for a specific contract.

**Query Parameters:**
- `symbol` (string, required): Futures contract symbol (e.g., 'ES', 'NQ', 'GC')

**Response:**
```json
{
  "symbol": "ES",
  "price": 5234.50,
  "bid": 5234.25,
  "ask": 5234.75,
  "timestamp": 1234567890000
}
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Steps to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit with a clear message (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Support

For issues, feature requests, or questions:
- Open an [Issue](https://github.com/A-Hazzard/futures-calculator/issues)
- Contact: [Aaron Hazzard](mailto:aaronsploit@gmail.com)

---

## Disclaimer

This calculator is provided for **educational and informational purposes only**. It does not constitute financial advice. Always consult with a financial advisor before making trading decisions. Past performance does not guarantee future results. Futures trading involves substantial risk of loss.

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Package manager: [Bun](https://bun.sh)
