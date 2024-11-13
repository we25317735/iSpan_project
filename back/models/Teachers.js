import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Teachers',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      img: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      exp1: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      exp2: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: 'teachers',
      timestamps: false,
      paranoid: false,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  )
}
