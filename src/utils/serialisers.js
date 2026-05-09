/**
 * Représentations JSON stables pour le catalogue et le Hub.
 */

function serialiserApplication(app) {
  return {
    id: app.id,
    nom: app.nom,
    description: app.description,
    rubrique: app.rubrique,
    categorie: app.categorie,
    prix_individuel: Number(app.prix_individuel),
    url_app: app.url_app,
    icone: app.icone,
    specifique_ecole: app.specifique_ecole,
  };
}

module.exports = { serialiserApplication };
