import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import CreditLedger from '../models/CreditLedger.js';

dotenv.config();

const usersData = [
  {
    name: 'Shyam Materials Dealer',
    email: 'dealer@example.com',
    password: 'password123',
    role: 'Dealer',
    phone: '+919999999999',
    companyName: 'Shyam Materials Pvt Ltd',
    gstNumber: '09SHYAM1234A1Z1',
    address: { street: 'Sector 62', city: 'Noida', state: 'Uttar Pradesh', zipCode: '201301', coordinates: { latitude: 28.62, longitude: 77.37 } }
  },
  {
    name: 'Rohan Retail Buyer',
    email: 'retail@example.com',
    password: 'password123',
    role: 'Retail',
    phone: '+918888888888',
    companyName: 'Individual Builder',
    gstNumber: '',
    address: { street: 'Indirapuram', city: 'Ghaziabad', state: 'Uttar Pradesh', zipCode: '201014', coordinates: { latitude: 28.64, longitude: 77.34 } }
  },
  {
    name: 'Ankit Builder Pro',
    email: 'builder@example.com',
    password: 'password123',
    role: 'Builder',
    phone: '+917777777777',
    companyName: 'Ankit Construction Corp',
    gstNumber: '09ANKIT5678B2Z2',
    address: { street: 'Sohna Road', city: 'Gurugram', state: 'Haryana', zipCode: '122018', coordinates: { latitude: 28.42, longitude: 77.03 } }
  },
  {
    name: 'Dev Contractor Ltd',
    email: 'contractor@example.com',
    password: 'password123',
    role: 'Contractor',
    phone: '+916666666666',
    companyName: 'Dev Contracting Co',
    gstNumber: '07DEVCO9012C3Z3',
    address: { street: 'Connaught Place', city: 'New Delhi', state: 'Delhi', zipCode: '110001', coordinates: { latitude: 28.63, longitude: 77.22 } }
  },
  {
    name: 'Raj Gold Enterprise',
    email: 'gold@example.com',
    password: 'password123',
    role: 'Gold',
    phone: '+915555555555',
    companyName: 'Raj Infrastructure',
    gstNumber: '08RAJIN3456D4Z4',
    address: { street: 'Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', zipCode: '302017', coordinates: { latitude: 26.85, longitude: 75.82 } }
  },
  {
    name: 'Suresh Silver Materials',
    email: 'silver@example.com',
    password: 'password123',
    role: 'Silver',
    phone: '+914444444444',
    companyName: 'Suresh Builders',
    gstNumber: '27SURES7890E5Z5',
    address: { street: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', zipCode: '400053', coordinates: { latitude: 19.12, longitude: 72.82 } }
  }
];

const productsData = [
  {
    name: 'UltraTech Premium Cement',
    category: 'Cement',
    brand: 'UltraTech',
    description: 'High-strength structural OPC 53 Grade cement suitable for all RCC structures, high-rise buildings, and bridges.',
    images: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: 'https://www.ultratechcement.com/content/dam/ultratechcement/pdf/UltraTech-Product-Brochure.pdf',
    pricingTiers: { Retail: 420, Builder: 380, Contractor: 390, Gold: 360, Silver: 375 },
    unit: 'Bags',
    lowStockThreshold: 150
  },
  {
    name: 'Ambuja Kawach Waterproof Cement',
    category: 'Cement',
    brand: 'Ambuja',
    description: 'Specially engineered water-repellent cement using active-pore clogging technology. Ideal for foundations and waterproofing.',
    images: ['https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: 'https://www.ambujacement.com/kawach-brochure.pdf',
    pricingTiers: { Retail: 450, Builder: 410, Contractor: 420, Gold: 390, Silver: 405 },
    unit: 'Bags',
    lowStockThreshold: 120
  },
  {
    name: 'TATA Tiscon TMT Steel Rebar FE 550D',
    category: 'Steel',
    brand: 'TATA Tiscon',
    description: 'High ductile reinforcement steel bars offering superior seismic resistance and high load-bearing capacity.',
    images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: 'https://www.tatatiscon.co.in/pdf/Tiscon550D.pdf',
    pricingTiers: { Retail: 62000, Builder: 58000, Contractor: 59000, Gold: 56000, Silver: 57000 },
    unit: 'Tons',
    lowStockThreshold: 10
  },
  {
    name: 'Jindal Panther TMT Steel Bars',
    category: 'Steel',
    brand: 'Jindal Steel',
    description: 'Premium thermo-mechanically treated steel bars with high bond strength and corrosion resistance.',
    images: ['https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: 'https://www.jindalpanther.com/brochure.pdf',
    pricingTiers: { Retail: 60500, Builder: 56500, Contractor: 57500, Gold: 54500, Silver: 55500 },
    unit: 'Tons',
    lowStockThreshold: 15
  },
  {
    name: 'Red Clay Bricks (Class A)',
    category: 'Bricks',
    brand: 'Local Clay',
    description: 'High-quality kiln-fired uniform clay bricks offering excellent thermal insulation and compressive strength.',
    images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: '',
    pricingTiers: { Retail: 8, Builder: 6, Contractor: 6.5, Gold: 5.5, Silver: 5.8 },
    unit: 'Pieces',
    lowStockThreshold: 2000
  },
  {
    name: 'Eco-Friendly Fly Ash Bricks',
    category: 'Bricks',
    brand: 'EcoBuild',
    description: 'Lightweight, durable, water-resistant fly ash bricks with accurate dimensions. Reduces plastering costs.',
    images: ['https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: '',
    pricingTiers: { Retail: 10, Builder: 7.5, Contractor: 8, Gold: 7, Silver: 7.2 },
    unit: 'Pieces',
    lowStockThreshold: 2500
  },
  {
    name: 'Dr. Fixit FastFlex Waterproofing',
    category: 'Waterproofing',
    brand: 'Dr. Fixit',
    description: 'Two-component acrylic-modified cementitious liquid applied waterproofing membrane for roofs and bathrooms.',
    images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: 'https://www.drfixit.co.in/fastflex.pdf',
    pricingTiers: { Retail: 2400, Builder: 2100, Contractor: 2200, Gold: 1950, Silver: 2050 },
    unit: 'Bags', // Powder bag + liquid container set
    lowStockThreshold: 30
  },
  {
    name: 'River Sand (Coarse)',
    category: 'Sand',
    brand: 'Natural Sourced',
    description: 'Cleaned river sand suitable for structural concrete, plastering, and brickwork, free from clay and organic matter.',
    images: ['https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=600'],
    pdfSpecUrl: '',
    pricingTiers: { Retail: 3200, Builder: 2800, Contractor: 2900, Gold: 2600, Silver: 2700 },
    unit: 'Tons',
    lowStockThreshold: 20
  }
];

const warehousesData = [
  {
    name: 'NCR Central Warehouse',
    locationName: 'Noida Sector 63, UP',
    coordinates: { latitude: 28.627, longitude: 77.382 }
  },
  {
    name: 'Haryana Supply Hub',
    locationName: 'Gurugram Sector 18, HR',
    coordinates: { latitude: 28.482, longitude: 77.075 }
  },
  {
    name: 'Delhi South Depot',
    locationName: 'Okhla Phase 3, New Delhi',
    coordinates: { latitude: 28.535, longitude: 77.272 }
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_construction');
    console.log('Seed: Connected to Database...');

    // Clear existing collections
    await User.deleteMany();
    await Product.deleteMany();
    await Warehouse.deleteMany();
    await CreditLedger.deleteMany();
    console.log('Seed: Cleared old collections.');

    // Seed Users
    const seededUsers = [];
    for (const u of usersData) {
      const newUser = new User(u);
      await newUser.save();
      seededUsers.push(newUser);
    }
    console.log(`Seed: Created ${seededUsers.length} Users.`);

    // Seed Products
    const seededProducts = await Product.insertMany(productsData);
    console.log(`Seed: Created ${seededProducts.length} Products.`);

    // Seed Warehouses with inventory items
    for (const wh of warehousesData) {
      const whInventory = seededProducts.map(prod => {
        // High stock for Cement, Bricks, and low/medium for Steel, Waterproofing, Sand
        let qty = 1000;
        if (prod.category === 'Bricks') qty = 50000;
        else if (prod.category === 'Cement') qty = 3000;
        else if (prod.category === 'Steel') qty = 45; // 45 tons
        else if (prod.category === 'Sand') qty = 120;
        else if (prod.category === 'Waterproofing') qty = 200;
        
        return {
          product: prod._id,
          quantity: qty
        };
      });

      const newWH = new Warehouse({
        ...wh,
        inventory: whInventory
      });
      await newWH.save();
    }
    console.log(`Seed: Created ${warehousesData.length} Warehouses with full inventory stock.`);

    // Seed Credit Ledger for B2B users: Builder (Ankit Builder Pro), Gold (Raj Gold Enterprise), Silver (Suresh Silver Materials), Contractor (Dev Contractor Ltd)
    const builderUser = seededUsers.find(u => u.role === 'Builder');
    const goldUser = seededUsers.find(u => u.role === 'Gold');
    const silverUser = seededUsers.find(u => u.role === 'Silver');
    const contractorUser = seededUsers.find(u => u.role === 'Contractor');

    // Create Builder Credit Ledger
    const builderLedger = new CreditLedger({
      buyer: builderUser._id,
      creditLimit: 500000,
      outstandingBalance: 120000,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // due in 15 days
      paymentHistory: [
        {
          type: 'Debit',
          amount: 150000,
          referenceModel: 'Payment', // mock ref
          referenceId: builderUser._id,
          description: 'Material purchase - Order #ORD-89234',
        },
        {
          type: 'Credit',
          amount: 30000,
          referenceModel: 'Payment',
          referenceId: builderUser._id,
          description: 'NEFT Payment Received - Ref#823904',
        }
      ]
    });
    await builderLedger.save();

    // Create Gold Credit Ledger
    const goldLedger = new CreditLedger({
      buyer: goldUser._id,
      creditLimit: 1500000,
      outstandingBalance: 450000,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      paymentHistory: [
        {
          type: 'Debit',
          amount: 450000,
          referenceModel: 'Payment',
          referenceId: goldUser._id,
          description: 'Steel Structural procurement - Order #ORD-77112',
        }
      ]
    });
    await goldLedger.save();

    // Create Silver Credit Ledger
    const silverLedger = new CreditLedger({
      buyer: silverUser._id,
      creditLimit: 300000,
      outstandingBalance: 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentHistory: []
    });
    await silverLedger.save();

    // Create Contractor Credit Ledger
    const contractorLedger = new CreditLedger({
      buyer: contractorUser._id,
      creditLimit: 600000,
      outstandingBalance: 80000,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      paymentHistory: [
        {
          type: 'Debit',
          amount: 80000,
          referenceModel: 'Payment',
          referenceId: contractorUser._id,
          description: 'Eco bricks & Cement supply - Order #ORD-12344',
        }
      ]
    });
    await contractorLedger.save();

    console.log('Seed: Created Credit Ledgers for B2B accounts.');
    console.log('Seed: Database seeded successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
