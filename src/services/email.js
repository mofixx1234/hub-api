/**
 * Envoi d'emails (Nodemailer). Si SMTP non configuré, journalisation console (Module 0).
 */
const nodemailer = require('nodemailer');

function creerTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Notifie l'utilisateur qu'une nouvelle session a remplacé l'ancienne.
 */
async function envoyerEmailNouvelleConnexion({ destinataire, prenom, deviceName, ip }) {
  const sujet = '[Hub] Nouvelle connexion à votre compte';
  const texte = `Bonjour ${prenom},

Une connexion vient d'être enregistrée sur votre compte Hub.
${deviceName ? `Appareil : ${deviceName}` : ''}
${ip ? `Adresse IP : ${ip}` : ''}

Si ce n'était pas vous, changez immédiatement votre mot de passe.

— L'équipe Hub`;

  const transport = creerTransport();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.info('[email stub] Nouvelle connexion →', destinataire, { deviceName, ip });
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to: destinataire,
    subject: sujet,
    text: texte,
  });
}

/**
 * Confirmation après paiement Wave réussi (webhook).
 */
async function envoyerConfirmationPaiement({ destinataire, prenom, montant, transactionId }) {
  const sujet = '[Hub] Paiement reçu — Merci';
  const texte = `Bonjour ${prenom},

Votre paiement de ${montant} XOF a bien été enregistré (réf. Wave : ${transactionId}).
Vos abonnements sont à jour dans votre tableau de bord Hub.

— L'équipe Hub`;

  const transport = creerTransport();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.info('[email stub] Confirmation paiement →', destinataire, { montant, transactionId });
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to: destinataire,
    subject: sujet,
    text: texte,
  });
}

/**
 * Lien de réinitialisation MDP (15 minutes).
 */
async function envoyerEmailReinitialisationMotDePasse({ destinataire, prenom, jetonClair }) {
  const base =
    process.env.FRONTEND_URL?.split(',')[0]?.trim()?.replace(/\/$/, '') ||
    process.env.APP_URL ||
    'http://localhost:5173';
  const lien = `${base}/reinitialiser-mot-de-passe?token=${encodeURIComponent(jetonClair)}`;

  const sujet = '[Hub] Réinitialisation de votre mot de passe';
  const texte = `Bonjour ${prenom},

Pour choisir un nouveau mot de passe, ouvrez ce lien (valide 15 minutes) :
${lien}

Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.

— L'équipe Hub`;

  const transport = creerTransport();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.info('[email stub] Reset MDP →', destinataire, lien);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to: destinataire,
    subject: sujet,
    text: texte,
  });
}

/**
 * Alerte interne (analytics / santé) — destinataire admin central.
 */
/**
 * Compte marqué comme supprimé — rappel du délai de purge.
 */
async function envoyerEmailSuppressionCompte({ destinataire, prenom, delaiJours = 30 }) {
  const sujet = '[Hub] Suppression de votre compte';
  const texte = `Bonjour ${prenom},

Votre demande de suppression de compte a bien été enregistrée.
Vos données seront définitivement effacées sous ${delaiJours} jours.
Vous pouvez encore contacter le support avant cette échéance en cas d’erreur.

— L'équipe Hub`;

  const transport = creerTransport();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.info('[email stub] Suppression compte →', destinataire);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to: destinataire,
    subject: sujet,
    text: texte,
  });
}

async function envoyerAlerteAdmin({ destinataire, sujet, texte }) {
  const transport = creerTransport();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.info('[email stub] Alerte admin →', destinataire, sujet);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to: destinataire,
    subject: sujet,
    text: texte,
  });
}

module.exports = {
  envoyerEmailNouvelleConnexion,
  envoyerConfirmationPaiement,
  envoyerEmailReinitialisationMotDePasse,
  envoyerEmailSuppressionCompte,
  envoyerAlerteAdmin,
};
