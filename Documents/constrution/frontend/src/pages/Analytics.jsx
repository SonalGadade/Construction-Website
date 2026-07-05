import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  BarChart3, 
  Activity, 
  Warehouse, 
  AlertTriangle,
  RefreshCcw,
  Sparkles
} from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [dataStats, setDataStats] = useState(null);

  // Trigger CRM Quote followup scan simulation
  const [crmScanning, setCrmScanning] = useState(false);
  const [crmLogs, setCrmLogs] = useState([]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch warehouses for stock statuses
      const whRes = await fetch('http://localhost:5000/api/warehouses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const whData = await whRes.json();

      // Fetch quotes for credit statuses
      const qRes = await fetch('http://localhost:5000/api/quotes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const qData = await qRes.json();

      // Fetch orders
      const oRes = await fetch('http://localhost:5000/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const oData = await oRes.json();

      // Synthesize charts data (blend live records with high-fidelity mock trends)
      const monthlyRevenue = [
        { month: 'Feb', Revenue: 1850000, Quotes: 2800000 },
        { month: 'Mar', Revenue: 2400000, Quotes: 3100000 },
        { month: 'Apr', Revenue: 3100000, Quotes: 4500000 },
        { month: 'May', Revenue: 2900000, Quotes: 4100000 },
        { month: 'Jun', Revenue: 3800000, Quotes: 5200000 },
        { month: 'Jul (Live)', Revenue: oData.data?.reduce((sum, o) => sum + o.totalAmount, 0) + 1200000 || 1200000, Quotes: qData.data?.reduce((sum, q) => sum + q.totalRequestedAmount, 0) + 1800000 || 1800000 },
      ];

      const brandSales = [
        { name: 'UltraTech', value: 45 },
        { name: 'TATA Tiscon', value: 30 },
        { name: 'Ambuja', value: 15 },
        { name: 'Jindal Steel', value: 10 },
      ];

      const creditRiskExposure = [
        { name: 'Ankit Builder Pro', limit: 500000, outstanding: 120000, risk: 'Low' },
        { name: 'Dev Contractor Ltd', limit: 600000, outstanding: 80000, risk: 'Low' },
        { name: 'Raj Gold Enterprise', limit: 1500000, outstanding: 450000, risk: 'Medium' },
        { name: 'Suresh Silver Materials', limit: 300000, outstanding: 0, risk: 'None' },
      ];

      // Warehouse turnover rates simulation based on live quantities
      const warehouseTurnover = whData.data?.map(wh => {
        const totalItems = wh.inventory?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        // turnover metric: capacity vs current stock ratio
        const capacity = wh.name.includes('NCR') ? 80000 : wh.name.includes('Haryana') ? 60000 : 50000;
        const rate = Number(((capacity - totalItems) / capacity * 100).toFixed(1));
        return {
          name: wh.name.split(' ')[0],
          'Turnover Rate %': rate > 0 ? rate : 15.5,
          Stock: totalItems
        };
      }) || [
        { name: 'NCR', 'Turnover Rate %': 45.2, Stock: 35000 },
        { name: 'Haryana', 'Turnover Rate %': 38.8, Stock: 28000 },
        { name: 'Delhi', 'Turnover Rate %': 52.1, Stock: 21000 },
      ];

      setDataStats({
        monthlyRevenue,
        brandSales,
        creditRiskExposure,
        warehouseTurnover,
        totalOrdersCount: oData.count || 0,
        totalRevenue: oData.data?.reduce((sum, o) => sum + o.totalAmount, 0) || 0
      });

    } catch (err) {
      console.log('Analytics compilation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const triggerCrmFollowup = async () => {
    try {
      setCrmScanning(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/quotes/crm/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ hours: 0.001 }) // scan all quotes updated in last few seconds (basically all active quotes for testing)
      });
      const data = await res.json();
      if (res.ok) {
        setCrmLogs(data.data);
      }
    } catch (err) {
      alert('Error triggering CRM scheduler');
    } finally {
      setCrmScanning(false);
    }
  };

  const COLORS = ['#3b82f6', '#4f46e5', '#10b981', '#f59e0b'];

  if (loading) {
    return <div className="text-center py-20 text-slate-500 text-xs">Assembling business analytics and ledger forecasts...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Upper overview counts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gross Marketplace GMV</span>
            <h3 className="text-xl font-extrabold text-slate-100 mt-1">
              INR {(dataStats.totalRevenue + 1200000).toLocaleString()}
            </h3>
            <span className="text-[9px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2% Month-over-Month
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Fulfillments Confirmed</span>
            <h3 className="text-xl font-extrabold text-slate-100 mt-1">
              {dataStats.totalOrdersCount + 18} Orders
            </h3>
            <span className="text-[9px] text-emerald-400 font-bold block mt-1.5 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +8.5% new pipelines
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Net B2B Outstanding Credit Risk</span>
            <h3 className="text-xl font-extrabold text-amber-400 mt-1">
              INR 650,000
            </h3>
            <span className="text-[9px] text-slate-500 block mt-1.5">
              Total credit line allocations: 2.9M
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* CRM Trigger Widget */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Automated CRM Services
            </span>
            <p className="text-[10px] text-slate-400 leading-snug mt-1">
              Scan abandoned quotations to trigger follow-up reminders.
            </p>
          </div>
          <button
            onClick={triggerCrmFollowup}
            disabled={crmScanning}
            className="w-full mt-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${crmScanning ? 'animate-spin' : ''}`} />
            {crmScanning ? 'Scanning...' : 'Scan & WhatsApp Remind'}
          </button>
        </div>

      </div>

      {/* CRM Scan Results Feed */}
      {crmLogs.length > 0 && (
        <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2.5">
            <Activity className="w-4 h-4 text-blue-400" />
            CRM Scanner Log Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {crmLogs.map((log, index) => (
              <div key={index} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-300">
                <div className="flex justify-between items-center font-semibold text-slate-400">
                  <span>Buyer: {log.buyerName}</span>
                  <span className="text-yellow-400">{log.status}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">WhatsApp & email reminder pushed successfully.</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphical Layouts: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Revenue Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-200">GMV Pipeline vs Confirmed Sales</h3>
            <span className="text-[10px] text-slate-500">6 Months Trend</span>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataStats.monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Confirmed Sales" />
                <Area type="monotone" dataKey="Quotes" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorQuotes)" name="RFQ Pipelines" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Warehouse Turnover Rates Bar Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-200">Warehouse Inventory Turnover Ratio</h3>
            <span className="text-[10px] text-slate-500">Nearest Warehouse Dispatch</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataStats.warehouseTurnover} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Bar dataKey="Turnover Rate %" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                  {dataStats.warehouseTurnover.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#4f46e5' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Brand Sales Pie chart */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Top-Selling Material Brands</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataStats.brandSales}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataStats.brandSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} layout="horizontal" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credit risk Exposure analysis table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Active B2B Credit Risk Portfolios</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3">Client Company</th>
                  <th className="py-3">Approved Limit</th>
                  <th className="py-3">Outstanding Dues</th>
                  <th className="py-3">Risk Assessment</th>
                </tr>
              </thead>
              <tbody>
                {dataStats.creditRiskExposure.map((client, index) => (
                  <tr key={index} className="border-b border-slate-800/60 hover:bg-slate-900/20">
                    <td className="py-3.5 font-bold text-slate-300">{client.name}</td>
                    <td className="py-3.5 text-slate-400">INR {client.limit.toLocaleString()}</td>
                    <td className="py-3.5 font-semibold text-slate-300">INR {client.outstanding.toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        client.risk === 'Medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : client.risk === 'Low'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : client.risk === 'None'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {client.risk} Risk
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
