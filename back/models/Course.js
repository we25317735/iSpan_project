import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Course',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      number: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      tag1: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      tag2: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      img_main: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      img_1: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      img_2: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      img_3: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      sold: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      valid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'course',
      timestamps: false,
      paranoid: false,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  )
}
