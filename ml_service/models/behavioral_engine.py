"""
Behavioral Trust Engine — Module 1 of SACH Kavach

Implements Isolation Forest anomaly detection to identify sessions
that deviate from a customer's established behavioral baseline.

Methodology:
  - Collects 8 behavioral features per session
  - Trains per-customer model on historical session data
  - Compares current session against personal baseline
  - Applies peer-group comparison (sub-group divide) as secondary signal
  - Returns risk score 0-100 (higher = more anomalous)

Academic basis: Liu, Fei Tony, Kai Ming Ting, and Zhi-Hua Zhou.
"Isolation forest." ICDM 2008.
"""

import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class BehavioralTrustEngine:

    FEATURE_NAMES = [
        'login_hour',
        'transaction_amount_inr',
        'amount_to_avg_ratio',
        'is_new_device',
        'is_new_location',
        'session_duration_minutes',
        'navigation_screen_depth',
        'actions_per_minute',
    ]

    def __init__(self):
        self.customer_models = {}
        self.peer_group_baselines = {}

    def extract_features(self, session: dict) -> list:
        return [
            float(session.get('login_hour', 12)),
            float(session.get('transaction_amount', 0)),
            float(session.get('amount_ratio', 1.0)),
            float(1 if session.get('is_new_device') else 0),
            float(1 if session.get('is_new_location') else 0),
            float(session.get('session_duration_minutes', 5)),
            float(session.get('navigation_depth', 3)),
            float(session.get('actions_per_minute', 2)),
        ]

    def build_peer_group_key(self, customer_meta: dict) -> str:
        city_tier = customer_meta.get('city_tier', 'tier1')
        account_type = customer_meta.get('account_type', 'savings')
        return f"{city_tier}_{account_type}"

    def train_customer_model(self, cif: str, historical_sessions: list):
        if len(historical_sessions) < 5:
            return

        features = [self.extract_features(s) for s in historical_sessions]
        X = np.array(features)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        model = IsolationForest(
            contamination=0.1,
            n_estimators=100,
            max_samples='auto',
            random_state=42
        )
        model.fit(X_scaled)

        self.customer_models[cif] = {
            'model': model,
            'scaler': scaler,
            'sample_count': len(historical_sessions),
            'feature_means': X.mean(axis=0).tolist(),
        }

    def update_peer_group(self, group_key: str, session: dict):
        if group_key not in self.peer_group_baselines:
            self.peer_group_baselines[group_key] = []
        features = self.extract_features(session)
        self.peer_group_baselines[group_key].append(features)
        if len(self.peer_group_baselines[group_key]) > 500:
            self.peer_group_baselines[group_key] = \
                self.peer_group_baselines[group_key][-500:]

    def score(self, cif: str, session: dict, customer_meta: dict = None) -> dict:
        factors = []
        peer_comparison = {}

        if cif in self.customer_models:
            entry = self.customer_models[cif]
            features = self.extract_features(session)
            X = entry['scaler'].transform([features])
            raw_score = entry['model'].decision_function(X)[0]
            risk_score = int(max(0, min(100, (-raw_score + 0.5) * 100)))

            means = entry['feature_means']
            current = features
            deviations = [abs(c - m) / (m + 1) for c, m in zip(current, means)]

            if deviations[2] > 2.0:
                factors.append(
                    f"Transaction amount is {session.get('amount_ratio', 1):.1f}x "
                    f"above personal historical average"
                )
            if current[0] != means[0] and abs(current[0] - means[0]) > 5:
                factors.append(
                    f"Login at hour {int(current[0])} deviates "
                    f"{abs(current[0] - means[0]):.0f} hours from personal pattern"
                )
            if current[3] == 1:
                factors.append("Session initiated from an unrecognized device")
            if current[4] == 1:
                factors.append("Geographic origin inconsistent with login history")

            model_used = 'isolation_forest'
        else:
            risk_score, factors = self._heuristic_score(session)
            model_used = 'heuristic'

        if customer_meta:
            group_key = self.build_peer_group_key(customer_meta)
            if group_key in self.peer_group_baselines \
                    and len(self.peer_group_baselines[group_key]) >= 10:
                group_features = np.array(self.peer_group_baselines[group_key])
                group_means = group_features.mean(axis=0)
                current_features = self.extract_features(session)
                peer_avg_ratio = float(group_means[2])
                current_ratio = float(current_features[2])
                delta = current_ratio - peer_avg_ratio
                if delta > 3.0:
                    factors.append(
                        f"Transaction is {delta:.1f}x above peer group average "
                        f"for similar customer profiles"
                    )
                    risk_score = min(100, risk_score + 10)
                peer_comparison = {
                    'group_avg_amount_ratio': round(peer_avg_ratio, 2),
                    'current_ratio': round(current_ratio, 2),
                    'delta': round(delta, 2),
                    'group_size': len(self.peer_group_baselines[group_key])
                }

        return {
            'risk_score': risk_score,
            'factors': factors,
            'peer_comparison': peer_comparison,
            'model_used': model_used,
        }

    def _heuristic_score(self, session: dict) -> tuple:
        score = 10
        factors = []

        ratio = session.get('amount_ratio', 1.0)
        if ratio > 8:
            score += 45
            factors.append(f"Critical: transfer amount is {ratio:.1f}x above customer average")
        elif ratio > 5:
            score += 35
            factors.append(f"Transfer amount is {ratio:.1f}x above customer average")
        elif ratio > 2:
            score += 15
            factors.append(f"Transfer amount is {ratio:.1f}x above customer average")

        hour = session.get('login_hour', 12)
        if hour < 6 or hour > 22:
            score += 20
            factors.append(f"Login at {hour:02d}:00 falls outside customer's typical activity window")

        if session.get('is_new_device'):
            score += 25
            factors.append("Session initiated from an unrecognized device")

        if session.get('is_new_location'):
            score += 20
            factors.append("Geographic origin inconsistent with login history")

        if session.get('is_emulator'):
            score += 30
            factors.append("Virtualized environment detected in session fingerprint")

        return min(100, score), factors

    def save_models(self, directory: str = 'ml_service/saved_models'):
        os.makedirs(directory, exist_ok=True)
        joblib.dump(
            {'customer_models': self.customer_models,
             'peer_groups': self.peer_group_baselines},
            os.path.join(directory, 'behavioral_engine.pkl')
        )

    def load_models(self, directory: str = 'ml_service/saved_models'):
        path = os.path.join(directory, 'behavioral_engine.pkl')
        if os.path.exists(path):
            data = joblib.load(path)
            self.customer_models = data.get('customer_models', {})
            self.peer_group_baselines = data.get('peer_groups', {})
