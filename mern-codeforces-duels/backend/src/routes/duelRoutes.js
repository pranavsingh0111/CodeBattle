const express = require('express');
const router = express.Router();
const duelController = require('../controllers/duelController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/challenge', authMiddleware, duelController.createDuel);

router.get('/pending', authMiddleware, duelController.getPendingDuels);

router.post('/:duelId/accept', authMiddleware, duelController.acceptDuel);

router.post('/:duelId/reject', authMiddleware, duelController.rejectDuel);

router.get('/:duelId/battle', authMiddleware, duelController.getActiveDuel);

router.post('/:duelId/offer-draw', authMiddleware, duelController.offerDraw);
router.post('/:duelId/respond-draw', authMiddleware, duelController.respondToDrawOffer);
router.post('/:duelId/withdraw-draw', authMiddleware, duelController.withdrawDrawOffer);

router.get('/:duelId/check-status', authMiddleware, duelController.checkSubmissionStatus);

router.get('/', authMiddleware, duelController.getUserDuels);

module.exports = router;