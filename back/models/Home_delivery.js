import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Home_delivery',
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
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'home_delivery',
      timestamps: false,
      underscored: true,
      createdAt: false,
      updatedAt: false,
    }
  )
}
