const express = require('express');
const router = express.Router();
const user = require('../model/user')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.post('/users', async (req, res) => {
    const {name, username, email, password, dateOfBirth, country, phoneNumber} = req.body;
    // Check if user already exists
    const existingUser = await user.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user and save it to the database
    const newUser = new user({
        name,
        username,
        email,
        password: hashedPassword,
        dateOfBirth,
        country,
        phoneNumber,
        role: 'user'  // Default role for new users is 'user'
    });
    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    }   catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const User = await user.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, User.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: User._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in' });
    }
  });

  router.get('/user', verifyToken, async (req, res) => {
    try {
        const User = await user.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ User });
        
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// router.get('/dashboard', authMiddleware, (req, res) => {
//     res.status(200).json({ message: 'Welcome to the dashboard!' });
// });

function verifyToken(req, res, next){
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token not provided' });
    }
    jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.userId = decoded.userId;
        next();
    }); 
};

//   function authMiddleware (req, res, next)  {
//     const token = req.header('Authorization');
//     if (!token) {
//       return res.status(401).json({ message: 'Access denied. No token provided.' });
//     }
//     try {
//       const decoded = jwt.verify(token, 'your_jwt_secret'); 
//     req.user = decoded;
//     next();
//     } catch (error) {
//     res.status(400).json({ message: 'Invalid token.' });
//     }
//   };


module.exports = router;