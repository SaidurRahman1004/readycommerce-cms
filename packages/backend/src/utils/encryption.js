const crypto = require('crypto');

// The encryption key should be 32 bytes (256 bits) for AES-256-GCM.
// We expect a hex string of length 64 in the environment variable.
const ENCRYPTION_KEY = process.env.PAYMENT_ENCRYPTION_KEY 
  ? Buffer.from(process.env.PAYMENT_ENCRYPTION_KEY, 'hex') 
  : null;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a text string using AES-256-GCM.
 * @param {string} text - The plaintext string to encrypt.
 * @returns {string} - The encrypted string in the format "iv:authTag:encryptedData".
 */
function encrypt(text) {
  if (!ENCRYPTION_KEY) {
    throw new Error('PAYMENT_ENCRYPTION_KEY is not set in environment variables');
  }
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted text string using AES-256-GCM.
 * @param {string} encryptedText - The encrypted string in the format "iv:authTag:encryptedData".
 * @returns {string} - The decrypted plaintext string.
 */
function decrypt(encryptedText) {
  if (!ENCRYPTION_KEY) {
    throw new Error('PAYMENT_ENCRYPTION_KEY is not set in environment variables');
  }
  if (!encryptedText) return encryptedText;

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedData = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
