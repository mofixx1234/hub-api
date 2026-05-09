/**
 * Traitement métier des événements Wave (checkout terminé / échec).
 */
const { sequelize, Paiement, Abonnement, Utilisateur } = require('../models');
const { envoyerConfirmationPaiement } = require('./email');

function montantsEgaux(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

async function traiterCheckoutIndividuel(paiement, transactionId) {
  const cmd = paiement.donnees_commande || {};
  const duree = Number(cmd.duree_jours) || 30;

  const resultat = await sequelize.transaction(async (t) => {
    const verrou = await Paiement.findOne({
      where: { id: paiement.id, statut: 'pending' },
      transaction: t,
    });
    if (!verrou) {
      return { skip: true };
    }

    const debut = new Date();
    const fin = new Date(debut);
    fin.setUTCDate(fin.getUTCDate() + duree);

    const abonnement = await Abonnement.create(
      {
        utilisateur_id: paiement.utilisateur_id,
        rubrique: cmd.rubrique,
        type_abonnement: cmd.type_abonnement,
        sport: cmd.sport || null,
        ecole_id: cmd.ecole_id || null,
        programme: cmd.programme,
        apps_incluses: cmd.apps_incluses || [],
        date_debut: debut,
        date_fin: fin,
        montant_paye: paiement.montant,
        statut: 'actif',
      },
      { transaction: t }
    );

    await paiement.update(
      {
        statut: 'success',
        transaction_wave_id: transactionId,
        abonnement_id: abonnement.id,
        date_paiement: new Date(),
      },
      { transaction: t }
    );

    return { abonnement, utilisateur: paiement.utilisateur };
  });

  if (resultat.skip) {
    return { idempotent: true };
  }

  const util = resultat.utilisateur || (await Utilisateur.findByPk(paiement.utilisateur_id));
  if (util) {
    await envoyerConfirmationPaiement({
      destinataire: util.email,
      prenom: util.prenom,
      montant: paiement.montant,
      transactionId,
    });
  }

  return { ok: true, abonnement_id: resultat.abonnement?.id };
}

async function traiterCheckoutCollectif(paiement, data, transactionId, montantWave) {
  const cmd = paiement.donnees_commande || {};
  const beneficiaires = Array.isArray(cmd.beneficiaires) ? cmd.beneficiaires : [];
  if (beneficiaires.length === 0) {
    return { erreur: true, message: 'Commande collectif sans bénéficiaires.' };
  }

  const attenduTotal = beneficiaires.reduce(
    (s, b) => s + Math.round(Number(b.montant_fcfa || 0)),
    0
  );
  if (!montantsEgaux(attenduTotal, paiement.montant)) {
    return { erreur: true, message: 'Somme des lignes et montant paiement divergent.' };
  }
  if (!montantsEgaux(montantWave, paiement.montant)) {
    return { erreur: true, message: 'Montant Wave et commande divergent.' };
  }

  const duree = Number(cmd.duree_jours) || 30;

  const idsCrees = await sequelize.transaction(async (t) => {
    const verrou = await Paiement.findOne({
      where: { id: paiement.id, statut: 'pending' },
      transaction: t,
    });
    if (!verrou) {
      return null;
    }

    const debut = new Date();
    const fin = new Date(debut);
    fin.setUTCDate(fin.getUTCDate() + duree);

    const uuids = [];

    for (const b of beneficiaires) {
      const ab = await Abonnement.create(
        {
          utilisateur_id: b.utilisateur_id,
          rubrique: b.rubrique,
          type_abonnement: b.type_abonnement,
          sport: b.sport || null,
          ecole_id: cmd.ecole_id || b.ecole_id || null,
          programme: b.programme,
          apps_incluses: b.apps_incluses || [],
          date_debut: debut,
          date_fin: fin,
          montant_paye: Math.round(Number(b.montant_fcfa)),
          statut: 'actif',
        },
        { transaction: t }
      );
      uuids.push(ab.id);
    }

    const fusionCommande = {
      ...cmd,
      abonnements_crees_ids: uuids,
    };

    await paiement.update(
      {
        statut: 'success',
        transaction_wave_id: transactionId,
        date_paiement: new Date(),
        donnees_commande: fusionCommande,
      },
      { transaction: t }
    );

    return uuids;
  });

  if (idsCrees === null) {
    return { idempotent: true };
  }

  const payeur = await Utilisateur.findByPk(paiement.utilisateur_id);
  if (payeur) {
    await envoyerConfirmationPaiement({
      destinataire: payeur.email,
      prenom: payeur.prenom,
      montant: paiement.montant,
      transactionId,
    });
  }

  return { ok: true, abonnements_ids: idsCrees };
}

/**
 * Idempotence : même transaction_wave_id déjà enregistrée en succès.
 */
async function traiterCheckoutComplete(data) {
  const transactionId = data.transaction_id ? String(data.transaction_id).trim() : null;
  const clientRef =
    data.client_reference != null ? String(data.client_reference).trim() : null;
  const montantWave = data.amount;

  if (!transactionId || !clientRef) {
    return { ignore: true, raison: 'transaction_id ou client_reference absent' };
  }

  const existant = await Paiement.findOne({
    where: { transaction_wave_id: transactionId, statut: 'success' },
  });
  if (existant) {
    return { idempotent: true };
  }

  const paiement = await Paiement.findOne({
    where: { id: clientRef, deleted_at: null },
    include: [{ model: Utilisateur, as: 'utilisateur', required: false }],
  });

  if (!paiement) {
    return { ignore: true, raison: 'paiement introuvable' };
  }

  if (paiement.statut !== 'pending') {
    return { idempotent: true };
  }

  const okPaiement =
    data.payment_status === 'succeeded' ||
    data.checkout_status === 'complete';
  if (!okPaiement) {
    return { ignore: true, raison: 'statut checkout non réussi' };
  }

  const cmd = paiement.donnees_commande || {};

  if (cmd.mode === 'collectif_ecole') {
    return traiterCheckoutCollectif(paiement, data, transactionId, montantWave);
  }

  if (!montantsEgaux(montantWave, paiement.montant)) {
    return { erreur: true, message: 'Montant Wave et commande divergent.' };
  }

  return traiterCheckoutIndividuel(paiement, transactionId);
}

async function traiterCheckoutEchec(data) {
  const clientRef =
    data.client_reference != null ? String(data.client_reference).trim() : null;
  if (!clientRef) return { ignore: true };

  const paiement = await Paiement.findOne({
    where: { id: clientRef, statut: 'pending', deleted_at: null },
  });
  if (!paiement) return { ignore: true };

  await paiement.update({ statut: 'failed' });
  return { ok: true };
}

module.exports = { traiterCheckoutComplete, traiterCheckoutEchec };
