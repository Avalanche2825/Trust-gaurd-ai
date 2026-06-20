"""
Device Trust Engine — Module 2 of SACH Kavach

Random Forest classifier trained on device signal combinations.
Evaluates: IP origin, geolocation consistency, OS fingerprint,
emulator detection, VPN usage, SIM swap recency.

Returns Device Trust Score: 0-100 (higher = more risky)
"""

import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier


class DeviceTrustEngine:

    IP_RISK_MAP = {
        'trusted': 0,
        'residential': 1,
        'datacenter': 2,
        'vpn': 2,
        'tor': 3,
        'known_fraud': 3,
    }

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42,
            class_weight='balanced'
        )
        self._train_on_synthetic_baseline()

    def _train_on_synthetic_baseline(self):
        """
        Train on synthetic device profiles: trusted (0) vs risky (1)
        Features: [is_new_device, ip_risk(0-3), geo_mismatch, os_mismatch,
                   is_emulator, vpn_detected, sim_swap_recent, velocity(0-10)]
        """
        X = np.array([
            # Trusted profiles
            [0, 0, 0, 0, 0, 0, 0, 1],
            [0, 1, 0, 0, 0, 0, 0, 1],
            [0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [0, 1, 0, 0, 0, 1, 0, 2],
            [0, 0, 0, 0, 0, 0, 0, 3],
            [1, 1, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 1, 0, 0, 0, 1],
            # Risky profiles
            [1, 3, 1, 1, 0, 0, 0, 5],
            [1, 2, 1, 0, 1, 0, 0, 4],
            [0, 3, 1, 1, 1, 1, 0, 8],
            [1, 3, 1, 1, 1, 1, 0, 9],
            [1, 2, 0, 1, 1, 0, 0, 6],
            [0, 1, 0, 0, 0, 0, 1, 3],
            [1, 2, 1, 0, 0, 1, 1, 7],
            [0, 3, 1, 1, 0, 0, 1, 10],
        ])
        y = np.array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1])
        self.model.fit(X, y)

    def classify_ip(self, ip: str) -> int:
        if not ip:
            return 1
        datacenter_prefixes = ['103.', '45.', '18.', '52.', '34.', '35.', '104.', '13.']
        malicious_prefixes = ['103.88.', '185.220.', '198.98.', '179.61.']
        for prefix in malicious_prefixes:
            if ip.startswith(prefix):
                return 3
        for prefix in datacenter_prefixes:
            if ip.startswith(prefix):
                return 2
        return 1

    def score(self, signals: dict) -> dict:
        ip = signals.get('current_ip', '')
        ip_risk = signals.get('ip_risk_level', self.classify_ip(ip))

        feature_vector = np.array([[
            int(bool(signals.get('is_new_device', False))),
            int(ip_risk),
            int(bool(signals.get('geo_mismatch', False))),
            int(bool(signals.get('os_mismatch', False))),
            int(bool(signals.get('is_emulator', False))),
            int(bool(signals.get('vpn_detected', False))),
            int(bool(signals.get('sim_swap_recent', False))),
            int(signals.get('login_attempt_velocity', 1)),
        ]])

        prob_risky = float(self.model.predict_proba(feature_vector)[0][1])
        risk_score = int(prob_risky * 100)

        importances = {
            name: round(float(imp), 3)
            for name, imp in zip(
                ['new_device', 'ip_risk', 'geo_mismatch', 'os_mismatch',
                 'emulator', 'vpn', 'sim_swap', 'velocity'],
                self.model.feature_importances_
            )
        }

        factors = []
        raw = feature_vector[0]
        if raw[0] == 1:
            factors.append("Device fingerprint not found in trusted registry")
        if raw[1] >= 3:
            factors.append(f"IP address {ip} classified as high-risk origin")
        elif raw[1] == 2:
            factors.append("Session routed through datacenter or proxy infrastructure")
        if raw[2] == 1:
            factors.append("Geographic origin inconsistent with account login history")
        if raw[3] == 1:
            factors.append("Operating system fingerprint differs from registered device profile")
        if raw[4] == 1:
            factors.append("Virtualized environment detected — emulator or virtual machine")
        if raw[5] == 1:
            factors.append("VPN or anonymizing proxy detected in session routing")
        if raw[6] == 1:
            factors.append("SIM swap event registered within 72 hours — OTP-based verification bypassed")
        if raw[7] >= 5:
            factors.append(f"Elevated login velocity: {int(raw[7])} attempts detected in session window")

        return {
            'risk_score': risk_score,
            'factors': factors,
            'feature_importances': importances,
            'ip_classification': ip_risk,
        }

    def save(self, directory: str = 'ml_service/saved_models'):
        os.makedirs(directory, exist_ok=True)
        joblib.dump(self.model, os.path.join(directory, 'device_engine.pkl'))

    def load(self, directory: str = 'ml_service/saved_models'):
        path = os.path.join(directory, 'device_engine.pkl')
        if os.path.exists(path):
            self.model = joblib.load(path)
