const express = require('express');
const { createRestockLead } = require('../controllers/leadController');

const router = express.Router();

router.post('/restock', createRestockLead);

module.exports = router;
