"""Predict fraud probability from wallet feature vector."""
import json
import sys
from pathlib import Path

import joblib
import numpy as np

BASE = Path(__file__).parent
MODEL_PATH = BASE / "models" / "fraud_model.joblib"
SCALER_PATH = BASE / "models" / "scaler.joblib"
META_PATH = BASE / "models" / "model_meta.json"


def predict(features: dict) -> dict:
    if not MODEL_PATH.exists():
        return {"error": "Model not trained. Run train_model.py first.", "probability": 0.0}

    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    meta = json.loads(META_PATH.read_text())
    feature_names = meta["features"]

    vector = [float(features.get(f, 0) or 0) for f in feature_names]
    scaled = scaler.transform([vector])
    prob = float(model.predict_proba(scaled)[0][1])

    return {
        "fraud_probability": round(prob, 4),
        "risk_contribution": round(prob * 100, 1),
        "model_auc": meta.get("auc_score"),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python predict.py '<json_features>'"}))
        sys.exit(1)

    payload = json.loads(sys.argv[1])
    print(json.dumps(predict(payload)))
