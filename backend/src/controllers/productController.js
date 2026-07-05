import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { category, brand, search, minPrice, maxPrice } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }
    if (brand) {
      query.brand = brand;
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Apply basic price range on Retail pricing tier as default filter reference
    if (minPrice || maxPrice) {
      query['pricingTiers.Retail'] = {};
      if (minPrice) {
        query['pricingTiers.Retail'].$gte = Number(minPrice);
      }
      if (maxPrice) {
        query['pricingTiers.Retail'].$lte = Number(maxPrice);
      }
    }

    const products = await Product.find(query);
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cross-selling recommendations
// @route   GET /api/products/:id/recommendations
// @access  Public
export const getRecommendations = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Direct cross-selling rule logic:
    // - Buying Cement suggests Sand, Bricks, and Waterproofing
    // - Buying Steel suggests Cement
    // - Buying Bricks suggests Cement, Sand
    let targetCategories = [];
    if (product.category === 'Cement') {
      targetCategories = ['Sand', 'Bricks', 'Waterproofing'];
    } else if (product.category === 'Steel') {
      targetCategories = ['Cement', 'Waterproofing'];
    } else if (product.category === 'Bricks') {
      targetCategories = ['Cement', 'Sand'];
    } else {
      targetCategories = ['Cement', 'Steel'];
    }

    const suggestions = await Product.find({
      category: { $in: targetCategories },
      _id: { $ne: product._id }
    }).limit(4);

    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seasonal material suggestions
// @route   GET /api/products/seasonal/suggestions
// @access  Public
export const getSeasonalSuggestions = async (req, res, next) => {
  try {
    const currentMonth = new Date().getMonth(); // 0 is January, 11 is December
    let activeSeason = 'Winter';
    let targetCategories = [];
    let tagline = '';

    // Monsoon (June to September)
    if (currentMonth >= 5 && currentMonth <= 8) {
      activeSeason = 'Monsoon / Rainy Season';
      targetCategories = ['Waterproofing', 'Cement'];
      tagline = 'Rain-proof your build! Check out structural sealants, elastomeric coating, and high performance Ambuja Kawach waterproof cement.';
    }
    // Summer (April to June)
    else if (currentMonth >= 3 && currentMonth <= 5) {
      activeSeason = 'Summer Season';
      targetCategories = ['Cooling Materials', 'Sand', 'Bricks'];
      tagline = 'Beat the heat! Explore insulation panels, light-weight bricks for cooling, and cooling aggregates.';
    }
    // Autumn / Spring / Winter (General)
    else {
      activeSeason = 'Construction Peak Season';
      targetCategories = ['Cement', 'Steel', 'Bricks'];
      tagline = 'Peak building season is here! Secure bulk quantities of foundational steel rebars and UltraTech Cement.';
    }

    const products = await Product.find({ category: { $in: targetCategories } }).limit(4);

    res.status(200).json({
      success: true,
      season: activeSeason,
      tagline,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock alerts (for dealer dashboard)
// @route   GET /api/products/alerts/low-stock
// @access  Private (Dealer/Admin)
export const getLowStockAlerts = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().populate('inventory.product');
    const alerts = [];

    for (const wh of warehouses) {
      for (const item of wh.inventory) {
        const prod = item.product;
        if (!prod) continue;
        if (item.quantity <= prod.lowStockThreshold) {
          alerts.push({
            warehouseId: wh._id,
            warehouseName: wh.name,
            productId: prod._id,
            productName: prod.name,
            brand: prod.brand,
            category: prod.category,
            currentStock: item.quantity,
            threshold: prod.lowStockThreshold,
            unit: prod.unit
          });
        }
      }
    }

    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    next(error);
  }
};
