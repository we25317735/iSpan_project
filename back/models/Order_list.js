import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Order_list',
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ship_method: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      pay_type: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bill_type: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      create_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      coupon_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoice_donation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      cardnum: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      order_info: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'order_list',
      timestamps: false,
      underscored: true,
      createdAt: 'create_time',
      updatedAt: false,
    }
  )
}
