import { DataTypes } from 'sequelize'

export default async function (sequelize) {
  return sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      category_id: {
        type: DataTypes.INTEGER(3),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(75),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      discount: {
        type: DataTypes.DOUBLE, // 最多 3 位数字，2 位小数
        allowNull: false,
        defaultValue: 1, // 默认折扣为 1
      },
      img: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      stock: {
        type: DataTypes.INTEGER(6),
        allowNull: true,
      },
      valid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // 默認為 1（true）
      },
      status: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: true,
      },
      ontime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      offtime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      special: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
      },
      weight: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      area: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      life: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      trade: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      tableName: 'product', //直接提供資料表名稱
      timestamps: true, // 使用時間戳
      paranoid: false, // 軟性刪除
      underscored: true, // 所有自動建立欄位，使用snake_case命名
      createdAt: 'created_at', // 建立的時間戳
      updatedAt: 'updated_at', // 更新的時間戳
    }
  )
}
