"""
Train Trajectory's models.

    python ml/train.py                 # synthetic bootstrap + any real data in ml/data/
    python ml/train.py --real-only     # only real exported data (needs enough rows)

Outputs ml/models/{solve_model,role_model}.joblib and ml/models/metrics.json.
Run `npm run ml:export` in backend/ first to refresh ml/data/ from Oracle.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone

import joblib
import numpy as np
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, brier_score_loss, f1_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split
from sklearn.pipeline import make_pipeline

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from trajectory_ml.features import SOLVE_FEATURES  # noqa: E402
from trajectory_ml.synthetic import simulate_solve_events, synthesize_resumes  # noqa: E402

DATA = os.path.join(HERE, "data")
MODELS = os.path.join(HERE, "models")
MIN_REAL_ROWS = 200
# Each real event counts as this many synthetic ones, so real usage quickly overrides the simulated prior.
REAL_WEIGHT = 20.0


def load_real_submissions():
    path = os.path.join(DATA, "submissions.csv")
    if not os.path.exists(path):
        return np.empty((0, len(SOLVE_FEATURES))), np.empty(0, dtype=int), np.empty(0, dtype=object)
    X, y, groups = [], [], []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            X.append([float(row[k]) for k in SOLVE_FEATURES])
            y.append(int(float(row["label"])))
            groups.append(row["user"])
    return np.array(X, dtype=float), np.array(y, dtype=int), np.array(groups, dtype=object)


def load_real_resumes():
    path = os.path.join(DATA, "resumes.jsonl")
    if not os.path.exists(path):
        return [], []
    texts, labels = [], []
    with open(path, encoding="utf-8") as f:
        for line in f:
            obj = json.loads(line)
            texts.append(obj["text"].lower())
            labels.append(obj["role"])
    return texts, labels


def train_solve_model(real_only: bool):
    Xr, yr, gr = load_real_submissions()
    report = {"real_rows": int(len(yr))}
    if real_only:
        if len(yr) < MIN_REAL_ROWS:
            raise SystemExit(f"Only {len(yr)} real rows; need {MIN_REAL_ROWS} for --real-only")
        X, y, groups = Xr, yr, gr
        report["synthetic_rows"] = 0
    else:
        Xs, ys = simulate_solve_events()
        groups_s = np.array([f"syn{i // 70}" for i in range(len(ys))], dtype=object)
        X = np.vstack([Xs, Xr]) if len(yr) else Xs
        y = np.concatenate([ys, yr]) if len(yr) else ys
        groups = np.concatenate([groups_s, gr]) if len(yr) else groups_s
        report["synthetic_rows"] = int(len(ys))
        report["real_weight"] = REAL_WEIGHT

    # Split by learner so the test set measures generalization to unseen people.
    split = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=0)
    train_idx, test_idx = next(split.split(X, y, groups))
    base = HistGradientBoostingClassifier(max_iter=250, learning_rate=0.06, max_leaf_nodes=24, l2_regularization=1.0, random_state=0)
    model = CalibratedClassifierCV(base, method="isotonic", cv=3)
    weights = np.where(np.char.startswith(groups.astype(str), "syn"), 1.0, REAL_WEIGHT)
    model.fit(X[train_idx], y[train_idx], sample_weight=weights[train_idx])
    p = model.predict_proba(X[test_idx])[:, 1]
    report.update({
        "test_rows": int(len(test_idx)),
        "auc": round(float(roc_auc_score(y[test_idx], p)), 4),
        "brier": round(float(brier_score_loss(y[test_idx], p)), 4),
        "base_rate": round(float(y[test_idx].mean()), 4),
    })

    # Separate check on real data only (honest signal once real volume exists).
    if len(yr) >= 50 and len(set(yr)) == 2:
        pr = model.predict_proba(Xr)[:, 1]
        report["real_data_auc_in_sample"] = round(float(roc_auc_score(yr, pr)), 4)

    model.fit(X, y, sample_weight=weights)  # refit on everything for serving
    joblib.dump({"model": model, "features": SOLVE_FEATURES}, os.path.join(MODELS, "solve_model.joblib"))
    return report


def train_role_model(real_only: bool):
    tr, lr = load_real_resumes()
    if real_only:
        texts, labels = tr, lr
    else:
        ts, ls = synthesize_resumes()
        texts, labels = ts + tr, ls + lr
    if len(set(labels)) < 2:
        raise SystemExit("Not enough role labels to train the role model")
    X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=0, stratify=labels)
    pipe = make_pipeline(
        TfidfVectorizer(ngram_range=(1, 2), min_df=1, sublinear_tf=True, token_pattern=r"(?u)\b[\w./+#-]+\b"),
        LogisticRegression(max_iter=2000, C=4.0),
    )
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)
    report = {
        "real_rows": len(tr),
        "synthetic_rows": 0 if real_only else len(texts) - len(tr),
        "test_rows": len(y_test),
        "accuracy": round(float(accuracy_score(y_test, pred)), 4),
        "macro_f1": round(float(f1_score(y_test, pred, average="macro")), 4),
        "classes": sorted(set(labels)),
    }
    pipe.fit(texts, labels)
    joblib.dump({"model": pipe}, os.path.join(MODELS, "role_model.joblib"))
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--real-only", action="store_true")
    args = ap.parse_args()
    os.makedirs(MODELS, exist_ok=True)
    metrics = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "solve_model": train_solve_model(args.real_only),
        "role_model": train_role_model(args.real_only),
        "note": "Synthetic rows bootstrap the models until real usage data accumulates; retrain regularly with `npm run ml:export` + this script.",
    }
    with open(os.path.join(MODELS, "metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
