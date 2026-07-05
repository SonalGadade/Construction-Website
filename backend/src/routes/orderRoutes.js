import express from 'express';
import { getOrders, getOrderById, reOrder } from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/:id/reorder', reOrder);

export default router;
