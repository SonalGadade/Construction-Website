import React from 'react';
import { useSelector } from 'react-redux';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Download, 
  MessageSquare, 
  ExternalLink,
  QrCode,
  Map,
  Share2
} from 'lucide-react';

const DigitalCard = () => {
  const { user } = useSelector((state) => state.auth);

  // Dealer Details Mock
  const dealerInfo = {
    name: 'Shyam Materials Private Limited',
    owner: 'Shyam Sundar',
    designation: 'Managing Director & Chief Dealer',
    phone: '+919999999999',
    email: 'sales@shyammaterials.com',
    gstin: '09SHYAM1234A1Z1',
    address: 'Plot No. 42, Block C, Sector 63, Noida, Uttar Pradesh, 201301',
    mapsLocation: 'https://maps.google.com/?q=28.627,77.382',
    whatsappMsg: 'https://wa.me/919999999999?text=Hello%20Shyam%20Materials%2C%20I%20want%20to%20negotiate%20a%20construction%20materials%20quotation.'
  };

  // Generate QR Code using the free API.QRServer
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dealerInfo.whatsappMsg)}&bgcolor=ffffff&color=0f172a`;

  const handleDownloadCard = () => {
    // Simply trigger printing layout or download notification
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Column: Glassmorphic Visiting Card */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            NFC Digital Visiting Card
          </span>
          
          {/* Card Container */}
          <div className="relative w-full aspect-[1.75/1] bg-gradient-to-tr from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            {/* Glossy Overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-white/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Card Content grid */}
            <div className="h-full flex flex-col justify-between relative z-10">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Building2 className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-100 tracking-tight truncate max-w-[200px]">
                      {dealerInfo.name}
                    </h3>
                    <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">
                      GSTIN: {dealerInfo.gstin}
                    </p>
                  </div>
                </div>
                
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800/80">
                  PLATINUM
                </span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-200">{dealerInfo.owner}</h4>
                <p className="text-[10px] text-slate-400 font-medium">{dealerInfo.designation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 pt-3 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>{dealerInfo.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>{dealerInfo.email}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDownloadCard}
              className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              Download & Print Card
            </button>
            
            <a
              href={dealerInfo.whatsappMsg}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10"
            >
              <MessageSquare className="w-4 h-4" />
              Message on WhatsApp
            </a>
          </div>
        </div>

        {/* Right Column: QR Code & Map Proximity Info */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          
          <div className="flex items-start gap-4">
            {/* QR Code Container */}
            <div className="w-36 h-36 bg-white p-2.5 rounded-2xl flex-shrink-0 shadow-lg border border-slate-700/30">
              <img 
                src={qrCodeUrl} 
                alt="Dealer WhatsApp QR Code" 
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-500" />
                Scan to Negotiate
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Scan the QR code with your smartphone camera to launch WhatsApp and begin direct quote negotiation with Shyam Materials sales agents.
              </p>
              <a
                href={dealerInfo.whatsappMsg}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 mt-1 transition-colors"
              >
                Launch Live Link <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Map Section */}
          <div className="border-t border-slate-800/80 pt-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Map className="w-4 h-4 text-blue-500" />
              Geographical Location Map
            </h4>

            {/* Simulated Google Map Canvas */}
            <div className="h-32 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative flex items-center justify-center">
              {/* Retro digital blueprint design for map look */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:16px_16px] opacity-40"></div>
              
              <div className="relative text-center space-y-1">
                <MapPin className="w-7 h-7 text-red-500 mx-auto animate-bounce" />
                <span className="text-[10px] font-bold text-slate-300 block">{dealerInfo.address.split(',')[3]}</span>
                <span className="text-[9px] text-slate-500 block">Coordinates: 28.627° N, 77.382° E</span>
              </div>
            </div>

            <a
              href={dealerInfo.mapsLocation}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              Open in Google Maps
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DigitalCard;
