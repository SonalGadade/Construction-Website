import express from 'express';
import {
  getWarehouses,
  getNearestWarehouse,
  restockWarehouse,
} from '../controllers/warehouseController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', protect, authorize('Dealer', 'Admin'), getWarehouses);
router.post('/nearest', getNearestWarehouse);
router.post('/:id/restock', protect, authorize('Dealer', 'Admin'), restockWarehouse);

export default router;
