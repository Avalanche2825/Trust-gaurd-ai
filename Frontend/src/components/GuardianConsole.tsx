import React, { useState } from "react";
import { UserSession, Guardian, Transaction } from "../types.js";
import { UserCheck, ShieldAlert, Check, X, Phone, Heart, Users, Shield, Send } from "lucide-react";
import { motion } from "motion/react";
import { useToast } from "./ToastProvider.tsx";
import MethodologyBanner from "./layout/MethodologyBanner.tsx";

interface GuardianConsoleProps {
  selectedCustomer: UserSession | null;
  guardian: Guardian | null;
  onRegisterGuardian: (gName: string, rel: string, phone: string) => void;
  pendingTx: Transaction[];
  onApproveTx: (id: string) => void;
  onRejectTx: (id: string) => void;
}

export default function GuardianConsole({
  selectedCustomer,
  guardian,
  onRegisterGuardian,
  pendingTx,
  onApproveTx,
  onRejectTx
}: GuardianConsoleProps) {
  const { showToast } = useToast();
  const [gName, setGName] = useState("");
  const [relationship, setRelationship] = useState("Spouse");
  const [phone, setPhone] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName || !phone) {
      showToast("Name and Phone number are required to secure the register.", "warning");
      return;
    }
    onRegisterGuardian(gName, relationship, phone);
    setGName("");
    setPhone("");
  };

  // Critical / Guardian Required Transactions filter
  const guardianCriticalTxs = pendingTx.filter(t => t.status === "Guardian_Required" || t.riskScore > 80);

  return (
    <div className="space-y-6">
      <MethodologyBanner pageId="guardian" />
      
      <div id="guardian-protection-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Register Guardian Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-blue-600" />
            Guardian Multi-Sig Register
          </h3>

          {!selectedCustomer ? (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Please select a customer session from the main panel to enroll a trusted guardian.
            </p>
          ) : guardian ? (
            <div className="space-y-4">
              <div className="bg-blue-50/50 p-4 border border-blue-200 rounded-lg">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono block">ACTIVE GUARDIAN ENROLLED</span>
                <p className="text-sm font-extrabold text-slate-900 mt-1">{guardian.guardianName}</p>
                <p className="text-xs text-slate-500 font-medium capitalize mt-0.5">Relation: {guardian.relationship}</p>
                
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-405" />
                  <span>{guardian.phone}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-slate-500 text-xs leading-relaxed">
                🛡️ <strong>Sentinel Guard Active</strong>: Critical transfers {`>80%`} risk will send SMS pings requiring this guardian's multi-signature authorization credentials to unlock funds.
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guardian Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sen"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Relationship Profile</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Associate">Financial Advisor</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Secure Mobile Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 99000 88812"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-lg text-xs text-white flex items-center justify-center gap-1 cursor-pointer duration-200 shadow-sm"
              >
                Enroll Authorized Guardian
              </button>
            </form>
          )}
        </div>
      </div>

       {/* 2. Guardian Dashboard Overlord Panel */}
      <div className="lg:col-span-8 bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-sm flex flex-col justify-between h-[450px]">
        <div>
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-850">
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">SENTINEL MULTI-SIG AGENT PORTAL</span>
              <h3 className="text-base font-bold text-white mt-1">Guardian Escrow Overwatch Panel</h3>
            </div>
            <div className="flex items-center gap-1 bg-slate-850 px-3 py-1 rounded text-2xs border border-slate-800 font-bold font-mono">
              <Shield className="w-3 text-blue-400" />
              <span>{guardianCriticalTxs.length} Blocked Escrows</span>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
            {guardianCriticalTxs.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
                <Heart className="w-8 h-8 text-slate-800 mb-2 animate-pulse" />
                <p className="font-bold text-slate-400 text-xs">No Pending Guardian Interceptions</p>
                <p className="text-3xs text-slate-500 max-w-sm mt-1">No critical risk account transactions matching severity parameters are locked in continuous escrow validation right now.</p>
              </div>
            ) : (
              guardianCriticalTxs.map((tx) => (
                <div key={tx._id} className="bg-slate-950 border border-slate-850 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-450">₹{tx.amount.toLocaleString()}</span>
                      <span className="text-slate-400 font-bold text-2xs">Transfer to {tx.receiverName} (Acc: {tx.accountNumber})</span>
                    </div>
                    <p className="text-3xs text-slate-500 font-mono mt-1">Beneficiary: {tx.customerName} (CIF: {tx.cif})</p>
                    <p className="text-3xs text-red-400 italic mt-1 leading-normal">
                      ⚠️ Risk Score: {tx.riskScore}% - {tx.explanation}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => onApproveTx(tx._id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-2xs font-extrabold rounded flex items-center gap-1.5 duration-100 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => onRejectTx(tx._id)}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-2xs font-extrabold rounded flex items-center gap-1.5 duration-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Block Funds
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-850 text-3xs text-slate-500 flex justify-between items-center bg-slate-950 -mx-6 -mb-6 p-4 rounded-b-xl">
          <span className="font-medium">Active Security Overwatch: Guarding family wealth against social engineering exploits.</span>
          <span className="font-bold text-blue-400 tracking-wide uppercase font-mono">Sentinel Network v4.1 Connected</span>
        </div>
      </div>
      </div>
    </div>
  );
}

