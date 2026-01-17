const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('private', 'group'),
    defaultValue: 'private'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  groupIcon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // New Field: Timer in milliseconds (0 = off, 86400000 = 24h)
  messageTimer: {
    type: DataTypes.INTEGER,
    defaultValue: 0 
  }
});

module.exports = Conversation;
