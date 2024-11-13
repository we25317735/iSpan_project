import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'User_coupon',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      coupon_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastedit_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'user_coupon',
      timestamps: false,
      underscored: true,
      createdAt: 'create_time',
      updatedAt: false,
    }
  )
}
