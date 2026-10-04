"""Run: python -m unittest discover -s ml/tests  (after python ml/train.py)"""
import json
import os
import sys
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)

from trajectory_ml.features import SOLVE_FEATURES, ROLE_KEYWORDS  # noqa: E402
from trajectory_ml.synthetic import simulate_solve_events, synthesize_resumes  # noqa: E402

MODELS_READY = os.path.exists(os.path.join(ROOT, "models", "solve_model.joblib"))


class SyntheticDataTest(unittest.TestCase):
    def test_solve_events_shape_and_balance(self):
        X, y = simulate_solve_events(n_learners=20, events_per_learner=10)
        self.assertEqual(X.shape, (200, len(SOLVE_FEATURES)))
        self.assertTrue(0.2 < y.mean() < 0.95)
        self.assertTrue((X[:, 2] >= 0).all() and (X[:, 2] <= 2).all())

    def test_resumes_cover_every_role(self):
        texts, labels = synthesize_resumes(per_role=3)
        self.assertEqual(set(labels), set(ROLE_KEYWORDS))
        self.assertTrue(all(len(t.split()) > 10 for t in texts))


@unittest.skipUnless(MODELS_READY, "train models first: python ml/train.py")
class ModelBehaviourTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import serve
        cls.serve = serve
        cls.models = serve.Models()

    def row(self, **kw):
        base = dict(proficiency=40, min_proficiency=35, difficulty=1, attempts_on_skill=5,
                    prior_attempts_on_question=0, solve_rate=0.5, days_since_practice=1)
        base.update(kw)
        return base

    def test_probabilities_are_valid(self):
        probs = self.models.predict_solve([self.row(), self.row(difficulty=0)])
        self.assertTrue(all(0 <= p <= 1 for p in probs))

    def test_monotonic_in_proficiency_and_difficulty(self):
        low, high = self.models.predict_solve([self.row(proficiency=10, min_proficiency=5), self.row(proficiency=85, min_proficiency=80)])
        self.assertGreater(high, low)
        easy, hard = self.models.predict_solve([self.row(difficulty=0, solve_rate=0.8), self.row(difficulty=2, solve_rate=0.2)])
        self.assertGreater(easy, hard)

    def test_role_model_recognizes_profiles(self):
        fe = self.models.predict_role("react typescript css next.js accessibility tailwind redux frontend")
        self.assertEqual(fe[0]["role"], "Frontend Developer")
        ops = self.models.predict_role("kubernetes terraform aws ci/cd jenkins prometheus linux")
        self.assertEqual(ops[0]["role"], "DevOps Engineer")

    def test_http_endpoints(self):
        httpd = ThreadingHTTPServer(("127.0.0.1", 0), self.serve.Handler)
        port = httpd.server_address[1]
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        try:
            def post(path, payload):
                req = urllib.request.Request(f"http://127.0.0.1:{port}{path}", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=5) as r:
                    return json.loads(r.read())
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=5) as r:
                self.assertTrue(json.loads(r.read())["models"]["solve"])
            self.assertEqual(len(post("/predict/solve", {"rows": [self.row(), self.row()]})["probabilities"]), 2)
            self.assertEqual(len(post("/predict/role", {"text": "python pandas sql tableau dashboards"})["roles"]), 3)
            with self.assertRaises(urllib.error.HTTPError) as ctx:
                post("/predict/role", {"text": ""})
            self.assertEqual(ctx.exception.code, 400)
        finally:
            httpd.shutdown()


if __name__ == "__main__":
    unittest.main()
