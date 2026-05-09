/**
 * Anti brute-force simple (mémoire processus). À remplacer par Redis en multi-instances.
 * Blocage après 5 échecs pour la clé email + IP.
 */
const MAX_ECHECS = 5;
const FENETRE_MS = 15 * 60 * 1000;

const compteurs = new Map();

function cle(email, ip) {
  return `${String(email).toLowerCase().trim()}:${ip || 'unknown'}`;
}

function enregistrerEchec(email, ip) {
  const k = cle(email, ip);
  const maintenant = Date.now();
  let entree = compteurs.get(k);
  if (!entree || maintenant - entree.depuis > FENETRE_MS) {
    entree = { nombre: 0, depuis: maintenant };
  }
  entree.nombre += 1;
  compteurs.set(k, entree);
  return entree.nombre >= MAX_ECHECS;
}

function reinitialiser(email, ip) {
  compteurs.delete(cle(email, ip));
}

function estBloque(email, ip) {
  const k = cle(email, ip);
  const entree = compteurs.get(k);
  if (!entree) return false;
  if (Date.now() - entree.depuis > FENETRE_MS) {
    compteurs.delete(k);
    return false;
  }
  return entree.nombre >= MAX_ECHECS;
}

module.exports = {
  enregistrerEchec,
  reinitialiser,
  estBloque,
  MAX_ECHECS,
};
