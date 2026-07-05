import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { 
  Building2, 
  ShoppingBag, 
  FileText, 
  CreditCard, 
  Calculator, 
  BarChart3, 
  UserSquare2, 
  LogOut, 
  MapPin, 
  Coins 
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Material Catalog', path: '/', icon: ShoppingBag, roles: ['Retail', 'Builder', 'Contractor', 'Gold', 'Silver', 'Dealer', 'Admin'] },
    { name: 'Quotation RFQs', path: '/quotes', icon: FileText, roles: ['Retail', 'Builder', 'Contractor', 'Gold', 'Silver', 'Dealer', 'Admin'] },
    { name: 'Credit Ledger', path: '/ledger', icon: CreditCard, roles: ['Builder', 'Contractor', 'Gold', 'Silver', 'Dealer', 'Admin'] },
    { name: 'Material Estimator', path: '/estimator', icon: Calculator, roles: ['Retail', 'Builder', 'Contractor', 'Gold', 'Silver', 'Dealer', 'Admin'] },
    { name: 'Business Analytics', path: '/analytics', icon: BarChart3, roles: ['Dealer', 'Admin'] },
    { name: 'Digital Visiting Card', path: '/digital-card', icon: UserSquare2, roles: ['Retail', 'Builder', 'Contractor', 'Gold', 'Silver', 'Dealer', 'Admin'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-[#070b13] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between p-5 z-20">
        <div>
          {/* Logo / Header */}
          <div className="flex items-center gap-3 px-2 py-4 mb-6">
            <Building2 className="w-8 h-8 text-blue-500 animate-pulse-subtle" />
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                SMART BUILD
              </h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Materials Marketplace
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive 
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="border-t border-slate-800 pt-4 mt-auto">
          {user && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-slate-200">{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      user.role === 'Dealer' || user.role === 'Admin'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : user.role === 'Builder'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : user.role === 'Gold'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : user.role === 'Silver'
                        ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loyalty & Location indicators */}
              <div className="bg-slate-900/60 rounded-xl p-2.5 mt-2 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-yellow-500" /> Points:</span>
                  <span className="font-semibold text-yellow-400">{user.loyaltyPoints || 0} PTS</span>
                </div>
                {user.address?.city && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" /> Location:</span>
                    <span className="font-semibold text-slate-300 truncate max-w-[80px]">{user.address.city}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 rounded-xl border border-red-500/10 hover:border-red-500/25 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-[#070b13]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Workspace Dashboard</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 text-sm font-semibold capitalize">
              {location.pathname.substring(1) || 'Material Catalog'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick status flags */}
            <div className="flex items-center gap-3 text-xs bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Node API Active
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
