/**
 * Répertoires d’upload — sur Vercel seul /tmp est writable (sinon crash au chargement des routes).
 */
const path = require('path');

const uploadsRoot = process.env.VERCEL
  ? path.join('/tmp', 'hub-api', 'uploads')
  : path.join(__dirname, '../../uploads');

const avatarsDir = path.join(uploadsRoot, 'avatars');

module.exports = { uploadsRoot, avatarsDir };
