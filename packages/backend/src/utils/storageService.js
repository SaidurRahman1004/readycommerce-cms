const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// Detect if S3 (or R2) is properly configured in the environment
const isS3Configured = 
  process.env.S3_ACCESS_KEY_ID && 
  process.env.S3_SECRET_ACCESS_KEY && 
  process.env.S3_BUCKET_NAME;

let s3Client;
if (isS3Configured) {
  s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined, // Useful for Cloudflare R2 / MinIO
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }
  });
}

const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');

/**
 * Uploads a buffer to storage (S3 if configured, otherwise local disk)
 * @param {Buffer} buffer The file buffer (typically optimized by sharp)
 * @param {string} mimetype The MIME type of the file
 * @param {string} originalName The original filename
 * @returns {Promise<{ url: string, filename: string, size: number }>}
 */
const uploadFile = async (buffer, mimetype, originalName) => {
  // Generate a unique filename using timestamp and random hex
  const ext = originalName ? path.extname(originalName).toLowerCase() : '';
  const finalExt = mimetype === 'image/webp' ? '.webp' : ext;
  const uniqueFilename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${finalExt}`;

  if (isS3Configured) {
    const bucket = process.env.S3_BUCKET_NAME;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: uniqueFilename,
      Body: buffer,
      ContentType: mimetype,
      // ACL: 'public-read', // Deprecated in some S3 setups, but sometimes required
    });

    await s3Client.send(command);

    // Determine public URL
    // If using Cloudflare R2 or a custom CDN, S3_PUBLIC_URL should be provided (e.g., https://cdn.example.com)
    let publicUrl = '';
    if (process.env.S3_PUBLIC_URL) {
      publicUrl = `${process.env.S3_PUBLIC_URL.replace(/\/$/, '')}/${uniqueFilename}`;
    } else if (process.env.S3_ENDPOINT) {
      // e.g. https://bucket.endpoint.com/filename
      const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, '');
      publicUrl = `${endpoint}/${bucket}/${uniqueFilename}`;
    } else {
      // Standard AWS S3 URL
      publicUrl = `https://${bucket}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${uniqueFilename}`;
    }

    return {
      url: publicUrl,
      filename: uniqueFilename,
      size: buffer.length,
    };
  } else {
    // Local fallback
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const targetPath = path.resolve(UPLOAD_DIR, uniqueFilename);
    await fs.writeFile(targetPath, buffer);

    const origin = process.env.PUBLIC_API_ORIGIN || 'http://localhost:5000';
    return {
      url: `${origin}/uploads/${encodeURIComponent(uniqueFilename)}`,
      filename: uniqueFilename,
      size: buffer.length,
    };
  }
};

/**
 * Deletes a file from storage
 * @param {string} filename The stored filename
 */
const deleteFile = async (filename) => {
  if (isS3Configured) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filename,
      });
      await s3Client.send(command);
    } catch (err) {
      console.error(`[storageService] Failed to delete from S3: ${filename}`, err);
    }
  } else {
    try {
      const targetPath = path.resolve(UPLOAD_DIR, filename);
      if (targetPath.startsWith(`${UPLOAD_DIR}${path.sep}`)) {
        await fs.unlink(targetPath);
      }
    } catch (err) {
      // Ignore if file doesn't exist
    }
  }
};

module.exports = {
  uploadFile,
  deleteFile,
  isS3Configured,
};
