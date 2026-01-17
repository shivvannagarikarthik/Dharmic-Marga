const { Conversation, User, ConversationParticipant } = require('../models');

exports.createGroup = async (req, res) => {
  try {
    const { name, participantIds } = req.body; // participantIds = array of userIds
    
    // Create new conversation
    const conversation = await Conversation.create({
      type: 'group',
      name: name || 'New Group'
    });

    // Add creator as admin
    await ConversationParticipant.create({
      ConversationId: conversation.id,
      UserId: req.user.id,
      role: 'admin'
    });

    // Add other participants
    if (participantIds && participantIds.length > 0) {
      const participants = participantIds.map(userId => ({
        ConversationId: conversation.id,
        UserId: userId,
        role: 'member'
      }));
      await ConversationParticipant.bulkCreate(participants);
    }

    res.json({ success: true, conversation });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
};

exports.addParticipants = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userIds } = req.body;

    // Check if requester is admin
    const adminCheck = await ConversationParticipant.findOne({
      where: { ConversationId: groupId, UserId: req.user.id, role: 'admin' }
    });
    if (!adminCheck) return res.status(403).json({ message: 'Only admins can add members' });

    const participants = userIds.map(userId => ({
      ConversationId: groupId,
      UserId: userId,
      role: 'member'
    }));

    await ConversationParticipant.bulkCreate(participants, { ignoreDuplicates: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add members' });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    // Check if requester is admin
    const adminCheck = await ConversationParticipant.findOne({
      where: { ConversationId: groupId, UserId: req.user.id, role: 'admin' }
    });
    if (!adminCheck) return res.status(403).json({ message: 'Only admins can remove members' });

    await ConversationParticipant.destroy({
      where: { ConversationId: groupId, UserId: userId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove member' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    await ConversationParticipant.destroy({
      where: { ConversationId: groupId, UserId: req.user.id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave group' });
  }
};

exports.getGroupInfo = async (req, res) => {
    try {
        const { groupId } = req.params;
        const conversation = await Conversation.findByPk(groupId, {
            include: [{
                model: User,
                attributes: ['id', 'username', 'avatarUrl'],
                through: { attributes: ['role'] }
            }]
        });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get group info' });
    }
}
