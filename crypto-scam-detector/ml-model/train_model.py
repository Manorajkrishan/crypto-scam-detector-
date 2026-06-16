"""Train fraud detection model on Ethereum transaction dataset."""
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

BASE = Path(__file__).parent
DATA = BASE / "dataset" / "ethereum_fraud" / "transaction_dataset.csv"
RUG = BASE / "dataset" / "rug_pull" / "rugpull_dataset.csv"
MODEL_DIR = BASE / "models"
MODEL_PATH = MODEL_DIR / "fraud_model.joblib"
SCALER_PATH = MODEL_DIR / "scaler.joblib"
META_PATH = MODEL_DIR / "model_meta.json"

FEATURES = [
    "Avg min between sent tnx",
    "Avg min between received tnx",
    "Time Diff between first and last (Mins)",
    "Sent tnx",
    "Received Tnx",
    "Number of Created Contracts",
    "Unique Received From Addresses",
    "Unique Sent To Addresses",
    "min value received",
    "max value received ",
    "avg val received",
    "min val sent",
    "max val sent",
    "avg val sent",
    "total transactions (including tnx to create contract",
    "total Ether sent",
    "total ether received",
    "total ether balance",
    " Total ERC20 tnxs",
    " ERC20 total Ether received",
    " ERC20 total ether sent",
    " ERC20 uniq sent addr",
    " ERC20 uniq rec addr",
]


def load_rug_pull_addresses() -> set[str]:
    if not RUG.exists():
        return set()
    df = pd.read_csv(RUG)
    col = "address" if "address" in df.columns else df.columns[2]
    return set(df[col].astype(str).str.lower().str.strip())


def prepare_data():
    df = pd.read_csv(DATA)
    available = [f for f in FEATURES if f in df.columns]
    X = df[available].copy()
    X = X.replace([np.inf, -np.inf], np.nan).fillna(0)
    y = df["FLAG"].astype(int)
    addresses = df["Address"].str.lower()
    return X, y, available, addresses


def main():
    MODEL_DIR.mkdir(exist_ok=True)
    X, y, feature_names, addresses = prepare_data()
    rug_addresses = load_rug_pull_addresses()

    X_train, X_test, y_train, y_test, addr_train, addr_test = train_test_split(
        X, y, addresses, test_size=0.2, random_state=42, stratify=y
    )

    # Boost labels for wallets that appear in rug pull dataset
    rug_mask = addr_train.isin(rug_addresses)
    y_train = y_train.copy()
    y_train.loc[rug_mask] = 1

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    auc = roc_auc_score(y_test, y_prob)
    report = classification_report(y_test, y_pred, output_dict=True)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    importances = dict(
        sorted(
            zip(feature_names, model.feature_importances_.tolist()),
            key=lambda x: x[1],
            reverse=True,
        )[:10]
    )

    meta = {
        "features": feature_names,
        "auc_score": round(float(auc), 4),
        "classification_report": report,
        "top_features": importances,
        "rug_pull_addresses_loaded": len(rug_addresses),
        "training_samples": int(len(X_train)),
    }
    META_PATH.write_text(json.dumps(meta, indent=2))

    print(f"Model saved to {MODEL_PATH}")
    print(f"AUC: {auc:.4f}")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
