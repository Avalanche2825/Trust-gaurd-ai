import express from 'express';
import { loginUser } from '../controllers/authController.js';
import {
  getAllCustomers,
  getCustomerByCIF,
  getGuardianByCIF,
  enrollGuardian,
} from '../controllers/customerController.js';
import {
  getTransactionsList,
  createTransaction,
  approveTx,
  rejectTx,
} from '../controllers/transactionController.js';
import {
  getKYCApplications,
  createKYCApplication,
} from '../controllers/kycController.js';
import { createRecoveryAttempt } from '../controllers/recoveryController.js';
import {
  getEmployeeLogsList,
  createEmployeeLogEntry,
  approveEmployeeLogEntry,
} from '../controllers/employeeController.js';
import { getAuditLogsList } from '../controllers/auditController.js';
import {
  getTicketsList,
  createTicketEntry,
  verifyTicketOTP,
} from '../controllers/ticketController.js';
import {
  scoreBehavioral,
  scoreDevice,
  scoreInsider,
  scoreTextRisk,
  analyzeKYC,
  scoreUnified,
  mlHealth,
} from '../controllers/mlController.js';
import { generateRiskNarrative } from '../utils/llmService.js';
import { getAnalyticsOverview } from '../controllers/analyticsController.js';
import { activateDelaySession, getDelayIntelligence } from '../controllers/hackerDelayController.js';
import { getPrivilegeTokensList, createPrivilegeToken } from '../controllers/tokenController.js';

const router = express.Router();

// ── Analytics ───────────────────────────────────────────────────────────────
router.get('/analytics/overview', getAnalyticsOverview);

// ── Hacker Delay Layer ───────────────────────────────────────────────────────
router.post('/hacker-delay/activate', activateDelaySession);
router.get('/hacker-delay/intelligence', getDelayIntelligence);

// ── Privilege Tokens ─────────────────────────────────────────────────────────
router.get('/privilege-tokens', getPrivilegeTokensList);
router.post('/privilege-tokens', createPrivilegeToken);


// ── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/login', loginUser);

// ── Customers ────────────────────────────────────────────────────────────────
router.get('/customers', getAllCustomers);
router.get('/customers/:cif', getCustomerByCIF);
router.get('/customers/:cif/guardian', getGuardianByCIF);
router.post('/customers/:cif/guardian', enrollGuardian);

// ── Transactions ─────────────────────────────────────────────────────────────
router.get('/transactions', getTransactionsList);
router.post('/transactions', createTransaction);
router.post('/transactions/:id/approve', approveTx);
router.post('/transactions/:id/reject', rejectTx);

// ── KYC Onboarding ───────────────────────────────────────────────────────────
router.get('/kyc-applications', getKYCApplications);
router.post('/kyc-applications', createKYCApplication);

// ── Account Recovery ─────────────────────────────────────────────────────────
router.post('/security/recovery-attempt', createRecoveryAttempt);

// ── Employee Logs ─────────────────────────────────────────────────────────────
router.get('/employee/logs', getEmployeeLogsList);
router.post('/employee/logs', createEmployeeLogEntry);
router.post('/employee/logs/:id/approve', approveEmployeeLogEntry);

// ── Support Tickets ──────────────────────────────────────────────────────────
router.get('/tickets', getTicketsList);
router.post('/tickets', createTicketEntry);
router.post('/tickets/:id/verify-otp', verifyTicketOTP);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', getAuditLogsList);

// ── ML Scoring Endpoints (proxy to Python ML service) ────────────────────────
router.get('/ml/health', mlHealth);
router.post('/ml/score/behavioral', scoreBehavioral);
router.post('/ml/score/device', scoreDevice);
router.post('/ml/score/insider', scoreInsider);
router.post('/ml/score/text-risk', scoreTextRisk);
router.post('/ml/kyc/analyze', analyzeKYC);
router.post('/ml/score/unified', scoreUnified);

// ── LLM Narrative ─────────────────────────────────────────────────────────────
router.post('/risk/narrative', async (req, res) => {
  try {
    const result = await generateRiskNarrative(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
