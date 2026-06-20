/**
 * LLM Risk Narrative Service — SACH Kavach
 *
 * Cascade:
 *   1. Grok API (xAI) — primary, model: grok-3-mini
 *   2. Groq API       — fallback, model: llama-3.3-70b-versatile
 *   3. Heuristic      — always works, no API dependency
 */

import https from 'https';

const GROK_API_KEY = process.env.GROK_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ── Helper: make a POST request returning JSON ────────────────────────────────
function postJSON(hostname, path, body, headers) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ error: 'parse_error', raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('LLM request timeout'));
    });
    req.write(payload);
    req.end();
  });
}

// ── Grok (xAI) ───────────────────────────────────────────────────────────────
async function callGrok(prompt) {
  if (!GROK_API_KEY) throw new Error('No Grok API key');

  const body = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are SACH Kavach, an AI risk analyst for Bank of Baroda. ' +
          'Explain transaction or identity risk in 2-3 concise sentences, ' +
          'using plain English. Mention specific risk signals. ' +
          'End with a clear recommendation.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.3,
  };

  const result = await postJSON('api.x.ai', '/v1/chat/completions', body, {
    Authorization: `Bearer ${GROK_API_KEY}`,
  });

  const content = result?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Grok: empty response');
  return { narrative: content.trim(), source: 'grok' };
}

// ── Groq ──────────────────────────────────────────────────────────────────────
async function callGroq(prompt) {
  if (!GROQ_API_KEY) throw new Error('No Groq API key');

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are SACH Kavach, an AI risk analyst for Bank of Baroda. ' +
          'Explain transaction or identity risk in 2-3 concise sentences, ' +
          'using plain English. Mention specific risk signals. ' +
          'End with a clear recommendation.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 150,
    temperature: 0.3,
  };

  const result = await postJSON('api.groq.com', '/openai/v1/chat/completions', body, {
    Authorization: `Bearer ${GROQ_API_KEY}`,
  });

  const content = result?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq: empty response');
  return { narrative: content.trim(), source: 'groq' };
}

// ── Heuristic Engine — always works ──────────────────────────────────────────
function heuristicNarrative(riskData) {
  const {
    riskScore = 50,
    factors = [],
    status = 'OTP_Required',
    receiverName = '',
    amount = 0,
    customerName = '',
  } = riskData;

  const amtFormatted = `₹${Number(amount).toLocaleString('en-IN')}`;
  const topFactor = factors[0] || 'multiple risk indicators detected in the session';

  let narrative = '';
  let recommendation = '';

  if (riskScore >= 80) {
    narrative =
      `SACH Kavach has flagged a high-risk transaction of ${amtFormatted} ` +
      `to ${receiverName || 'the specified receiver'} with a risk score of ${riskScore}/100. ` +
      `Primary signal: ${topFactor}.`;
    recommendation =
      `Recommendation: Block this transaction immediately and alert the Fraud Operations ` +
      `team. Require customer identity re-verification before any further access.`;
  } else if (riskScore >= 60) {
    narrative =
      `A medium-high risk signal has been detected for ${customerName || 'this customer'} ` +
      `attempting a ${amtFormatted} transfer. Risk score: ${riskScore}/100. ` +
      `Key concern: ${topFactor}.`;
    recommendation =
      `Recommendation: Require OTP step-up authentication before approving. ` +
      `Notify the account holder via registered mobile number.`;
  } else if (riskScore >= 40) {
    narrative =
      `Moderate risk detected for a ${amtFormatted} transaction. ` +
      `Score: ${riskScore}/100. Contributing factor: ${topFactor}.`;
    recommendation =
      `Recommendation: Dispatch customer alert and request CIF verification. ` +
      `Allow with enhanced monitoring if customer confirms.`;
  } else {
    narrative =
      `Transaction of ${amtFormatted} falls within normal behavioral parameters. ` +
      `Risk score: ${riskScore}/100. No significant anomalies detected.`;
    recommendation =
      `Recommendation: Approve transaction and log for routine audit compliance.`;
  }

  return {
    narrative: `${narrative} ${recommendation}`.trim(),
    source: 'heuristic',
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────
/**
 * Generate a risk narrative for a transaction or identity event.
 * Cascades: Grok → Groq → Heuristic
 *
 * @param {Object} riskData - { riskScore, factors, status, receiverName, amount, customerName }
 * @returns {Promise<{ narrative: string, source: string }>}
 */
export async function generateRiskNarrative(riskData) {
  const { riskScore = 50, factors = [], receiverName = '', amount = 0, customerName = '' } = riskData;

  const prompt =
    `Customer: ${customerName}. ` +
    `Transaction amount: ₹${Number(amount).toLocaleString('en-IN')}. ` +
    `Receiver: ${receiverName}. ` +
    `Risk score: ${riskScore}/100. ` +
    `Risk signals: ${factors.slice(0, 3).join('; ') || 'none'}. ` +
    `What is your risk assessment and recommendation?`;

  // Try Grok first
  if (GROK_API_KEY) {
    try {
      return await callGrok(prompt);
    } catch (e) {
      console.warn(`[LLM] Grok failed: ${e.message}. Trying Groq...`);
    }
  }

  // Try Groq
  if (GROQ_API_KEY) {
    try {
      return await callGroq(prompt);
    } catch (e) {
      console.warn(`[LLM] Groq failed: ${e.message}. Using heuristic.`);
    }
  }

  // Final fallback
  return heuristicNarrative(riskData);
}
