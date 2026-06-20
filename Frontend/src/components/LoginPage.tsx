import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Users, ArrowRight, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from './ToastProvider.tsx';

interface LoginPageProps {
  onLoginSuccess: (user: { username: string; role: 'admin' | 'employee'; employeeId?: string }) => void;
  onBackToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const { showToast } = useToast();
  const [roleType, setRoleType] = useState<'admin' | 'employee'>('admin');
  const [username, setUsername] = useState('admin@sach.com');
  const [password, setPassword] = useState('Admin@123');
  const [employeeId, setEmployeeId] = useState('EMP101');
  const [submitting, setSubmitting] = useState(false);

  // Predefined demo accounts quick-fill
  const handleQuickFill = (role: 'admin' | 'employee') => {
    setRoleType(role);
    if (role === 'admin') {
      setUsername('admin@sach.com');
      setPassword('Admin@123');
    } else {
      setUsername('Raman Murthy');
      setEmployeeId('EMP101');
      setPassword('Staff@123');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (roleType === 'admin') {
      if (username !== 'admin@sach.com' || password !== 'Admin@123') {
        showToast("Invalid admin credentials! Hint: use admin@sach.com / Admin@123", "error");
        setSubmitting(false);
        return;
      }
    } else {
      if (!username || !employeeId) {
        showToast("Employee name and Staff ID are required.", "warning");
        setSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: roleType === 'admin' ? 'admin' : username,
          cif: roleType === 'admin' ? 'CIF000' : employeeId
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Login successful! Welcome back, ${roleType === 'admin' ? 'SOC Supervisor' : username}.`, "success");
        setTimeout(() => {
          onLoginSuccess({
            username: roleType === 'admin' ? 'admin' : username,
            role: roleType,
            employeeId: roleType === 'employee' ? employeeId : undefined
          });
        }, 800);
      } else {
        showToast(data.error || "Authentication gateway error.", "error");
      }
    } catch (err) {
      showToast("Authentication gateway offline.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#070b13] text-slate-100 min-h-screen font-sans flex flex-col justify-center items-center relative overflow-hidden px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[300px] h-[300px] bg-indigo-650/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-950/80 border border-slate-850 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative z-10 space-y-6"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-605 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
            <ShieldCheck className="h-6.5 w-6.5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-outfit">Identity Verification Gate</h2>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-450 mt-1 font-mono">SACH Kavach Security Core</p>
          </div>
        </div>

        {/* Roles Toggler */}
        <div className="bg-slate-900/50 p-1 rounded-xl flex border border-slate-850">
          <button
            type="button"
            onClick={() => handleQuickFill('admin')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
              roleType === 'admin' ? 'bg-blue-650 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SOC Supervisor
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill('employee')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
              roleType === 'employee' ? 'bg-blue-650 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Staff Associate
          </button>
        </div>

        {/* Login form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
          {roleType === 'admin' ? (
            <>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono">Supervisor Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin@sach.com"
                    className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-850 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-850 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono">Employee Name</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Raman Murthy"
                    className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-850 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 font-mono">Staff ID (CIF Prefix)</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="EMP101"
                    className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-850 rounded-xl text-xs font-mono uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-blue-650 to-indigo-650 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50"
          >
            {submitting ? "Signing Security Tokens..." : "Secure Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Accounts Quick Fill Helpers */}
        <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-xl space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 fill-current" />
            Quick-Fill Demo Credentials
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickFill('admin')}
              className="flex-1 py-1 px-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-350 text-[10px] rounded transition cursor-pointer"
            >
              🔑 SOC Admin
            </button>
            <button
              onClick={() => handleQuickFill('employee')}
              className="flex-1 py-1 px-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-355 text-[10px] rounded transition cursor-pointer"
            >
              🔑 Branch Staff
            </button>
          </div>
        </div>

        {/* Exit back */}
        <button
          onClick={onBackToLanding}
          className="text-[10px] text-slate-500 hover:text-slate-350 cursor-pointer block mx-auto underline transition"
        >
          ← Return to Landing Page
        </button>

      </motion.div>
    </div>
  );
};

export default LoginPage;
