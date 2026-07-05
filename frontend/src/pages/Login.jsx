import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, loginWithOtp, clearError } from '../store/authSlice.js';
import { Building2, KeyRound, Phone, Mail, ShieldAlert, ArrowRight, Smartphone } from 'lucide-react';

const Login = () => {
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('builder@example.com'); // default for easy testing
  const [password, setPassword] = useState('password123');
  
  const [phone, setPhone] = useState('+917777777777'); // default builder phone
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!phone) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/otp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        // Intercept simulated OTP for display in mock environment
        // The WhatsApp service prints it, let's extract it or mock a standard display
        const mockCode = phone === '+917777777777' ? '777777' : Math.floor(100000 + Math.random() * 900000).toString();
        // Set it directly in state so user can copy-paste for convenience
        setSimulatedCode(mockCode);
        setOtp(mockCode); // Autofill code for instant login convenience
      } else {
        alert(data.message || 'OTP request failed');
      }
    } catch (err) {
      alert('Error connecting to backend server');
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    dispatch(loginWithOtp({ phone, otp }));
  };

  const quickLogins = [
    { name: 'Ankit Pro (Builder)', email: 'builder@example.com', phone: '+917777777777' },
    { name: 'Shyam Dealer (Dealer)', email: 'dealer@example.com', phone: '+919999999999' },
    { name: 'Rohan Retail (Retail)', email: 'retail@example.com', phone: '+918888888888' },
    { name: 'Raj Gold (Gold)', email: 'gold@example.com', phone: '+915555555555' },
  ];

  const fillCredentials = (item) => {
    setEmail(item.email);
    setPassword('password123');
    setPhone(item.phone);
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <Building2 className="w-8 h-8 text-white animate-pulse-subtle" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Smart Construction
          </h2>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">
            Materials Marketplace Portal
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => { setActiveTab('password'); dispatch(clearError()); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 ${
              activeTab === 'password'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            PASSWORD LOGIN
          </button>
          <button
            onClick={() => { setActiveTab('otp'); dispatch(clearError()); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 ${
              activeTab === 'otp'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            WHATSAPP OTP
          </button>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-4 bg-red-950/40 border border-red-500/30 text-red-300 p-3 rounded-xl flex items-start gap-2.5 text-xs">
            <ShieldAlert className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* Forms */}
        {activeTab === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-sm"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all duration-200 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleOtpSubmit : handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                WhatsApp Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-sm"
                  placeholder="+919876543210"
                  required
                  disabled={otpSent}
                />
              </div>
            </div>

            {otpSent && (
              <>
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl text-[11px] text-emerald-400">
                  <span className="font-semibold block mb-0.5">Mock WhatsApp System:</span>
                  OTP sent code generated on server: <strong className="text-slate-100 bg-slate-900 px-1.5 py-0.5 rounded text-xs select-all ml-1">{simulatedCode}</strong>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Enter 6-Digit OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-sm text-center font-mono letter tracking-widest text-lg"
                      placeholder="000000"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg active:scale-95 transition-all duration-200 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : otpSent ? 'Verify & Sign In' : 'Send WhatsApp OTP'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick Seeding accounts credentials list */}
        <div className="mt-8 border-t border-slate-800/80 pt-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Quick Sandbox Logins
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickLogins.map((item) => (
              <button
                key={item.email}
                onClick={() => fillCredentials(item)}
                className="p-2 text-left bg-slate-950/40 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl text-[11px] transition-all duration-150"
              >
                <span className="font-semibold block text-slate-300">{item.name}</span>
                <span className="text-slate-500 block truncate">{item.email}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
