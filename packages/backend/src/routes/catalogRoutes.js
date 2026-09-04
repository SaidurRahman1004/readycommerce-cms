const express = require('express');
const { listProducts, getProduct } = require('../controllers/productController');
const { listCategories } = require('../controllers/categoryController');

const router = express.Router();
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.get('/categories', listCategories);
module.exports = router;
