const express = require('express');
const cookieParser = require('cookie-parser');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const { listZones, createZone, updateZone, deleteZone } = require('../controllers/adminDeliveryZoneController');

const router = express.Router();

router.use(cookieParser(), authMiddleware, authorize('super-admin', 'manager'));

router.get('/', listZones);
router.post('/', createZone);
router.put('/:id', updateZone);
router.delete('/:id', deleteZone);

module.exports = router;
