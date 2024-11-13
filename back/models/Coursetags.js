import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Coursetags',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tagname: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: 'coursetags',
      timestamps: false,
      paranoid: false,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  )
}
