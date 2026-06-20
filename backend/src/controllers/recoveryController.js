import * as dbBridge from '../utils/dbBridge.js';
import { GoogleGenAI, Type } from '@google/genai';

let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI. Using heuristic fallback.", err);
  }
}

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

export const createRecoveryAttempt = async (req, res) => {
  try {
    const { cif, recoveryType, newValue, mockIP, mockDevice, mockLocation } = req.body;
    if (!cif || !recoveryType || !newValue) {
      return res.status(400).json({ error: "Missing required recovery fields" });
    }

    const customer = await dbBridge.getCustomer(cif);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const riskFactors = [];
    let calculatedRisk = 30; // base risk

    const isSuspiciousIP = mockIP && mockIP !== customer.currentIP;
    const isSuspiciousLocation = mockLocation && mockLocation !== customer.currentLocation;
    const isEmulator = mockDevice && (mockDevice.toLowerCase().includes('emulator') || mockDevice.toLowerCase().includes('genymotion') || mockDevice.toLowerCase().includes('bluestacks'));
    const isHighSensitivity = recoveryType === 'mobile_change';

    if (isSuspiciousIP) {
      riskFactors.push("Request originates from unrecognized IP address");
      calculatedRisk += 20;
    }
    if (isSuspiciousLocation) {
      riskFactors.push(`Geolocation mismatch: request from ${mockLocation}, customer profile shows ${customer.currentLocation}`);
      calculatedRisk += 30;
    }
    if (isEmulator) {
      riskFactors.push("Virtual/emulated device environment detected");
      calculatedRisk += 25;
    }
    if (isHighSensitivity) {
      riskFactors.push("Mobile number change: highest-risk recovery action (SIM swap vector)");
      calculatedRisk += 15;
    }
    if (isSuspiciousLocation && isSuspiciousIP) {
      riskFactors.push("Combined geo + IP mismatch: strong account takeover signal");
      calculatedRisk += 10;
    }

    calculatedRisk = clamp(calculatedRisk, 0, 100);

    // Enhance with Gemini threat narrative
    if (ai) {
      try {
        const prompt = `
          Analyze this account recovery attempt.
          CIF: ${cif} | Type: ${recoveryType} | New Value: ${newValue}
          IP: ${mockIP} | Location: ${mockLocation} | Device: ${mockDevice}
          Calculated Risk Score: ${calculatedRisk}/100
          Provide a 1-sentence threat narrative explaining this request's threat pattern.
        `;
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                threatNarrative: { type: Type.STRING }
              },
              required: ['threatNarrative']
            }
          }
        });
        
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          riskFactors.push(parsed.threatNarrative);
        }
      } catch (e) {
        console.warn("Gemini recovery narrative skipped.", e);
      }
    }

    const alertType = calculatedRisk > 65 ? 'CRITICAL_THREAT_DETECTION' : 
                      calculatedRisk > 45 ? 'HIGH_ALERT' : 'ROUTINE_SECURITY_LOG';
    const statusToken = calculatedRisk > 65 ? 'BLOCKED_HIGH_ALERT' :
                        calculatedRisk > 45 ? 'HIGH_ALERT' : 'LOGGED';

    // Update customer trustScore and loginHistory
    const finalTrustScore = clamp(customer.trustScore - Math.round(calculatedRisk / 2.5), 0, 100);
    const updatedHistory = [...customer.loginHistory];
    updatedHistory.unshift({
      timestamp: new Date().toISOString(),
      ip: mockIP || '127.0.0.1',
      location: mockLocation || 'Unknown',
      device: `Recovery attempt: ${recoveryType}`,
      isNewDevice: true
    });
    await dbBridge.updateCustomer(cif, { trustScore: finalTrustScore, loginHistory: updatedHistory });

    // Save Audit Log
    const audit = await dbBridge.addAuditLog({
      timestamp: new Date().toISOString(),
      user: 'Security Recovery Manager',
      event: `Account Recovery Reset: ${recoveryType} for CIF ${cif}`,
      riskScore: calculatedRisk,
      riskFactors,
      decision: statusToken
    });

    res.status(201).json({
      success: true,
      alertType,
      riskScore: calculatedRisk,
      newTrustScore: finalTrustScore,
      riskFactors,
      audit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
