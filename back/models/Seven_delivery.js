import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Seven_delivery',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      store_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      store_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'seven_delivery',
      timestamps: false,
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  )
}
