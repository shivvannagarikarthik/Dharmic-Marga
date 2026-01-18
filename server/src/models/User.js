const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastSeen: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // NEW: Privacy & App Settings (JSON for flexibility)
  privacySettings: {
    type: DataTypes.JSON,
    defaultValue: {
      lastSeen: 'everyone', // everyone, contacts, none
      readReceipts: true,
      profilePhoto: 'everyone',
      twoFactorEnabled: false
    }
  },
  appSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      theme: 'cosmic', 
      wallpaper: 'default',
      fontSize: 'medium',
      language: 'en',
      notificationsKey: true
    }
  }
});

module.exports = User;
