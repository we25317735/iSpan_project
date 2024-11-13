import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Article',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tag1: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      tag2: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      valid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'article',
      timestamps: true,
      paranoid: false,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  )
}
