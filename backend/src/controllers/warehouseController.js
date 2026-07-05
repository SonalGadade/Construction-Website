import Warehouse from '../models/Warehouse.js';

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

// @desc    Get all warehouses with stock
// @route   GET /api/warehouses
// @access  Private (Dealer/Admin)
export const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().populate('inventory.product');
    res.status(200).json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    next(error);
  }
};

// @desc    Find nearest warehouse for coordinates and fetch proximity calculations
// @route   POST /api/warehouses/nearest
// @access  Public
export const getNearestWarehouse = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Please provide user latitude and longitude coordinates' });
    }

    const warehouses = await Warehouse.find().populate('inventory.product');
    
    if (warehouses.length === 0) {
      return res.status(404).json({ success: false, message: 'No warehouses configured' });
    }

    // Map each warehouse to its distance
    const warehousesWithDistance = warehouses.map(wh => {
      const distance = calculateDistance(
        latitude,
        longitude,
        wh.coordinates.latitude,
        wh.coordinates.longitude
      );
      
      return {
        _id: wh._id,
        name: wh.name,
        locationName: wh.locationName,
        coordinates: wh.coordinates,
        distanceKm: Number(distance.toFixed(2)),
        inventory: wh.inventory
      };
    });

    // Sort by distance ascending
    warehousesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    res.status(200).json({
      success: true,
      nearest: warehousesWithDistance[0],
      all: warehousesWithDistance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update warehouse stock manually (Restock)
// @route   POST /api/warehouses/:id/restock
// @access  Private (Dealer/Admin)
export const restockWarehouse = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide valid productId and restocking quantity' });
    }

    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Check if product is already in warehouse inventory
    const inventoryItem = warehouse.inventory.find(item => item.product.toString() === productId);
    
    if (inventoryItem) {
      inventoryItem.quantity += Number(quantity);
    } else {
      warehouse.inventory.push({
        product: productId,
        quantity: Number(quantity)
      });
    }

    await warehouse.save();
    
    res.status(200).json({
      success: true,
      message: 'Restocked successfully',
      data: warehouse
    });
  } catch (error) {
    next(error);
  }
};
