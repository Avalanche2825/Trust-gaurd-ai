import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  Send,
  Users,
  UserCheck,
  UserX,
  Laptop,
  FileText,
  Hourglass,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck
} from "lucide-react";
import { motion } from "motion/react";

interface SidebarProps {
  user: { username: string; role: string } | null;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const navLinks = [
    { path: "/dashboard", label: "Threat Analytics", icon: LayoutDashboard },
    { path: "/sessions", label: "Live Sessions Monitor", icon: Activity },
    { path: "/transactions", label: "Escrow Transfers", icon: Send },
    { path: "/guardian", label: "Guardian Protection", icon: Users },
    { path: "/kyc", label: "Identity Onboarding", icon: UserCheck },
    { path: "/recovery", label: "Recovery Sandbox", icon: UserX },
    { path: "/insider", label: "Insider Overwatch", icon: Laptop },
    { path: "/hacker-delay", label: "Hacker Delay Layer", icon: Hourglass },
    { path: "/audit", label: "Audit Ledger", icon: FileText }
  ];

  return (
    <motion.div
      animate={{ width: isExpanded ? 240 : 72 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-[#0a1628] text-white flex flex-col justify-between shrink-0 h-full border-r border-slate-800 select-none overflow-hidden relative"
    >
      <div>
        {/* Top Header Logo */}
        <div className="p-4 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-saffron-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-saffron-550/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col truncate"
              >
                <span className="font-extrabold text-xs tracking-tight text-white font-mono uppercase">SACH Kavach</span>
                <span className="text-[9px] text-saffron-400 font-mono tracking-widest leading-none mt-0.5">BHARAT TRUST GRID</span>
              </motion.div>
            )}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Links List */}
        <nav className="p-3 space-y-1">
          {navLinks.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-saffron-500/10 text-saffron-500 border-l-4 border-saffron-500 font-bold"
                    : "text-slate-450 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-saffron-500" : "text-slate-400"}`} />
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {link.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Block */}
      <div className="p-4 border-t border-slate-850 bg-slate-950/45 flex flex-col gap-2 shrink-0">
        {isExpanded ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>AI Engine</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/25">Online</span>
            </div>
            
            <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs uppercase text-slate-350 border border-slate-700 font-mono">
                {user?.username ? user.username.substring(0, 2) : "US"}
              </div>
              <div className="flex flex-col truncate flex-1">
                <span className="text-[10px] font-bold text-white leading-none truncate">{user?.username}</span>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider font-mono mt-1 leading-none">{user?.role}</span>
              </div>
              
              <button
                onClick={onLogout}
                className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                title="Sign out of Console"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Engine Online"></span>
            <button
              onClick={onLogout}
              className="p-1.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-xl transition-colors border border-slate-700"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
