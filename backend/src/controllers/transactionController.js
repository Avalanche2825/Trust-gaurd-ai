import * as dbBridge from '../utils/dbBridge.js';
import { scoreFull } from './mlController.js';
import { generateRiskNarrative } from '../utils/llmService.js';

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

export const getTransactionsList = async (req, res) => {
  try {
    const cif = req.query.cif || undefined;
    const transactions = await dbBridge.getTransactions(cif);
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const {
      cif,
      receiverName,
      accountNumber,
      amount,
      currentIP,
      currentDevice,
      currentLocation,
      isNewDevice,
      transferNote,
    } = req.body;

    if (!cif || !receiverName || !accountNumber || !amount) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    const customer = await dbBridge.getCustomer(cif);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const loginHour = new Date().getHours();
    const ratio = amount / (customer.avgTransactionAmount || 5000);
    const isOverDailyLimit = amount > (customer.dailyAverageAmount || 50000);
    const isDeviceEmulator = currentDevice &&
      (currentDevice.toLowerCase().includes('emulator') || currentDevice.toLowerCase().includes('genymotion'));

    // ── Call Python ML service (full pipeline) ──────────────────────────────
    const mlPayload = {
      cif,
      session: {
        login_hour: loginHour,
        transaction_amount: amount,
        amount_ratio: parseFloat(ratio.toFixed(2)),
        is_new_device: !!isNewDevice,
        is_new_location: isOverDailyLimit, // use as signal proxy
        session_duration_minutes: 5,
        navigation_depth: 3,
        actions_per_minute: 2,
      },
      device_signals: {
        is_new_device: !!isNewDevice,
        current_ip: currentIP || '',
        geo_mismatch: false,
        os_mismatch: false,
        is_emulator: !!isDeviceEmulator,
        vpn_detected: false,
        sim_swap_recent: false,
        login_attempt_velocity: 1,
      },
      receiver_name: receiverName,
      transfer_note: transferNote || '',
      customer_meta: {
        city_tier: 'tier1',
        account_type: 'savings',
      },
      amount,
      avgAmount: customer.avgTransactionAmount,
      isNewDevice: !!isNewDevice,
      isNewLocation: false,
    };

    let mlResult;
    try {
      mlResult = await scoreFull(mlPayload);
    } catch (mlErr) {
      console.warn('[TX] ML scoring error:', mlErr.message);
      mlResult = null;
    }

    // ── Extract scores ──────────────────────────────────────────────────────
    let finalScore, finalFactors, finalStatus;

    if (mlResult && mlResult.unified) {
      finalScore = mlResult.unified.risk_score ?? mlResult.unified.riskScore ?? 30;
      finalFactors = mlResult.all_factors?.length ? mlResult.all_factors : ['Risk evaluated by ML engine'];
      // Map status from ML response
      const mlStatus = mlResult.unified.status;
      if (mlStatus && ['Approved', 'OTP_Required', 'CIF_Required', 'Guardian_Required', 'Rejected'].includes(mlStatus)) {
        finalStatus = mlStatus;
      }
    }

    // ── Heuristic score additions (always applied, merged with ML) ──────────
    if (!finalScore) {
      let hs = 10;
      const hf = [];
      if (ratio > 8) { hs += 45; hf.push(`Critical: transfer is ${ratio.toFixed(1)}x above customer average`); }
      else if (ratio > 5) { hs += 35; hf.push(`High: transfer is ${ratio.toFixed(1)}x above customer average`); }
      else if (ratio > 2) { hs += 15; hf.push(`Moderate: transfer is ${ratio.toFixed(1)}x above customer average`); }
      if (isOverDailyLimit) { hs += 20; hf.push('Amount exceeds customer daily history'); }
      if (isDeviceEmulator) { hs += 30; hf.push('Emulator/virtual device fingerprint detected'); }
      if (isNewDevice) { hs += 25; hf.push('Transfer initiated from unrecognized device'); }
      if (customer.trustScore < 50) { hs += 20; hf.push('Customer trust index critically degraded'); }
      finalScore = clamp(hs, 0, 100);
      finalFactors = hf.length > 0 ? hf : ['Standard validation passed'];
    }

    // ── Determine status from score if not set by ML ─────────────────────────
    if (!finalStatus) {
      if (finalScore > 80) finalStatus = 'Guardian_Required';
      else if (finalScore > 60) finalStatus = 'CIF_Required';
      else if (finalScore > 30) finalStatus = 'OTP_Required';
      else finalStatus = 'Approved';
    }

    // ── LLM Narrative (Grok → Groq → Heuristic) ─────────────────────────────
    let finalExplanation = `Transaction of ₹${amount} evaluated with risk score ${finalScore}/100.`;
    try {
      const narrativeResult = await generateRiskNarrative({
        riskScore: finalScore,
        factors: finalFactors,
        status: finalStatus,
        receiverName,
        amount,
        customerName: customer.name,
      });
      finalExplanation = narrativeResult.narrative;
    } catch (llmErr) {
      console.warn('[TX] LLM narrative error:', llmErr.message);
    }

    // ── Save transaction ──────────────────────────────────────────────────────
    const savedTx = await dbBridge.addTransaction({
      timestamp: new Date().toISOString(),
      cif,
      customerName: customer.name,
      receiverName,
      accountNumber,
      amount,
      riskScore: finalScore,
      riskFactors: finalFactors,
      explanation: finalExplanation,
      status: finalStatus,
      mlScoring: mlResult ? {
        available: mlResult.ml_available,
        breakdown: mlResult.breakdown,
      } : { available: false },
    });

    // ── Update customer trust score ────────────────────────────────────────
    const newTrustScore = clamp(customer.trustScore - Math.round(finalScore / 5), 0, 100);
    await dbBridge.updateCustomer(cif, { trustScore: newTrustScore });

    // ── Audit Log ─────────────────────────────────────────────────────────
    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'SACH Kavach AI Engine',
      event: `Transaction Risk Evaluated: ₹${amount} → ${receiverName}`,
      riskScore: finalScore,
      riskFactors: finalFactors,
      decision: finalStatus === 'Approved' ? 'DIRECT_APPROVAL' : 'VERIFICATION_REQUIRED',
    });

    // ── Emit Socket.io real-time event if high risk ────────────────────────
    if (req.app.locals.io && finalScore > 60) {
      req.app.locals.io.emit('high_risk_alert', {
        type: 'TRANSACTION_RISK',
        cif,
        customerName: customer.name,
        riskScore: finalScore,
        status: finalStatus,
        amount,
        receiverName,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json(savedTx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveTx = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverType } = req.body;
    const txs = await dbBridge.getTransactions();
    const tx = txs.find((t) => t._id === id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    tx.status = 'Approved';

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Security Console Operations',
      event: `Escalated Transaction Approved (ID: ${id})`,
      riskScore: tx.riskScore,
      riskFactors: [`Override: Approved by ${approverType}`],
      decision: 'APPROVED_POST_VERIFICATION',
    });

    res.json({ status: 'Approved', message: 'Transaction authorized', transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectTx = async (req, res) => {
  try {
    const { id } = req.params;
    const txs = await dbBridge.getTransactions();
    const tx = txs.find((t) => t._id === id);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    tx.status = 'Rejected';

    await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Security Console Operations',
      event: `Escalated Transaction Rejected (ID: ${id})`,
      riskScore: tx.riskScore,
      riskFactors: ['Interrupted by override signature reject'],
      decision: 'REJECTED_AND_BLOCKED',
    });

    res.json({ status: 'Rejected', message: 'Transaction rejected', transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
