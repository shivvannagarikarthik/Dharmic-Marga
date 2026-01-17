const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Call = sequelize.define('Call', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  callerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('voice', 'video'),
    defaultValue: 'voice'
  },
  status: {
    type: DataTypes.ENUM('initiated', 'ringing', 'accepted', 'rejected', 'ended', 'missed'),
    defaultValue: 'initiated'
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    defaultValue: 0
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Call;
