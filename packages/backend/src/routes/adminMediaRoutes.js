const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const { list, upload, remove } = require('../controllers/adminMediaController');

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.memoryStorage(); // Store in memory for Sharp processing

const uploader = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // Increased to 10MB because Sharp will optimize it down
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.has(file.mimetype) && ['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG and WebP images are allowed.'));
    }
  }
});

const router = express.Router();
router.use(require('cookie-parser')(), authMiddleware, authorize('super-admin', 'manager', 'editor'));

router.get('/', list);
router.post('/upload', uploader.array('files', 10), upload);
router.delete('/:id', remove);

module.exports = router;
