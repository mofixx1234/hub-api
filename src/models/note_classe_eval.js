/** Note sur une séance pour un élève. */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NoteClasseEval = sequelize.define(
    'NoteClasseEval',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      seance_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'seances', key: 'id' },
        onDelete: 'CASCADE',
      },
      eleve_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'eleves_classe', key: 'id' },
        onDelete: 'CASCADE',
      },
      note: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
      observation: { type: DataTypes.TEXT, allowNull: true },
      absent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: 'notes_classe',
      paranoid: false,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return NoteClasseEval;
};
