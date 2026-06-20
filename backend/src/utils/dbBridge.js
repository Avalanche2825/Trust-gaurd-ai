import mongoose from 'mongoose';
import UserModel from '../models/User.js';
import GuardianModel from '../models/Guardian.js';
import TransactionModel from '../models/Transaction.js';
import KYCApplicationModel from '../models/KYCApplication.js';
import EmployeeLogModel from '../models/EmployeeLog.js';
import AuditLogModel from '../models/AuditLog.js';
import { inMemoryDB } from './inMemoryDB.js';

export const getCustomers = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await UserModel.find();
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.users;
};

export const getCustomer = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await UserModel.findOne({ cif });
      if (doc) return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.users.find(u => u.cif === cif) || null;
};

export const updateCustomer = async (cif, updateData) => {
  if (mongoose.connection.readyState === 1) {
    try {
      await UserModel.updateOne({ cif }, { $set: updateData });
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const idx = inMemoryDB.users.findIndex(u => u.cif === cif);
  if (idx !== -1) {
    inMemoryDB.users[idx] = { ...inMemoryDB.users[idx], ...updateData };
  }
};

export const getGuardians = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const query = cif ? { cif } : {};
      return await GuardianModel.find(query);
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return cif ? inMemoryDB.guardians.filter(g => g.cif === cif) : inMemoryDB.guardians;
};

export const addGuardian = async (g) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new GuardianModel(g);
      await doc.save();
      return;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.guardians.push(g);
};

export const getTransactions = async (cif) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const query = cif ? { cif } : {};
      const docs = await TransactionModel.find(query).sort({ timestamp: -1 });
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  const filtered = cif ? inMemoryDB.transactions.filter(t => t.cif === cif) : inMemoryDB.transactions;
  return [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addTransaction = async (tx) => {
  const newTx = { ...tx, _id: `tx_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new TransactionModel(newTx);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.transactions.unshift(newTx);
  return newTx;
};

export const getKYCApplications = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await KYCApplicationModel.find();
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return inMemoryDB.kycApplications;
};

export const addKYCApplication = async (app) => {
  const newApp = { ...app, _id: `kyc_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new KYCApplicationModel(newApp);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.kycApplications.unshift(newApp);
  return newApp;
};

export const getEmployeeLogs = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await EmployeeLogModel.find().sort({ timestamp: -1 });
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return [...inMemoryDB.employeeLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addEmployeeLog = async (log) => {
  const newLog = { ...log, _id: `emp_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new EmployeeLogModel(newLog);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.employeeLogs.unshift(newLog);
  return newLog;
};

export const getAuditLogs = async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await AuditLogModel.find().sort({ timestamp: -1 });
      if (docs && docs.length > 0) return docs;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  return [...inMemoryDB.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addAuditLog = async (log) => {
  const newLog = { ...log, _id: `audit_${Date.now()}` };
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = new AuditLogModel(newLog);
      await doc.save();
      return doc;
    } catch (e) {
      console.warn("Mongo connection failed, falling back to memory:", e);
    }
  }
  inMemoryDB.auditLogs.unshift(newLog);
  return newLog;
};

export const getTickets = async () => {
  return inMemoryDB.tickets;
};

export const addTicket = async (ticket) => {
  const newTicket = {
    ...ticket,
    _id: `ticket_${Date.now()}`,
    status: ticket.status || 'PENDING_OTP',
    otpVerified: ticket.otpVerified || false,
    createdAt: new Date().toISOString()
  };
  inMemoryDB.tickets.unshift(newTicket);
  return newTicket;
};

export const updateTicket = async (id, updateData) => {
  const idx = inMemoryDB.tickets.findIndex(t => t._id === id);
  if (idx !== -1) {
    inMemoryDB.tickets[idx] = { ...inMemoryDB.tickets[idx], ...updateData };
    return inMemoryDB.tickets[idx];
  }
  return null;
};

export const getPrivilegeTokens = async () => {
  return inMemoryDB.privilegeTokens || [];
};

export const addPrivilegeToken = async (tok) => {
  const newTok = {
    ...tok,
    _id: `tok_${Date.now()}`,
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + tok.durationMinutes * 60 * 1000).toISOString()
  };
  inMemoryDB.privilegeTokens.unshift(newTok);
  return newTok;
};

export const getHackerDelaySessions = async () => {
  return inMemoryDB.hackerDelaySessions || [];
};

export const addHackerDelaySession = async (sess) => {
  const newSess = {
    ...sess,
    _id: `hds_${Date.now()}`,
    detectedAt: new Date().toISOString(),
    fraudTeamNotified: true,
  };
  inMemoryDB.hackerDelaySessions.unshift(newSess);
  return newSess;
};

