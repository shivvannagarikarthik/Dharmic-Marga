const { User } = require('../models');
const jwt = require('jsonwebtoken');
// const redisClient = require('../config/redis'); 

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: 'Phone number required' });

    // FIXED OTP for easier testing - REDIS BYPASSED
    const otp = '123456';

    console.log(`>>> OTP SET for ${phoneNumber}: ${otp} (Redis Bypassed) <<<`);

    res.json({ message: 'OTP sent', otp });
  } catch (error) {
    console.error('Send OTP error', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    console.log(`Verifying OTP for ${phoneNumber}. Received: '${otp}'`);
    
    if (otp !== '123456') {
      return res.status(400).json({ message: `Invalid OTP. Received: ${otp}` });
    }

    // Check if user exists, else create
    let user = await User.findOne({ where: { phoneNumber } });
    
    if (!user) {
      user = await User.create({
        phoneNumber,
        username: `User${phoneNumber.slice(-4)}`
      });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        bio: user.bio
      }
    });

  } catch (error) {
    console.error('Verify OTP error', error);
    res.status(500).json({ message: 'Verification failed' });
  }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        res.json(user);
    } catch(err) {
        res.status(500).json({message: 'Server Error'});
    }
};
