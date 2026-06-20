"""
SACH Kavach — Python ML Microservice
Flask server exposing all trained ML model endpoints.
Consumed internally by the Node.js Express server on port 5001.
"""

import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

# Ensure models package is importable
sys.path.insert(0, os.path.dirname(__file__))

from models.behavioral_engine import BehavioralTrustEngine
from models.device_engine import DeviceTrustEngine
from models.insider_engine import InsiderThreatEngine
from models.text_risk_engine import TextRiskEngine
from models.kyc_graph_engine import KYCGraphEngine
from models.unified_scorer import UnifiedScorer

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get('ML_PORT', 5001))

# Initialize all engines at startup
print("\n=== SACH Kavach ML Engine Initializing ===")
behavioral = BehavioralTrustEngine()
device_engine = DeviceTrustEngine()
insider = InsiderThreatEngine()
text_risk = TextRiskEngine()
kyc_graph = KYCGraphEngine()
unified = UnifiedScorer()

behavioral.load_models()
print("  Behavioral Engine:  Isolation Forest — READY")
print(f"  Device Engine:      Random Forest ({device_engine.model.n_estimators} estimators) — READY")
print("  Insider Engine:     Statistical Baseline Scorer — READY")
print("  KYC Graph Engine:   Relationship Graph Analyzer — READY")
print("  Unified Scorer:     Weighted Aggregator — READY")
print("===========================================\n")


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'active',
        'service': 'SACH Kavach ML Engine',
        'port': PORT,
        'models': {
            'behavioral': 'Isolation Forest',
            'device': 'Random Forest',
            'insider': 'Statistical Baseline',
            'text_risk': 'Sentence-Transformers / Keyword Fallback',
            'kyc_graph': 'Relationship Graph',
            'unified': 'Weighted Aggregator',
        }
    })


@app.route('/score/behavioral', methods=['POST'])
def score_behavioral():
    """
    Score a customer session for behavioral anomalies.
    Body: {
      cif: str,
      session: { login_hour, transaction_amount, amount_ratio, is_new_device,
                 is_new_location, session_duration_minutes, navigation_depth, actions_per_minute },
      customer_meta: { city_tier, account_type },
      historical_sessions: [ ...list of past sessions ]
    }
    """
    data = request.json or {}
    cif = data.get('cif', '')
    session = data.get('session', {})
    customer_meta = data.get('customer_meta', {})
    historical = data.get('historical_sessions', [])

    if historical:
        behavioral.train_customer_model(cif, historical)
        if customer_meta:
            group_key = behavioral.build_peer_group_key(customer_meta)
            for s in historical[-5:]:
                behavioral.update_peer_group(group_key, s)

    result = behavioral.score(cif, session, customer_meta)
    return jsonify(result)


@app.route('/score/device', methods=['POST'])
def score_device():
    """
    Score a device fingerprint for trust level.
    Body: { is_new_device, current_ip, geo_mismatch, os_mismatch,
            is_emulator, vpn_detected, sim_swap_recent, login_attempt_velocity }
    """
    data = request.json or {}
    result = device_engine.score(data)
    return jsonify(result)


@app.route('/score/insider', methods=['POST'])
def score_insider():
    """
    Evaluate an employee action against their behavioral baseline.
    Body: { employee_id, action: { action, timestamp, customer_cif, customer_segment } }
    """
    data = request.json or {}
    employee_id = data.get('employee_id', '')
    action = data.get('action', {})
    result = insider.score(employee_id, action)
    insider.record_action(employee_id, action)
    return jsonify(result)


@app.route('/score/text-risk', methods=['POST'])
def score_text_risk():
    """
    Score receiver name and transfer note for semantic fraud patterns.
    Body: { receiver_name, transfer_note }
    """
    data = request.json or {}
    result = text_risk.score_receiver(
        data.get('receiver_name', ''),
        data.get('transfer_note', '')
    )
    return jsonify(result)


