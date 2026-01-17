const { Message, User } = require('../models');

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByPk(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await message.update({ 
      isDeleted: true,
      content: 'This message was deleted',
      mediaUrl: null 
    });

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message' });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const message = await Message.findByPk(id);

    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.senderId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    if (message.isDeleted) return res.status(400).json({ message: 'Cannot edit deleted message' });

    await message.update({ 
      content,
      editedAt: new Date()
    });

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: 'Error editing message' });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const message = await Message.findByPk(id);

    if (!message) return res.status(404).json({ message: 'Message not found' });

    const reactions = { ...message.reactions };
    
    // Toggle reaction
    if (reactions[req.user.id] === emoji) {
      delete reactions[req.user.id];
    } else {
      reactions[req.user.id] = emoji;
    }

    await message.update({ reactions });

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: 'Error reacting to message' });
  }
};
