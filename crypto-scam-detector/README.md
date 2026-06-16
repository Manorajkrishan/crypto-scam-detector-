# Crypto Scam Detection Platform

A **risk analysis platform** for crypto wallets, tokens, and smart contracts. It does **not** claim to detect all scams — it surfaces suspicious indicators and assigns a risk score so users can make informed decisions.

## Architecture

```
crypto-scam-detector/
├── frontend/          React + TypeScript + Recharts (Vite)
├── backend/           Node.js + Express API
├── ml-model/          Python scikit-learn fraud classifier
└── README.md
```

## MVP Features

- Address input (wallet / token / contract)
- Etherscan blockchain data fetch (multi-chain via API v2)
- Local scam database (2,360 rug pull addresses from validated dataset)
- Optional Chainabuse live report lookup
- Rule-based + ML risk scoring (0–100)
- Dashboard with charts and issue breakdown
- PDF report download

## Risk Score Bands

| Score   | Level        |
|---------|--------------|
| 0–30    | Low Risk     |
| 31–70   | Medium Risk  |
| 71–100  | High Risk    |

## Datasets (Downloaded & Analyzed)

### 1. Rug Pull Dataset ([GitHub](https://github.com/dianxiang-sun/rug_pull_dataset))
- **2,360 unique** validated rug pull contract addresses (ETH + BSC, 2020–2023)
- Top rug types: Transaction Limitation (2,083), Fee manipulation (157), Token Generation (41)
- ~$199M documented losses in records with known amounts
- Exported to `backend/data/scam_addresses.json` for instant lookup

### 2. Ethereum Fraud Detection Dataset ([Kaggle](https://www.kaggle.com/datasets/vagifa/ethereum-frauddetection-dataset))
- **9,841 wallets** with 48 transaction features
- **22.14% fraud rate** (2,179 fraudulent, 7,662 legitimate)
- Fraud wallets show lower avg sent txns (5.2 vs 147.4) and lower ether balance
- Used to train Random Forest classifier — **AUC 0.987**, accuracy 95.1%

Run analysis anytime:
```bash
cd ml-model
python analyze_dataset.py
```

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Add your ETHERSCAN_API_KEY to .env
npm install
npm run dev
```

API runs at `http://localhost:3001`

### 2. ML Model (first time)

```bash
cd ml-model
pip install -r requirements.txt
python train_model.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## API Endpoints

| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | `/api/health`      | Health check             |
| POST   | `/api/analyze`       | Analyze address `{ address, chain }` |
| GET    | `/api/analyze/:address` | Analyze via GET       |
| POST   | `/api/report/pdf`    | Generate PDF report      |

## Environment Variables

| Variable             | Required | Description                    |
|----------------------|----------|--------------------------------|
| `ETHERSCAN_API_KEY`  | Yes*     | Etherscan API key              |
| `CHAINABUSE_API_KEY` | No       | Chainabuse screening API       |
| `DATABASE_URL`       | No       | PostgreSQL for scan history    |
| `PORT`               | No       | Default 3001                   |

\* Without Etherscan key, on-chain checks will fail. Scam DB + ML still work for known addresses.

## Test Addresses

Try a known rug pull address from the dataset:
```
0xc3c51c071e5f1eca09575ac35e90956ae3b27311
```

## Deployment

### Frontend (Vercel) — live

| Setting | Value |
|---------|-------|
| **Production URL** | https://frontend-phi-three-83.vercel.app |
| **VITE_API_URL** | `https://crypto-scam-detector-api.onrender.com/api` (set in Vercel Production + Preview) |

Redeploy after changing env vars: `cd frontend && vercel deploy --prod`

### Backend (Render)

1. Push this repo to GitHub
2. On [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect repo
3. Set environment variables:
   - `ETHERSCAN_API_KEY` — your Etherscan key
   - `FRONTEND_URL` — `https://frontend-phi-three-83.vercel.app`
   - `CHAINABUSE_API_KEY` — optional
4. Deploy — service URL will be `https://crypto-scam-detector-api.onrender.com`

The frontend is already configured to call that Render API URL.

## Disclaimer

This platform provides automated **risk analysis only**. It cannot detect all scams, rug pulls, or honeypots. Never rely solely on this tool for financial decisions. Always perform independent verification.

## Tech Stack

- Frontend: React, TypeScript, Recharts, Vite
- Backend: Node.js, Express, PDFKit, pg
- ML: Python, scikit-learn, pandas
- APIs: Etherscan v2, Chainabuse (optional)
- Database: PostgreSQL (optional)
