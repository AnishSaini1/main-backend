// middlewares/decryptBody.js
import { decryptAESKey, decryptDataAES } from '../utils/decrypt.js';
export function decryptBody(req, res, next) {
  if (req.body.encryptedKey && req.body.encryptedData) {
    try {
      const aesKey = decryptAESKey(req.body.encryptedKey);
      const data = decryptDataAES(req.body.encryptedData, aesKey);
      req.body = data; // replace with decrypted data!
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid encrypted payload' });
    }
  }
  next();
}
