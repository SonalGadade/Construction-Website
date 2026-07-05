import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Coins, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const Ledger = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Payment simulation state
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [paySuccess, setPaySuccess] = useState(false);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/credit', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLedger(data.data);
      }
    } catch (err) {
      console.log('Error fetching credit ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/credit/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(payAmount),
          referenceNumber: payRef || 'NEFT-' + Math.floor(Math.random() * 10000000)
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setLedger(data.data);
        setPayAmount('');
        setPayRef('');
        setPaySuccess(true);
        setTimeout(() => setPaySuccess(false), 5000);
      } else {
        alert(data.message || 'Payment simulation failed');
      }
    } catch (err) {
      alert('Error connecting to ledger services');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-xs">Loading Credit Ledger and financial reports...</div>;
  }

  if (!ledger) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-500 max-w-lg mx-auto mt-10">
        <CreditCard className="w-12 h-12 text-slate-700 mx-auto mb-3" />
        <h4 className="font-bold text-sm text-slate-400">Ledger Record Missing</h4>
        <p className="text-[11px] mt-1 text-slate-500">
          Your active account role ({user?.role}) does not have an allocated B2B credit line. Only Builders, Contractors, Gold, and Silver tiers can access credit lines.
        </p>
      </div>
    );
  }

  const limitUsed = ledger.outstandingBalance;
  const limitAvailable = ledger.creditLimit - ledger.outstandingBalance;
  const utilizationRatio = ((limitUsed / ledger.creditLimit) * 100).toFixed(0);
  const isHighRisk = utilizationRatio >= 85;

  return (
    <div className="space-y-6">
      
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Credit limit card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 bg-blue-600/5 rounded-full flex items-center justify-center border border-blue-500/10 text-blue-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">B2B Credit Line Limit</span>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-2">
            INR {ledger.creditLimit.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
            <span className="font-bold text-emerald-400">Active Limit</span>
            <span>- 30 Days Net Terms</span>
          </div>
        </div>

        {/* Outstanding Balance card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className={`absolute right-4 top-4 w-12 h-12 rounded-full flex items-center justify-center border ${
            isHighRisk ? 'bg-red-500/5 border-red-500/10 text-red-400' : 'bg-yellow-500/5 border-yellow-500/10 text-yellow-400'
          }`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Outstanding Due</span>
          <h2 className={`text-2xl font-extrabold mt-2 ${isHighRisk ? 'text-red-400' : 'text-slate-100'}`}>
            INR {ledger.outstandingBalance.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Next Settlement due:</span>
            <span className="font-semibold text-slate-300">{new Date(ledger.dueDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Available Capacity card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute right-4 top-4 w-12 h-12 bg-emerald-600/5 rounded-full flex items-center justify-center border border-emerald-500/10 text-emerald-400">
            <Coins className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Available Shopping Capacity</span>
          <h2 className="text-2xl font-extrabold text-emerald-400 mt-2">
            INR {limitAvailable.toLocaleString()}
          </h2>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-3 pt-3 border-t border-slate-800/60">
            <span className="font-bold text-emerald-400">{utilizationRatio}%</span>
            <span>limit capacity utilized</span>
          </div>
        </div>

      </div>

      {/* Credit Line Bar Utilization Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400">Credit utilization ratio:</span>
          <span className={`${isHighRisk ? 'text-red-400 font-bold' : 'text-blue-400'}`}>{utilizationRatio}% Utilized</span>
        </div>
        
        {/* Graph bar */}
        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850 p-[2px]">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isHighRisk 
                ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
            }`}
            style={{ width: `${Math.min(utilizationRatio, 100)}%` }}
          ></div>
        </div>

        {isHighRisk && (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Warning: Credit line utilization exceeds 85%. Make payments below to restore shopping limit capacity.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Transaction Ledger history */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 pb-3 border-b border-slate-800">
            Statement Transaction Logs
          </h3>

          {ledger.paymentHistory.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              No transactions recorded yet in this credit ledger.
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {[...ledger.paymentHistory].reverse().map((tx, index) => {
                const isDebit = tx.type === 'Debit';
                const date = new Date(tx.timestamp).toLocaleDateString();
                
                return (
                  <div key={index} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDebit ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                      }`}>
                        {isDebit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-200">{tx.description}</h5>
                        <span className="text-[10px] text-slate-500">{date}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold ${isDebit ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isDebit ? '+' : '-'} INR {tx.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Simulate balance clearance payment */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 h-fit space-y-4">
          <h3 className="font-bold text-sm text-slate-200 pb-3 border-b border-slate-800">
            Settle Balance (Simulator)
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Simulate an NEFT/IMPS bank transfer payment to clear outstanding balance and restore available shopping limit.
          </p>

          {paySuccess && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-pulse">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Balance payment cleared successfully!</span>
            </div>
          )}

          <form onSubmit={handleSimulatePayment} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Payment Amount (INR)</label>
              <input
                type="number"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full glass-input px-3 py-2.5 rounded-xl text-xs text-emerald-400 font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">NEFT Reference Number (Optional)</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. TXN9823489234"
                className="w-full glass-input px-3 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5"
            >
              Clear Outstanding Dues
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default Ledger;
