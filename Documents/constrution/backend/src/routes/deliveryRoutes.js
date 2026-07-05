import express from 'express';
import { getDeliveries, getDeliveryByOrderId, updateDeliveryStatus } from '../controllers/deliveryController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getDeliveries);
router.get('/order/:orderId', getDeliveryByOrderId);
router.put('/:id', authorize('Dealer', 'Admin'), updateDeliveryStatus);

export default router;
