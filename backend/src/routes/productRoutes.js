import express from 'express';
import {
  getProducts,
  getProductById,
  getRecommendations,
  getSeasonalSuggestions,
  getLowStockAlerts,
} from '../controllers/productController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/seasonal/suggestions', getSeasonalSuggestions);
router.get('/alerts/low-stock', protect, authorize('Dealer', 'Admin'), getLowStockAlerts);
router.get('/:id', getProductById);
router.get('/:id/recommendations', getRecommendations);

export default router;
