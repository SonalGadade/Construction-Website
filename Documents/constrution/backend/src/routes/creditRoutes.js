import express from 'express';
import { getMyLedger, payCreditOutstanding, updateCreditLimit } from '../controllers/creditController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyLedger);
router.post('/pay', payCreditOutstanding);
router.put('/limit', authorize('Dealer', 'Admin'), updateCreditLimit);

export default router;
