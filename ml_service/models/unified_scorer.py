"""
Unified Trust Scorer — Aggregates all module scores into a single
Dynamic Trust Score for each session/action.

Response Matrix (from Team SACH architecture):
  80-100  ALLOW          - frictionless access
  60-79   OTP_REQUIRED   - step-up authentication token
  40-59   ALERT_CUSTOMER - notify + soft challenge
  20-39   HOLD           - freeze pending manual review
   0-19   BLOCK          - automatic block + fraud team alert
"""


class UnifiedScorer:

    WEIGHTS = {
        'behavioral': 0.30,
        'device':     0.25,
        'text_risk':  0.15,
        'recovery':   0.20,
        'insider':    0.10,
    }

    RESPONSE_MATRIX = [
        (80, 'ALLOW',          'Approved',          'Frictionless access — all signals within normal parameters.'),
        (60, 'OTP_REQUIRED',   'OTP_Required',      'Authentication token required before proceeding.'),
        (40, 'ALERT_CUSTOMER', 'CIF_Required',      'Customer notification dispatched. CIF verification required.'),
        (20, 'HOLD',           'Guardian_Required', 'Transaction held. Guardian multi-signature authorization required.'),
        (0,  'BLOCK',          'Rejected',          'Access blocked. Fraud Operations team alerted automatically.'),
    ]

    def compute_final_score(self, module_scores: dict) -> dict:
        weighted_sum = 0.0
        used_modules = []

        for module, weight in self.WEIGHTS.items():
            score = module_scores.get(module)
            if score is not None:
                weighted_sum += score * weight
                used_modules.append(module)

        final_risk = min(100, max(0, int(weighted_sum)))
        trust_score = 100 - final_risk

        action, status, description = 'BLOCK', 'Rejected', ''
        for threshold, act, stat, desc in self.RESPONSE_MATRIX:
            if trust_score >= threshold:
                action, status, description = act, stat, desc
                break

        return {
            'risk_score': final_risk,
            'trust_score': trust_score,
            'action': action,
            'status': status,
            'description': description,
            'module_breakdown': module_scores,
            'modules_used': used_modules,
        }
