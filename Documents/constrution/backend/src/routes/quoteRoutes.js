import express from 'express';
import {
  submitQuoteRequest,
  getQuotes,
  getQuoteById,
  negotiateQuote,
  updateQuoteStatus,
  triggerCrmScan,
} from '../controllers/quoteController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', submitQuoteRequest);
router.get('/', getQuotes);
router.post('/crm/scan', authorize('Dealer', 'Admin'), triggerCrmScan);
router.get('/:id', getQuoteById);
router.put('/:id/negotiate', negotiateQuote);
router.put('/:id/status', updateQuoteStatus);

export default router;
