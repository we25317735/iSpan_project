import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Article_like',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      target_type: {
        type: DataTypes.ENUM('article', 'comment', 'reply'),
        allowNull: false,
      },
      target_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'article_like',
      timestamps: false,
      paranoid: false,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  )
}
