"""
Synthetic bootstrap data, used until enough real events have been collected.

Solve events come from a simulated population of learners under a 2-parameter logistic (IRT)
model: each learner has a latent ability per skill that grows with practice and decays when idle;
the platform only observes a noisy, lagging proficiency estimate (as the Elo model in the backend
would produce). The model therefore has to learn how observed features relate to real outcomes.
"""
from __future__ import annotations

import numpy as np

from .features import ROLE_KEYWORDS, FILLER


def simulate_solve_events(n_learners: int = 600, events_per_learner: int = 70, seed: int = 7):
    rng = np.random.default_rng(seed)
    n_questions = 120
    q_difficulty = rng.integers(0, 3, n_questions)                 # 0/1/2
    q_b = np.array([20.0, 45.0, 70.0])[q_difficulty] + rng.normal(0, 8, n_questions)
    q_a = rng.uniform(0.06, 0.14, n_questions)                     # discrimination
    q_solve_rate = np.clip(1 / (1 + np.exp(-0.1 * (45 - q_b))) + rng.normal(0, 0.05, n_questions), 0.02, 0.98)

    rows, labels = [], []
    for _ in range(n_learners):
        talent = rng.normal(0, 12)
        ability = np.clip(rng.normal(25 + talent, 10), 0, 100)
        estimate = max(0.0, ability + rng.normal(-8, 10))          # platform estimate lags reality
        attempts_on_skill = int(rng.integers(0, 6))
        days_idle = float(rng.exponential(4))
        tried: dict[int, int] = {}
        for _ in range(events_per_learner):
            q = int(rng.integers(0, n_questions))
            effective = ability - 0.35 * min(days_idle, 30)          # forgetting
            p = 1 / (1 + np.exp(-q_a[q] * (effective - q_b[q])))
            prior = tried.get(q, 0)
            p = min(0.99, p + 0.08 * prior)                         # familiarity on retries
            solved = rng.random() < p
            rows.append([
                round(float(estimate), 2),
                round(float(max(0.0, estimate - abs(rng.normal(0, 8)))), 2),
                int(q_difficulty[q]),
                attempts_on_skill,
                prior,
                round(float(q_solve_rate[q]), 3),
                round(days_idle, 2),
            ])
            labels.append(int(solved))
            # Learning dynamics.
            ability = float(np.clip(ability + (2.5 if solved else 1.0) * rng.uniform(0.5, 1.5), 0, 100))
            estimate = float(np.clip(estimate + (0.3 * (ability - estimate)) + rng.normal(0, 2), 0, 100))
            attempts_on_skill += 1
            tried[q] = prior + 1
            days_idle = float(rng.exponential(1.5)) if rng.random() < 0.8 else float(rng.exponential(10))
    return np.array(rows, dtype=float), np.array(labels, dtype=int)


def synthesize_resumes(per_role: int = 120, seed: int = 11):
    rng = np.random.default_rng(seed)
    roles = list(ROLE_KEYWORDS)
    texts, labels = [], []
    for role in roles:
        own = ROLE_KEYWORDS[role]
        others = [k for r in roles if r != role for k in ROLE_KEYWORDS[r]]
        for _ in range(per_role):
            k_own = rng.choice(own, size=int(rng.integers(5, 11)), replace=False).tolist()
            k_other = rng.choice(others, size=int(rng.integers(1, 6)), replace=False).tolist()
            filler = rng.choice(FILLER, size=int(rng.integers(8, 20))).tolist()
            words = k_own + k_other + filler
            rng.shuffle(words)
            texts.append(" ".join(words))
            labels.append(role)
    return texts, labels
