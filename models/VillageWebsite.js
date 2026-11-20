import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const VillageWebsite = sequelize.define('VillageWebsite', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  owner_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  template_id: { type: DataTypes.STRING, allowNull: false, defaultValue: 'desa-informatif-v1' },
  spreadsheet_id: { type: DataTypes.STRING, allowNull: true },
  connection_code: { type: DataTypes.STRING, allowNull: false },
  revision: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  draft_content: { type: DataTypes.JSON, allowNull: true },
  published_content: { type: DataTypes.JSON, allowNull: true },
  synced_at: { type: DataTypes.DATE, allowNull: true },
  published_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'village_websites', underscored: true, timestamps: true });

export default VillageWebsite;
