const mongoose = require('mongoose');
const sharp = require('sharp');
const Media = require('../models/Media');
const { AppError } = require('../middlewares/errorHandler');
const storageService = require('../utils/storageService');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));
    const filter = {};
    
    const [data, total] = await Promise.all([
      Media.find(filter)
        .populate('uploadedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Media.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (e) {
    next(e);
  }
};

const upload = async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return next(new AppError('At least one image is required.', 400, 'NO_FILES'));
    }

    const uploadPromises = req.files.map(async (file) => {
      // 1. Optimize image with Sharp (max 2048x2048, convert to WebP)
      const sharpInstance = sharp(file.buffer);
      const metadata = await sharpInstance.metadata();
      
      // Strict magic byte validation via sharp
      if (!['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff', 'svg'].includes(metadata.format)) {
         throw new AppError('Invalid image format detected.', 400, 'INVALID_IMAGE');
      }

      const { data: optimizedBuffer, info } = await sharpInstance
        .rotate() // Preserve EXIF orientation
        .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true });

      // 2. Upload to Storage (S3 or Local)
      const storageResult = await storageService.uploadFile(
        optimizedBuffer,
        'image/webp',
        file.originalname
      );

      // 3. Prepare DB document
      return {
        filename: storageResult.filename,
        url: storageResult.url,
        size: storageResult.size,
        mimetype: 'image/webp',
        width: info.width,
        height: info.height,
        uploadedBy: req.user._id
      };
    });

    const mediaData = await Promise.all(uploadPromises);
    const docs = await Media.insertMany(mediaData);
    
    res.status(201).json({ success: true, data: docs });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return next(new AppError('Media not found.', 404, 'MEDIA_NOT_FOUND'));
    }
    
    const media = await Media.findById(req.params.id);
    if (!media) {
      return next(new AppError('Media not found.', 404, 'MEDIA_NOT_FOUND'));
    }

    // 1. Delete from Storage
    await storageService.deleteFile(media.filename);

    // 2. Delete from Database
    await media.deleteOne();
    
    res.json({ success: true, data: { id: media._id } });
  } catch (e) {
    next(e);
  }
};

module.exports = { list, upload, remove };
