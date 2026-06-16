"""Analyze rug pull and Ethereum fraud datasets."""
import json
import os
from pathlib import Path

import pandas as pd

BASE = Path(__file__).parent / "dataset"
RUG_PULL = BASE / "rug_pull" / "rugpull_dataset.csv"
FRAUD = BASE / "ethereum_fraud" / "transaction_dataset.csv"
OUTPUT = Path(__file__).parent / "analysis_report.json"


def analyze_rug_pull() -> dict:
    df = pd.read_csv(RUG_PULL)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    addr_col = "address" if "address" in df.columns else "Address".lower()

    losses = df["losses"].astype(str).str.replace(r"[\$,]", "", regex=True)
    numeric_losses = pd.to_numeric(losses.replace("Unknown", pd.NA), errors="coerce")

    return {
        "total_incidents": int(len(df)),
        "chains": df["chain"].value_counts().to_dict() if "chain" in df.columns else {},
        "rug_types": df["type"].value_counts().head(10).to_dict() if "type" in df.columns else {},
        "unique_addresses": int(df[addr_col].str.lower().nunique()),
        "known_loss_total_usd": float(numeric_losses.sum(skipna=True)),
        "avg_loss_usd": float(numeric_losses.mean(skipna=True)),
        "sample_addresses": df[addr_col].str.lower().head(5).tolist(),
    }


def analyze_fraud() -> dict:
    df = pd.read_csv(FRAUD)
    df.columns = [c.strip() for c in df.columns]

    fraud_count = int((df["FLAG"] == 1).sum())
    legit_count = int((df["FLAG"] == 0).sum())

    fraud_df = df[df["FLAG"] == 1]
    legit_df = df[df["FLAG"] == 0]

    def safe_mean(frame, col):
        if col not in frame.columns:
            return None
        return float(frame[col].mean())

    return {
        "total_wallets": int(len(df)),
        "fraud_wallets": fraud_count,
        "legitimate_wallets": legit_count,
        "fraud_rate_pct": round(fraud_count / len(df) * 100, 2),
        "avg_sent_tnx_fraud": safe_mean(fraud_df, "Sent tnx"),
        "avg_sent_tnx_legit": safe_mean(legit_df, "Sent tnx"),
        "avg_received_tnx_fraud": safe_mean(fraud_df, "Received Tnx"),
        "avg_received_tnx_legit": safe_mean(legit_df, "Received Tnx"),
        "avg_ether_balance_fraud": safe_mean(fraud_df, "total ether balance"),
        "avg_ether_balance_legit": safe_mean(legit_df, "total ether balance"),
        "feature_columns": len(df.columns) - 3,
    }


def main():
    report = {
        "rug_pull_dataset": analyze_rug_pull(),
        "ethereum_fraud_dataset": analyze_fraud(),
    }
    OUTPUT.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    print(f"\nReport saved to {OUTPUT}")


if __name__ == "__main__":
    main()
