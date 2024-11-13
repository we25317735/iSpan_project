import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Coupon',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      create_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastedit_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'Coupon',
      timestamps: false,
      underscored: true,
      createdAt: 'create_time',
      updatedAt: false,
    }
  )
}
