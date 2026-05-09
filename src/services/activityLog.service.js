/**
 * Journalisation activité — non bloquant si erreur BDD.
 */
const { ActivityLog } = require('../models');

/**
 * @param {{ userId?: string | null; action: string; appName?: string | null; metadata?: object }} p
 */
async function enregistrer(p) {
  try {
    await ActivityLog.create({
      user_id: p.userId ?? null,
      action: p.action,
      app_name: p.appName ?? null,
      metadata: p.metadata ?? {},
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[activity_log]', err.message);
  }
}

function enregistrerAsync(p) {
  setImmediate(() => {
    enregistrer(p).catch(() => {});
  });
}

module.exports = { enregistrer, enregistrerAsync };
