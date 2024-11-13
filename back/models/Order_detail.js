import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Order_detail',
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
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      product_quantity: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      course_quantity: {  
        type: DataTypes.STRING,
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'order_detail',
      timestamps: false,
      underscored: true,
      createdAt: 'create_time',
      updatedAt: false,
    }
  )
}
