const User = require('./User');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Call = require('./Call');
const ConversationParticipant = require('./ConversationParticipant');

// Relations

// Many-to-Many: Users <-> Conversations (with Role)
User.belongsToMany(Conversation, { through: ConversationParticipant });
Conversation.belongsToMany(User, { through: ConversationParticipant });

// One-to-Many: User -> Messages
User.hasMany(Message, { foreignKey: 'senderId' });
Message.belongsTo(User, { foreignKey: 'senderId' });

// One-to-Many: Conversation -> Messages
Conversation.hasMany(Message, { foreignKey: 'conversationId' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId' });

// Self-referential: Message -> Reply
Message.belongsTo(Message, { as: 'ReplyTo', foreignKey: 'replyToId' });

// One-to-Many: User -> Calls
User.hasMany(Call, { foreignKey: 'callerId', as: 'CallsMade' });
Call.belongsTo(User, { foreignKey: 'callerId', as: 'Caller' });
User.hasMany(Call, { foreignKey: 'receiverId', as: 'CallsReceived' });
Call.belongsTo(User, { foreignKey: 'receiverId', as: 'Receiver' });

module.exports = {
  User,
  Conversation,
  Message,
  Call,
  ConversationParticipant
};
