import React, { useState, useEffect } from "react";
import { Bell, ShieldAlert, Sparkles, CheckCircle2, ShieldAlert as AlertIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserSession, Transaction, AuditLog } from "../../types.js";

interface TopBarProps {
  customers: UserSession[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  user: { username: string; role: string } | null;
}

export default function TopBar({ customers = [], transactions = [], auditLogs = [], user }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  // 1. Dynamic summaries
  const totalProtected = React.useMemo(() => {
    return customers.reduce((sum, c) => sum + c.balance, 0);
  }, [customers]);

  const avgTrustIndex = React.useMemo(() => {
    if (customers.length === 0) return 85;
    return Math.round(customers.reduce((sum, c) => sum + c.trustScore, 0) / customers.length);
  }, [customers]);

  const escrowLocks = React.useMemo(() => {
    return transactions.filter(t => ["OTP_Required", "CIF_Required", "Guardian_Required"].includes(t.status)).length;
  }, [transactions]);

  const blockedExploits = React.useMemo(() => {
    return auditLogs.filter(l => l.decision === "REJECTED_AND_BLOCKED" || l.riskScore > 75).length;
  }, [auditLogs]);

  // 2. Extract recent high-risk notifications
  const recentAlerts = React.useMemo(() => {
    return auditLogs
      .filter(l => l.riskScore > 50)
      .slice(0, 5);
  }, [auditLogs]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none z-40 relative shadow-sm">
      
      {/* 4 Animated KPI Counters */}
      <div className="flex items-center gap-6 md:gap-8">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Protected</span>
          <motion.span 
            className="text-sm font-extrabold text-slate-900 font-mono"
            animate={{ scale: [0.95, 1.02, 1] }}
            key={totalProtected}
          >
            ₹{(totalProtected / 10000000).toFixed(2)}Cr
          </motion.span>
        </div>

        <div className="flex flex-col border-l border-slate-200 pl-6 md:pl-8">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Base Trust Index</span>
          <motion.span 
            className="text-sm font-extrabold text-emerald-600 font-mono"
            animate={{ scale: [0.95, 1.02, 1] }}
            key={avgTrustIndex}
          >
            {avgTrustIndex}%
          </motion.span>
        </div>

        <div className="flex flex-col border-l border-slate-200 pl-6 md:pl-8">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Escrow Locks</span>
          <motion.span 
            className="text-sm font-extrabold text-amber-500 font-mono"
            animate={{ scale: [0.95, 1.02, 1] }}
            key={escrowLocks}
          >
            {escrowLocks}
          </motion.span>
        </div>

        <div className="flex flex-col border-l border-slate-200 pl-6 md:pl-8">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Blocked Exploits</span>
          <motion.span 
            className="text-sm font-extrabold text-red-500 font-mono"
            animate={{ scale: [0.95, 1.02, 1] }}
            key={blockedExploits}
          >
            {blockedExploits}
          </motion.span>
        </div>
      </div>

      {/* Right User & Notification Bell panel */}
      <div className="flex items-center gap-4 relative">
        <div className="bg-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2 border border-slate-200/50 hidden sm:flex select-none">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-slate-600 font-mono uppercase tracking-wide">STATE: OPTIMAL</span>
        </div>

        {/* Notification Alert Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors relative cursor-pointer"
            title="Recent security events"
          >
            <Bell className="w-4 h-4" />
            {recentAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-ping"></span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Click overlay */}
                <div 
                  className="fixed inset-0 z-45"
                  onClick={() => setShowNotifications(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden font-sans"
                >
                  <div className="p-3 border-b border-slate-100 bg-[#0a1628] text-white flex justify-between items-center select-none">
                    <span className="text-xs font-extrabold uppercase font-mono tracking-wider">Security Alerts</span>
                    <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded font-mono">
                      {recentAlerts.length} High Risk
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {recentAlerts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 font-mono select-none">
                        No critical events logged today.
                      </div>
                    ) : (
                      recentAlerts.map(alert => (
                        <div key={alert._id} className="p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex gap-2.5 items-start">
                            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-800 line-clamp-1 flex-1">
                                  {alert.event}
                                </span>
                                <span className="text-[9px] font-mono font-bold px-1 bg-red-100 text-red-600 rounded shrink-0 ml-1.5">
                                  {alert.riskScore}
                                </span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-1 font-mono">
                                {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} — {alert.decision}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[9px] font-bold text-saffron-600 hover:text-saffron-700 font-mono tracking-wider uppercase cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar display initials */}
        <div className="w-9 h-9 bg-saffron-500 text-white rounded-xl flex items-center justify-center font-bold border border-saffron-400/20 text-xs shadow shadow-saffron-500/25 uppercase font-mono">
          {user?.username ? user.username.substring(0, 2) : "US"}
        </div>
      </div>
    </header>
  );
}
