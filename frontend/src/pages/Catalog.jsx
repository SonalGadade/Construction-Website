import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, fetchNearestWarehouse, fetchSeasonalSuggestions } from '../store/catalogSlice.js';
import { submitRFQ } from '../store/quoteSlice.js';
import { 
  Search, 
  Filter, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  Download, 
  FileText, 
  ShoppingBag, 
  ChevronRight, 
  Check, 
  X, 
  ShoppingCart, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

const Catalog = () => {
  const dispatch = useDispatch();
  const { products, seasonal, nearestWarehouse, loading } = useSelector((state) => state.catalog);
  const { user, coordinates } = useSelector((state) => state.auth);

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [rfqRemarks, setRfqRemarks] = useState('');
  const [rfqSuccessMsg, setRfqSuccessMsg] = useState('');

  // Detail Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [crossSells, setCrossSells] = useState([]);

  // Mock coordinates inputs for user location (e.g. Noida vs Gurugram vs Jaipur)
  const [userLat, setUserLat] = useState(coordinates.latitude);
  const [userLng, setUserLng] = useState(coordinates.longitude);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchSeasonalSuggestions());
    dispatch(fetchNearestWarehouse(coordinates));
  }, [dispatch, coordinates]);

  // Handle Search & Filter Submission
  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    dispatch(fetchProducts({ category, brand, search, minPrice, maxPrice }));
  };

  // Re-calculate proximity with custom coordinates
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    const coords = { latitude: Number(userLat), longitude: Number(userLng) };
    dispatch(fetchNearestWarehouse(coords));
  };

  // Cart Management
  const addToCart = (product, targetQty = 50) => {
    const existing = cart.find(item => item.product._id === product._id);
    const userRole = user?.role || 'Retail';
    const basePrice = product.pricingTiers[userRole] || product.pricingTiers.Retail;

    if (existing) {
      setCart(cart.map(item => 
        item.product._id === product._id 
          ? { ...item, quantity: item.quantity + Number(targetQty) } 
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity: Number(targetQty),
        targetPrice: basePrice // default to tier price
      }]);
    }
  };

  const updateCartQty = (productId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.product._id !== productId));
    } else {
      setCart(cart.map(item => 
        item.product._id === productId 
          ? { ...item, quantity: Number(qty) } 
          : item
      ));
    }
  };

  const updateCartTargetPrice = (productId, price) => {
    setCart(cart.map(item => 
      item.product._id === productId 
        ? { ...item, targetPrice: Number(price) } 
        : item
    ));
  };

  // Submit RFQ Checkout
  const handleCheckoutRFQ = async () => {
    if (cart.length === 0) return;

    const rfqItems = cart.map(item => ({
      productId: item.product._id,
      quantity: item.quantity,
      targetPrice: item.targetPrice
    }));

    const resultAction = await dispatch(submitRFQ({ items: rfqItems, remarks: rfqRemarks }));
    if (submitRFQ.fulfilled.match(resultAction)) {
      setRfqSuccessMsg(`RFQ #${resultAction.payload._id.substring(18).toUpperCase()} submitted successfully! The dealer will review your target rates shortly.`);
      setCart([]);
      setRfqRemarks('');
      setTimeout(() => setRfqSuccessMsg(''), 6000);
    }
  };

  // Open details and load cross-sell recommendations
  const openProductDetails = async (product) => {
    setSelectedProduct(product);
    try {
      const res = await fetch(`http://localhost:5000/api/products/${product._id}/recommendations`);
      const data = await res.json();
      if (res.ok) {
        setCrossSells(data.data);
      }
    } catch (err) {
      console.log('Cross-sell fetch error:', err);
    }
  };

  // Compute tier savings compared to retail price
  const getTierSavings = (product) => {
    const userRole = user?.role || 'Retail';
    if (userRole === 'Retail') return 0;
    const retail = product.pricingTiers.Retail;
    const tierPrice = product.pricingTiers[userRole] || retail;
    const savings = ((retail - tierPrice) / retail) * 100;
    return savings.toFixed(0);
  };

  // Find stock in the nearest warehouse for a specific product
  const getWarehouseStock = (productId) => {
    if (!nearestWarehouse) return 0;
    const item = nearestWarehouse.inventory?.find(inv => inv.product?._id === productId || inv.product === productId);
    return item ? item.quantity : 0;
  };

  const categories = ['Cement', 'Steel', 'Bricks', 'Sand', 'Waterproofing', 'Cooling Materials'];
  const brands = ['UltraTech', 'Ambuja', 'TATA Tiscon', 'Jindal Steel', 'EcoBuild', 'Dr. Fixit', 'Local Clay', 'Natural Sourced'];

  return (
    <div className="space-y-6">
      
      {/* Upper Widgets: Seasonal Recommendation & Proximity Coordinates Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Proximity Location Coordinate Simulation Box */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-1.5">
              <MapPin className="w-4 h-4 text-blue-500" />
              Delivery Location Simulator
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter delivery site coordinates to find the closest supply warehouse.
            </p>
            <form onSubmit={handleLocationSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.001"
                    value={userLat}
                    onChange={(e) => setUserLat(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.001"
                    value={userLng}
                    onChange={(e) => setUserLng(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/55 text-slate-200 text-xs font-semibold rounded-xl active:scale-95 transition-all duration-200"
              >
                Re-calculate Proximity
              </button>
            </form>
          </div>

          {nearestWarehouse && (
            <div className="mt-4 p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-300">Nearest Warehouse:</span>
                <span className="font-bold text-blue-400">{nearestWarehouse.distanceKm} km</span>
              </div>
              <p className="text-[11px] text-slate-400">{nearestWarehouse.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{nearestWarehouse.locationName}</p>
            </div>
          )}
        </div>

        {/* Seasonal Materials Intel Alert */}
        {seasonal && (
          <div className="lg:col-span-2 bg-gradient-to-r from-blue-950/40 to-indigo-950/40 backdrop-blur-md p-5 rounded-2xl border border-blue-800/30 flex items-start gap-4">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[9px] font-bold uppercase tracking-wider">
                {seasonal.season} Optimization Recommendation
              </span>
              <h3 className="text-sm font-bold text-slate-200 mt-1.5">Seasonal Weather-Proof Construction Advisory</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{seasonal.tagline}</p>
              
              <div className="flex gap-2 mt-4">
                {seasonal.data?.map(prod => (
                  <button 
                    key={prod._id}
                    onClick={() => openProductDetails(prod)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-lg text-[10px] text-slate-300 transition-all"
                  >
                    <span>{prod.brand} {prod.category}</span>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RFQ submission notification */}
      {rfqSuccessMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-start gap-3 shadow-lg animate-bounce">
          <Check className="w-5 h-5 mt-0.5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs font-semibold leading-relaxed">{rfqSuccessMsg}</p>
        </div>
      )}

      {/* Main Grid: Filter Column & Catalog List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Catalog Filters Side panel */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 h-fit space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              Filter Catalogue
            </h3>
            <button 
              onClick={() => {
                setCategory(''); setBrand(''); setSearch(''); setMinPrice(''); setMaxPrice('');
                dispatch(fetchProducts());
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold uppercase tracking-wider transition-colors"
            >
              Reset All
            </button>
          </div>

          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Search Material</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs"
                  placeholder="Cement, TMT Steel Rebars..."
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Brand</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs"
              >
                <option value="">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Price Range (Retail ref)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all"
            >
              Apply Filters
            </button>
          </form>
        </div>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400 font-medium">
              Showing <span className="text-slate-100 font-semibold">{products.length}</span> materials matching filters
            </p>
            
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/25 rounded-xl text-xs font-bold transition-all relative"
            >
              <ShoppingCart className="w-4 h-4" />
              RFQ Builder Cart
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center border border-slate-900 shadow-md">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => {
              const userRole = user?.role || 'Retail';
              const tierPrice = product.pricingTiers[userRole] || product.pricingTiers.Retail;
              const retailPrice = product.pricingTiers.Retail;
              const savings = getTierSavings(product);
              const stock = getWarehouseStock(product._id);
              const isLowStock = stock <= product.lowStockThreshold;

              return (
                <div key={product._id} className="glass-card rounded-2xl flex flex-col justify-between overflow-hidden relative group">
                  
                  {/* Low Stock Warning Banner */}
                  {isLowStock && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-red-950/90 text-red-400 border border-red-500/20 rounded-md text-[9px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      Low Stock at Nearest WH ({stock} {product.unit})
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="h-44 overflow-hidden relative bg-slate-950">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-80"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#070b13] to-transparent"></div>
                  </div>

                  {/* Details Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{product.brand}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-800/80 rounded-md text-slate-300 font-medium">{product.category}</span>
                      </div>
                      
                      <h4 className="font-bold text-sm text-slate-200 mt-1 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Pricing blocks */}
                    <div className="pt-3 border-t border-slate-800/80">
                      
                      {userRole !== 'Retail' && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 line-through">
                          <span>Retail Price:</span>
                          <span>INR {retailPrice.toLocaleString()} / {product.unit}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                          {userRole} Rate:
                        </span>
                        <span className="text-base font-bold text-blue-400">
                          INR {tierPrice.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/{product.unit}</span>
                        </span>
                      </div>

                      {userRole !== 'Retail' && savings > 0 && (
                        <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
                          <Check className="w-3.5 h-3.5" />
                          Tier savings: {savings}% off retail rate
                        </div>
                      )}
                    </div>

                    {/* Add to RFQ Action Buttons */}
                    <div className="pt-3 flex gap-2">
                      <button
                        onClick={() => openProductDetails(product)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/40 text-slate-300 text-xs font-bold rounded-xl transition-all"
                      >
                        Specs & suggestions
                      </button>
                      <button
                        onClick={() => addToCart(product, product.category === 'Bricks' ? 1000 : 50)}
                        className="px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-95 transition-all flex items-center justify-center"
                        title="Add to RFQ builder"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Cart Slider Overlay */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#0a0e17] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl animate-slide-in">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  Request For Quote (RFQ) Cart
                </h3>
                <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <ShoppingCart className="w-12 h-12 text-slate-700 mb-3" />
                  <p className="text-xs font-semibold">Your RFQ Cart is empty</p>
                  <p className="text-[11px] text-slate-600 text-center mt-1">Add construction materials from the grid catalogue to start pricing negotiations.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product._id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{item.product.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded mt-1 inline-block">
                            {item.product.brand} | Category: {item.product.category}
                          </span>
                        </div>
                        <button 
                          onClick={() => updateCartQty(item.product._id, 0)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/40">
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                            Quantity ({item.product.unit})
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCartQty(item.product._id, e.target.value)}
                            className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                            Target Price (Per Unit)
                          </label>
                          <input
                            type="number"
                            value={item.targetPrice}
                            onChange={(e) => updateCartTargetPrice(item.product._id, e.target.value)}
                            className="w-full glass-input px-2.5 py-1.5 rounded-lg text-xs text-blue-400 font-semibold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">RFQ Remarks / Site Instructions</label>
                    <textarea
                      value={rfqRemarks}
                      onChange={(e) => setRfqRemarks(e.target.value)}
                      placeholder="Specify shipping directions, grade demands, or custom delivery schedules..."
                      rows="3"
                      className="w-full glass-input px-3 py-2 rounded-xl text-xs resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center mb-4 text-xs font-semibold text-slate-300">
                  <span>Estimated Total Requested:</span>
                  <span className="text-sm font-bold text-slate-100">
                    INR {cart.reduce((sum, item) => sum + (item.targetPrice * item.quantity), 0).toLocaleString()}
                  </span>
                </div>
                
                <button
                  onClick={handleCheckoutRFQ}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Submit Quote RFQ to Dealer
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Details drawer modal (contains cross sell suggestions & PDF brochure links) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="w-full max-w-2xl bg-[#0a0e17] border border-slate-800 p-6 rounded-3xl flex flex-col justify-between shadow-2xl relative">
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="rounded-2xl overflow-hidden h-52 bg-slate-950">
                <img 
                  src={selectedProduct.images[0]} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover opacity-80"
                />
              </div>

              {/* Product Description */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">{selectedProduct.brand}</span>
                  <h3 className="text-lg font-bold text-slate-200">{selectedProduct.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-800 rounded-md text-slate-300 text-[10px] font-medium inline-block mt-1">
                    {selectedProduct.category}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {selectedProduct.description}
                </p>

                {selectedProduct.pdfSpecUrl && (
                  <a
                    href={selectedProduct.pdfSpecUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs text-blue-400 font-semibold transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Specifications Sheet PDF
                  </a>
                )}
              </div>
            </div>

            {/* Dynamic Cross Selling recommendations based on rules */}
            {crossSells.length > 0 && (
              <div className="mt-6 border-t border-slate-800/80 pt-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  Frequently Bought Together (Cross-Sell Recommendations)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {crossSells.map(item => (
                    <div 
                      key={item._id} 
                      className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">{item.brand}</span>
                        <h5 className="text-[11px] font-bold text-slate-200 truncate mt-0.5">{item.name}</h5>
                      </div>
                      <button
                        onClick={() => addToCart(item, item.category === 'Bricks' ? 1000 : 50)}
                        className="ml-2.5 p-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all"
                        title="Add recommended product"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Catalog;
