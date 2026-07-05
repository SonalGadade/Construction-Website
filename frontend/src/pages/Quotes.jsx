import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuotes, negotiateCounter, updateRFQStatus } from '../store/quoteSlice.js';
import { 
  FileText, 
  MessageSquare, 
  User, 
  TrendingDown, 
  TrendingUp, 
  Check, 
  X, 
  Truck, 
  FileCheck, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Download,
  AlertTriangle
} from 'lucide-react';

const Quotes = () => {
  const dispatch = useDispatch();
  const { quotes, loading, error } = useSelector((state) => state.quotes);
  const { user } = useSelector((state) => state.auth);

  // Active Quote focus state
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  
  // Negotiation states
  const [dealerMessage, setDealerMessage] = useState('');
  const [dealerCounterRates, setDealerCounterRates] = useState({}); // productId -> counter price

  // Approval state
  const [paymentMethod, setPaymentMethod] = useState('Credit Line');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [creditError, setCreditError] = useState('');

  // Fetch quotes on load
  useEffect(() => {
    dispatch(fetchQuotes());
  }, [dispatch]);

  const activeQuote = quotes.find(q => q._id === activeQuoteId);

  // Initialize dealer counter inputs
  useEffect(() => {
    if (activeQuote && (user?.role === 'Dealer' || user?.role === 'Admin')) {
      const rates = {};
      activeQuote.items.forEach(item => {
        rates[item.product._id] = item.finalPrice || item.offerPrice || item.targetPrice;
      });
      setDealerCounterRates(rates);
    }
  }, [activeQuoteId, user]);

  const handleDealerSubmitNegotiation = async (e) => {
    e.preventDefault();
    if (!activeQuoteId) return;

    const counterItems = Object.entries(dealerCounterRates).map(([productId, price]) => ({
      productId,
      price: Number(price)
    }));

    const result = await dispatch(negotiateCounter({
      id: activeQuoteId,
      items: counterItems,
      message: dealerMessage || 'Dealer submitted updated quote rates'
    }));

    if (negotiateCounter.fulfilled.match(result)) {
      setDealerMessage('');
      alert('Counter-proposal submitted to buyer successfully!');
    }
  };

  const handleBuyerReject = async () => {
    if (!window.confirm('Are you sure you want to reject this quotation?')) return;
    
    const result = await dispatch(updateRFQStatus({
      id: activeQuoteId,
      status: 'Rejected',
    }));

    if (updateRFQStatus.fulfilled.match(result)) {
      alert('Quotation rejected.');
    }
  };

  const handleBuyerApprove = async () => {
    setCreditError('');
    const result = await dispatch(updateRFQStatus({
      id: activeQuoteId,
      status: 'Approved',
      paymentMethod,
    }));

    if (updateRFQStatus.fulfilled.match(result)) {
      setShowApprovalModal(false);
      alert('Quotation approved! Order placed and invoice generated.');
    } else {
      // Credit check failed, show error message
      setCreditError(result.payload || 'Credit check failed. Try Cash on Delivery.');
    }
  };

  const openApproveModal = () => {
    setCreditError('');
    setShowApprovalModal(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left panel: List of Quotation Requests */}
      <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 max-h-[80vh] overflow-y-auto">
        <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2 pb-3 border-b border-slate-800">
          <FileText className="w-4 h-4 text-blue-500" />
          Active Quotations ({quotes.length})
        </h3>

        {quotes.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            No quotations found. Initiate a Quote Request from the catalogue.
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map(quote => {
              const active = quote._id === activeQuoteId;
              const date = new Date(quote.updatedAt).toLocaleDateString();
              
              return (
                <button
                  key={quote._id}
                  onClick={() => setActiveQuoteId(quote._id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-200 ${
                    active 
                      ? 'bg-blue-600/10 border-blue-500/40 text-slate-100 shadow-md' 
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>RFQ #{quote._id.substring(18).toUpperCase()}</span>
                    <span>{date}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-200 mt-1 truncate">
                    {user?.role === 'Dealer' || user?.role === 'Admin' ? quote.buyer?.companyName || quote.buyer?.name : 'Procurement Proposal'}
                  </h4>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-800/40">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      quote.status === 'Converted to Order'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : quote.status === 'Negotiated'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : quote.status === 'Approved'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : quote.status === 'Rejected'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {quote.status}
                    </span>
                    <span className="text-xs font-bold text-blue-400">
                      INR {(quote.totalOfferedAmount || quote.totalRequestedAmount).toLocaleString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel: Live Negotiation Console & Logs */}
      <div className="lg:col-span-2 space-y-6">
        
        {activeQuote ? (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  RFQ GUID: {activeQuote._id}
                </span>
                <h3 className="text-base font-bold text-slate-200 mt-1">
                  Procurement Quote Request
                </h3>
                {activeQuote.buyer && (
                  <div className="flex gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-500" /> {activeQuote.buyer.name}</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] uppercase font-bold text-slate-300">{activeQuote.buyer.role}</span>
                    {activeQuote.buyer.companyName && <span className="text-slate-500">({activeQuote.buyer.companyName})</span>}
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Negotiated Pricing Total:</span>
                <span className="text-xl font-extrabold text-blue-400">
                  INR {(activeQuote.totalOfferedAmount || activeQuote.totalRequestedAmount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* List of items under negotiation */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Negotiation Items</h4>
              <div className="space-y-3">
                {activeQuote.items.map(item => {
                  const product = item.product || {};
                  
                  return (
                    <div key={item._id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h5 className="text-xs font-bold text-slate-200">{product.name}</h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">{product.brand} | Quantity: <strong className="text-slate-300">{item.quantity} {product.unit}</strong></p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-right md:w-3/5">
                        <div>
                          <span className="text-[9px] font-semibold text-slate-500 block uppercase">Requested Rate</span>
                          <span className="text-xs font-semibold text-slate-300 flex items-center justify-end gap-1 mt-0.5">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                            INR {item.targetPrice}
                          </span>
                        </div>

                        {user?.role === 'Dealer' || user?.role === 'Admin' ? (
                          <div className="col-span-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Counter Rate</label>
                            <input
                              type="number"
                              value={dealerCounterRates[product._id] || ''}
                              onChange={(e) => setDealerCounterRates({
                                ...dealerCounterRates,
                                [product._id]: e.target.value
                              })}
                              className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs text-right text-blue-400 font-semibold"
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="text-[9px] font-semibold text-slate-500 block uppercase">Dealer Counter</span>
                              <span className="text-xs font-bold text-blue-400 flex items-center justify-end gap-1 mt-0.5">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                                INR {item.offerPrice || item.targetPrice}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-semibold text-slate-500 block uppercase">Agreed Subtotal</span>
                              <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                                INR {((item.finalPrice || item.offerPrice || item.targetPrice) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buyer actions vs Dealer inputs */}
            {activeQuote.status !== 'Converted to Order' && activeQuote.status !== 'Rejected' ? (
              user?.role === 'Dealer' || user?.role === 'Admin' ? (
                <form onSubmit={handleDealerSubmitNegotiation} className="space-y-4 pt-4 border-t border-slate-800/80">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Dealer Remarks / Message</label>
                    <textarea
                      value={dealerMessage}
                      onChange={(e) => setDealerMessage(e.target.value)}
                      placeholder="Add negotiation messages or delivery conditions..."
                      rows="3"
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-lg flex items-center gap-2"
                  >
                    Submit Counter Proposal
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex gap-3 pt-4 border-t border-slate-800/80">
                  <button
                    onClick={handleBuyerReject}
                    className="flex-1 py-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/10 hover:border-red-500/25 text-red-400 text-xs font-bold rounded-xl transition-all"
                  >
                    Reject Proposal
                  </button>
                  <button
                    onClick={openApproveModal}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-1.5"
                  >
                    Approve Quotation
                  </button>
                </div>
              )
            ) : null}

            {/* Negotiation Log / Messages */}
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Negotiation History Log
              </h4>
              
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {activeQuote.negotiationHistory?.map((log, index) => {
                  const isSys = log.sender === 'System';
                  const isBuyer = log.sender === 'Buyer';
                  const date = new Date(log.timestamp).toLocaleTimeString();
                  
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        isSys 
                          ? 'bg-slate-950/50 border-slate-800/40 text-slate-400' 
                          : isBuyer 
                          ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 ml-6' 
                          : 'bg-blue-950/10 border-blue-900/20 text-slate-200 mr-6'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                        <span>{log.sender}</span>
                        <span>{date}</span>
                      </div>
                      <p>{log.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs flex flex-col items-center justify-center py-40">
            <FileText className="w-12 h-12 text-slate-700 mb-3" />
            <span className="font-semibold block text-slate-400 text-sm">No Quote Selected</span>
            <span className="text-[11px] mt-1 text-slate-500">Pick a quotation RFQ from the left sidebar to manage negotiations.</span>
          </div>
        )}

      </div>

      {/* Buyer Approval Modal with Credit Checks */}
      {showApprovalModal && activeQuote && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-[#0a0e17] border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl relative">
            <button 
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 mx-auto mb-3 border border-blue-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">Confirm Material Procurement</h3>
              <p className="text-xs text-slate-400 mt-1">Select your settlement terms to finalize the order.</p>
            </div>

            {/* Outstanding limit warning messages if credit check fails */}
            {creditError && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                <p className="font-medium leading-relaxed">{creditError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Payment Terms</label>
                <div className="space-y-2">
                  {[
                    { id: 'Credit Line', label: 'B2B Credit Line (30 Days Term)', desc: 'Charges balance to your approved credit ledger limit.' },
                    { id: 'Razorpay', label: 'Razorpay (NetBanking / UPI / Cards)', desc: 'Standard instant settlement portal.' },
                    { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay drivers at construction site unloading.' }
                  ].map(term => (
                    <label 
                      key={term.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === term.id
                          ? 'bg-blue-600/10 border-blue-500/40 text-slate-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_term"
                        checked={paymentMethod === term.id}
                        onChange={() => setPaymentMethod(term.id)}
                        className="mt-1"
                      />
                      <div>
                        <span className="text-xs font-bold block">{term.label}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{term.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pricing subtotal */}
              <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Materials Subtotal:</span>
                  <span className="text-slate-200">INR {activeQuote.totalOfferedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Taxes (18%):</span>
                  <span className="text-slate-200">INR {(activeQuote.totalOfferedAmount * 0.18).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span className="text-slate-200">{activeQuote.totalOfferedAmount > 100000 ? 'FREE' : 'INR 2,500'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-slate-300">
                  <span>Order Total:</span>
                  <span className="text-blue-400 text-sm">
                    INR {(activeQuote.totalOfferedAmount * 1.18 + (activeQuote.totalOfferedAmount > 100000 ? 0 : 2500)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBuyerApprove}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm Order & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Quotes;
