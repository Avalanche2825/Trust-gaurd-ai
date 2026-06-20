import React, { useState, useEffect } from "react";
import { UserSession, Transaction } from "../types.js";
import { ShieldCheck, ShieldAlert, Cpu, MapPin, Activity, HelpCircle, Laptop, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import TrustGauge from "./charts/TrustGauge.tsx";
import RiskSparkline from "./charts/RiskSparkline.tsx";

interface ActiveSessionMonitorProps {
  customers: UserSession[];
  selectedCustomer: UserSession | null;
  onSelectCustomer: (customer: UserSession) => void;
  transactions: Transaction[];
  onTriggerAnalyse: (amount: number) => void;
}

export default function ActiveSessionMonitor({
  customers,
  selectedCustomer,
  onSelectCustomer,
  transactions,
  onTriggerAnalyse
}: ActiveSessionMonitorProps) {
  const [search, setSearch] = useState("");
  const [testAmount, setTestAmount] = useState("45000");
  const [aiReport, setAiReport] = useState<{ score: number; factors: string[]; explanation: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Filter customers for lookup
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cif.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic analysis trigger
  const handleSimulateAssessment = async () => {
    if (!selectedCustomer) return;
    setLoadingAi(true);
    setAiReport(null);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cif: selectedCustomer.cif,
          receiverName: "Unknown Receiver (Cyber Evaluation)",
          accountNumber: "9988776655",
          amount: parseFloat(testAmount),
          currentIP: selectedCustomer.currentIP,
          currentDevice: selectedCustomer.currentDevice,
          currentLocation: selectedCustomer.currentLocation,
          isNewDevice: false
        })
      });
      const data = await response.json();
      setAiReport({
        score: data.riskScore,
        factors: data.riskFactors || [],
        explanation: data.explanation || ""
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Get matching user logs & baseline risk mapping
  const activeTx = selectedCustomer ? transactions.filter(t => t.cif === selectedCustomer.cif) : [];

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-emerald-500 border-emerald-500 bg-emerald-500/10";
    if (score <= 60) return "text-amber-500 border-amber-500 bg-amber-500/10";
    if (score <= 80) return "text-orange-500 border-orange-500 bg-orange-500/10";
    return "text-red-500 border-red-500 bg-red-500/10";
  };

  return (
    <div id="session-monitor-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Search and Selector Panel */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col h-[580px]">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Activity className="w-4 h-4 text-blue-600" />
          Active Demographics Lookups
        </h3>
        
        <input
          type="text"
          placeholder="Lookup customer by name or CIF ID..."
          className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredCustomers.slice(0, 15).map((c, idx) => (
            <button
              key={c.cif}
              onClick={() => {
                onSelectCustomer(c);
                setAiReport(null);
              }}
              className={`w-full text-left p-3 rounded-xl transition duration-200 border flex items-center justify-between gap-3 cursor-pointer ${
                selectedCustomer?.cif === c.cif
                  ? "bg-blue-50/50 border-blue-400 shadow-sm"
                  : "bg-slate-50/50 hover:bg-slate-100 border-slate-200/60"
              }`}
            >
              <div className="flex-grow min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">{c.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">CIF: {c.cif}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">₹{c.balance.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RiskSparkline baseScore={c.trustScore} seed={idx} />
                <div className="text-right">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono leading-none ${
                    c.trustScore >= 80 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : c.trustScore >= 60
                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                      : "bg-red-50 text-red-750 border border-red-100"
                  }`}>
                    {c.trustScore}%
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Demographics View */}
      <div className="lg:col-span-8 space-y-6">
        {selectedCustomer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Session Dashboard */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">PRIMARY SYSTEM IDENTITY</span>
                    <h2 className="text-xl font-bold text-slate-905 mt-1">{selectedCustomer.name}</h2>
                    <p className="text-xs font-mono text-slate-500">CIF: {selectedCustomer.cif}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${getRiskColor(100 - selectedCustomer.trustScore)}`}>
                    <Laptop className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 my-4">
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60">
                    <p className="text-2xs text-slate-400 uppercase font-bold tracking-wider">Savings Ledger</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">₹{selectedCustomer.balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60">
                    <p className="text-2xs text-slate-400 uppercase font-bold tracking-wider">Avg Tx Amount</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">₹{selectedCustomer.avgTransactionAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-slate-650 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Device: <strong className="text-slate-800">{selectedCustomer.currentDevice}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>IP Address: <strong className="text-slate-800 font-mono">{selectedCustomer.currentIP}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Geodistribution: <strong className="text-slate-800">{selectedCustomer.currentLocation}</strong></span>
                  </div>
                </div>
              </div>

              {/* Dynamic Warning Banner */}
              {selectedCustomer.trustScore < 60 && (
                <div className="mt-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-2xs uppercase tracking-wider block">Degraded Guard State</span>
                    <p className="text-2xs mt-0.5 text-red-700">Multi-Factor challenge required. Suspicious activity traces logged on browser signatures.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Live Gauge & Continuous Threat Evaluator */}
            <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 shadow-md flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-bold text-blue-400 tracking-wider font-mono uppercase">CONTINUOUS THREAT OVERWATCH</h4>
                
                {/* TrustGauge */}
                <div className="relative flex flex-col justify-center items-center py-4 bg-slate-950/40 rounded-xl border border-slate-850/60 mt-3 select-none">
                  <TrustGauge score={selectedCustomer.trustScore} size={150} />
                  
                  {/* Peer Group Cohort Comparison (Team SACH Innovation) */}
                  <div className="text-[9.5px] border-t border-slate-800 w-full text-center pt-2.5 mt-4 text-slate-400 font-mono">
                    Your score: <span className="text-white font-bold">{selectedCustomer.trustScore}</span> | 
                    Cohort avg: <span className="text-slate-300 font-bold">81</span> | 
                    Status: <span className={selectedCustomer.trustScore >= 81 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {selectedCustomer.trustScore >= 81 
                        ? `${selectedCustomer.trustScore - 81} points above cohort` 
                        : `${81 - selectedCustomer.trustScore} points below cohort`
                      }
                    </span>
                    <div className="text-[8px] text-slate-500 mt-1">Cohort group: {selectedCustomer.currentLocation.split(",")[0]}, Savings Account, Similar Balance Band</div>
                  </div>
                </div>

                {/* AI Policy Testing Area */}
                <div className="mt-2 bg-slate-800/40 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-mono">
                    <Cpu className="w-3.5 h-3.5" />
                    Run AI Transfer Evaluation
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-mono">₹</span>
                      <input
                        type="number"
                        className="w-full pl-6 pr-2 py-1 bg-slate-950 text-white border border-slate-700 rounded-md text-xs focus:outline-none focus:border-blue-500"
                        value={testAmount}
                        onChange={(e) => setTestAmount(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={handleSimulateAssessment}
                      disabled={loadingAi}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold rounded-lg text-white transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {loadingAi ? "Analyzing..." : "Evaluate LLM"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Live Status indicator */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800 text-xs">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest font-mono">Identity Pulse:</span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold text-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Monitoring
                </span>
              </div>
            </div>

            {/* AI Reasoning Response Field */}
            {aiReport && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 md:col-span-2 bg-blue-500/5 border border-blue-200/50 p-5 rounded-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold font-mono text-xs shrink-0">AI</div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                       AI Security Justification Report
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        aiReport.score > 70 
                          ? "bg-red-100 text-red-700" 
                          : aiReport.score > 30 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        Reported Risk: {aiReport.score}/100
                      </span>
                    </h5>
                    
                    {/* Bullet reasoning triggers */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {aiReport.factors.map((f, idx) => (
                        <span key={idx} className="text-2xs bg-white text-slate-600 border border-slate-200 rounded px-2 py-0.5 font-medium font-mono">
                          ⚠️ {f}
                        </span>
                      ))}
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed mt-3 italic">
                      "{aiReport.explanation}"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Historic login sessions panel */}
            <div className="col-span-1 md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Activity className="w-4 h-4 text-blue-600" />
                Audit Logins & Attribute Fingerprint History
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Device Sign</th>
                      <th className="py-2.5 px-3">IP Address</th>
                      <th className="py-2.5 px-3">Verified Geolocation</th>
                      <th className="py-2.5 px-3 text-right">MFA Threat Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCustomer.loginHistory.map((lh, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 text-slate-600">
                        <td className="py-2.5 px-3 font-mono text-slate-500">{new Date(lh.timestamp).toLocaleString()}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{lh.device}</td>
                        <td className="py-2.5 px-3 font-mono">{lh.ip}</td>
                        <td className="py-2.5 px-3">{lh.location}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold leading-none ${
                            lh.isNewDevice 
                              ? "bg-red-50 text-red-600 border border-red-100" 
                              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          }`}>
                            {lh.isNewDevice ? "NEW_DEVICE" : "STANDARD"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-16 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[400px]">
            <ShieldCheck className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
            <p className="font-bold text-sm text-slate-700 uppercase tracking-wider">Audit Desk Ready</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">Please select an active banking customer session from the left-hand directory panel to parse geolocation telemetry.</p>
          </div>
        )}
      </div>
    </div>
  );
}
