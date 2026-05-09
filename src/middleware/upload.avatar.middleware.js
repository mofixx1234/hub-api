const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { avatarsDir: uploadDir } = require('../config/upload.paths');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[upload.avatar] Création du répertoire impossible :', uploadDir, err.message);
  throw err;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safe = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${req.utilisateur.id}-${Date.now()}${safe}`);
  },
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Format accepté : JPEG, PNG, WebP.'), ok);
  },
});

module.exports = { avatarUpload };
