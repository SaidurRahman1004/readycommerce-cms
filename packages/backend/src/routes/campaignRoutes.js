const express = require('express');
const cookieParser = require('cookie-parser');
const { getPublicCampaign, getPreviewCampaign, trackCampaignAction } = require('../controllers/campaignController');
const { optionalAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(cookieParser());

// Public landing page view
router.get('/:slug', getPublicCampaign);

// Preview route (supports token in query or admin session cookie)
router.get('/:slug/preview', optionalAuth, getPreviewCampaign);

// Future-ready lightweight analytics tracker
router.post('/:slug/track', trackCampaignAction);

module.exports = router;
