const express = require('express');
const { authorize } = require('../middlewares/authMiddleware');
const {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  publishCampaign,
  unpublishCampaign,
  duplicateCampaign,
  archiveCampaign,
  deleteCampaign,
} = require('../controllers/adminCampaignController');

const router = express.Router();

const VIEW_ROLES = ['super-admin', 'manager', 'editor', 'support'];
const EDIT_ROLES = ['super-admin', 'manager', 'editor'];
const PUBLISH_ROLES = ['super-admin', 'manager'];
const DELETE_ROLES = ['super-admin'];

router.get('/', authorize(...VIEW_ROLES), listCampaigns);
router.post('/', authorize(...EDIT_ROLES), createCampaign);
router.get('/:id', authorize(...VIEW_ROLES), getCampaign);
router.put('/:id', authorize(...EDIT_ROLES), updateCampaign);

router.post('/:id/publish', authorize(...PUBLISH_ROLES), publishCampaign);
router.post('/:id/unpublish', authorize(...PUBLISH_ROLES), unpublishCampaign);
router.post('/:id/duplicate', authorize(...EDIT_ROLES), duplicateCampaign);
router.put('/:id/archive', authorize(...PUBLISH_ROLES), archiveCampaign);
router.delete('/:id', authorize(...DELETE_ROLES), deleteCampaign);

module.exports = router;