@app.route('/kyc/analyze', methods=['POST'])
def analyze_kyc():
    """
    Cross-reference a new KYC application against all registered ones.
    Body: {
      application: { _id, name, aadhaar, pan, deviceFingerprint, ipAddress, timestamp },
      existing_applications: [ ...previously registered apps ]
    }
    """
    data = request.json or {}
    new_app = data.get('application', {})
    existing = data.get('existing_applications', [])

    # Register existing apps if the graph is empty (cold start)
    if existing and not kyc_graph.app_registry:
        for ex_app in existing:
            kyc_graph.register_application(ex_app)

    result = kyc_graph.analyze(new_app)
    return jsonify(result)


@app.route('/kyc/register', methods=['POST'])
def register_kyc():
    """
    Register an approved KYC application into the graph for future comparisons.
    Body: { application: { _id, name, aadhaar, pan, deviceFingerprint, ipAddress, timestamp } }
    """
    data = request.json or {}
    app_data = data.get('application', {})
    if app_data:
        kyc_graph.register_application(app_data)
    return jsonify({'registered': True, 'app_id': str(app_data.get('_id', ''))})


@app.route('/score/unified', methods=['POST'])
def score_unified():
    """
    Compute unified Dynamic Trust Score from all module scores.
    Body: {
      module_scores: { behavioral, device, text_risk, recovery, insider }
    }
    """
    data = request.json or {}
    module_scores = data.get('module_scores', {})
    result = unified.compute_final_score(module_scores)
    return jsonify(result)


@app.route('/score/full', methods=['POST'])
def score_full():
    """
    All-in-one endpoint: runs all applicable ML models and returns unified score.
    Body: {
      cif: str,
      session: { ...behavioral features },
      device_signals: { ...device features },
      receiver_name: str,
      transfer_note: str,
      customer_meta: { city_tier, account_type },
      historical_sessions: [ ...],
      existing_kyc: [ ...]
    }
    """
    data = request.json or {}

    module_scores = {}
    all_factors = []
    breakdown = {}

    # 1. Behavioral
    try:
        cif = data.get('cif', '')
        session = data.get('session', {})
        historical = data.get('historical_sessions', [])
        customer_meta = data.get('customer_meta', {})

        if historical:
            behavioral.train_customer_model(cif, historical)
        beh_result = behavioral.score(cif, session, customer_meta)
        module_scores['behavioral'] = beh_result['risk_score']
        all_factors.extend(beh_result.get('factors', []))
        breakdown['behavioral'] = beh_result
    except Exception as e:
        breakdown['behavioral'] = {'error': str(e)}

    # 2. Device
    try:
        device_signals = data.get('device_signals', {})
        dev_result = device_engine.score(device_signals)
        module_scores['device'] = dev_result['risk_score']
        all_factors.extend(dev_result.get('factors', []))
        breakdown['device'] = dev_result
    except Exception as e:
        breakdown['device'] = {'error': str(e)}

    # 3. Text risk
    try:
        txt_result = text_risk.score_receiver(
            data.get('receiver_name', ''),
            data.get('transfer_note', '')
        )
        module_scores['text_risk'] = txt_result['risk_score']
        if txt_result.get('matched_pattern'):
            all_factors.append(
                f"Receiver name/note semantically matches fraud pattern: "
                f"'{txt_result['matched_pattern']}'"
            )
        breakdown['text_risk'] = txt_result
    except Exception as e:
        breakdown['text_risk'] = {'error': str(e)}

    # 4. Unified score
    unified_result = unified.compute_final_score(module_scores)

    return jsonify({
        'unified': unified_result,
        'all_factors': all_factors,
        'breakdown': breakdown,
    })


if __name__ == '__main__':
    print(f"Starting SACH Kavach ML Engine on port {PORT}...")
    app.run(host='0.0.0.0', port=PORT, debug=False)
