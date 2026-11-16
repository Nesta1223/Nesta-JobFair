const router = require('express').Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const c = require('../controllers/bookings');
router.use(protect);
router.get('/export', c.exportBookings);
router.get('/', c.getBookings);
router.post('/', (req, res, next) => {
  if (!req.params.companyId) return res.status(400).json({ success: false, message: 'Create via /companies/:companyId/bookings' });
  return next();
}, c.addBooking);
router.route('/:id').get(c.getBooking).put(c.updateBooking).delete(c.deleteBooking);
module.exports = router;
