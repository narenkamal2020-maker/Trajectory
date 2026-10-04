"""
Trajectory ML inference service (stdlib HTTP server — no web framework needed).

    python ml/serve.py            # listens on $ML_PORT (default 8000)

Endpoints:
    GET  /health
    POST /predict/solve   {"rows": [{feature: value, ...}, ...]}  -> {"probabilities": [...]}
    POST /predict/role    {"text": "..."}                          -> {"roles": [{"role", "probability"}]}
"""
from __future__ import annotations

import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import joblib
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, "models")
MAX_BODY = 2 * 1024 * 1024
MAX_ROWS = 1000


class Models:
    def __init__(self):
        self.solve = None
        self.role = None
        self.metrics = {}
        self.reload()

    def reload(self):
        solve_path = os.path.join(MODELS, "solve_model.joblib")
        role_path = os.path.join(MODELS, "role_model.joblib")
        self.solve = joblib.load(solve_path) if os.path.exists(solve_path) else None
        self.role = joblib.load(role_path) if os.path.exists(role_path) else None
        metrics_path = os.path.join(MODELS, "metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, encoding="utf-8") as f:
                self.metrics = json.load(f)

    def predict_solve(self, rows):
        if self.solve is None:
            raise LookupError("solve model not trained — run python ml/train.py")
        feats = self.solve["features"]
        X = np.array([[float(r.get(k, 0) or 0) for k in feats] for r in rows], dtype=float)
        return [round(float(p), 4) for p in self.solve["model"].predict_proba(X)[:, 1]]

    def predict_role(self, text, top=3):
        if self.role is None:
            raise LookupError("role model not trained — run python ml/train.py")
        model = self.role["model"]
        probs = model.predict_proba([text.lower()])[0]
        order = np.argsort(probs)[::-1][:top]
        return [{"role": str(model.classes_[i]), "probability": round(float(probs[i]), 4)} for i in order]


MODELS_STATE = Models()


class Handler(BaseHTTPRequestHandler):
    server_version = "TrajectoryML/1.0"

    def _send(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            raise ValueError("body too large")
        return json.loads(self.rfile.read(length) or b"{}")

    def log_message(self, fmt, *args):  # quieter logs
        if os.environ.get("ML_VERBOSE"):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_GET(self):
        if self.path == "/health":
            return self._send(200, {
                "ok": True,
                "models": {"solve": MODELS_STATE.solve is not None, "role": MODELS_STATE.role is not None},
                "trained_at": MODELS_STATE.metrics.get("trained_at"),
            })
        self._send(404, {"error": "not found"})

    def do_POST(self):
        try:
            body = self._json_body()
            if self.path == "/predict/solve":
                rows = body.get("rows") or []
                if not isinstance(rows, list) or len(rows) > MAX_ROWS:
                    return self._send(400, {"error": f"rows must be a list of at most {MAX_ROWS}"})
                return self._send(200, {"probabilities": MODELS_STATE.predict_solve(rows) if rows else []})
            if self.path == "/predict/role":
                text = str(body.get("text") or "")
                if not text.strip():
                    return self._send(400, {"error": "text required"})
                return self._send(200, {"roles": MODELS_STATE.predict_role(text[:50000])})
            if self.path == "/admin/reload":
                # Disabled unless ML_ADMIN_TOKEN is configured; then requires the matching header.
                expected = os.environ.get("ML_ADMIN_TOKEN", "")
                given = self.headers.get("X-Admin-Token", "")
                if not expected or not hmac.compare_digest(expected, given):
                    return self._send(404, {"error": "not found"})
                MODELS_STATE.reload()
                return self._send(200, {"ok": True})
            self._send(404, {"error": "not found"})
        except LookupError as e:
            self._send(503, {"error": str(e)})
        except (ValueError, json.JSONDecodeError) as e:
            self._send(400, {"error": str(e)})


def main():
    port = int(os.environ.get("ML_PORT", "8000"))
    host = os.environ.get("ML_HOST", "127.0.0.1")
    httpd = ThreadingHTTPServer((host, port), Handler)
    print(f"Trajectory ML service on http://{host}:{port} (solve={MODELS_STATE.solve is not None}, role={MODELS_STATE.role is not None})", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
