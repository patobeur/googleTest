const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./user'); // Import the new User model

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;

// Route d'inscription
router.post('/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password and name are required' });
    }

    User.getUserByEmail(email, (err, existingUser) => {
        if (err) { return res.status(500).json({ message: 'Server error' }); }
        if (existingUser) { return res.status(400).json({ message: 'User already exists' }); }

        // User.createUser(email, password, (err, newUser) => {
        //     if (err) { return res.status(500).json({ message: 'Failed to create user' }); }
        //     res.status(201).json({ message: 'User created successfully', userId: newUser.id });
        // });
        User.createUser(email, password, name, (err, newUser) => {
            if (err) { return res.status(500).json({ message: 'Failed to create user' }); }
            res.status(201).json({ message: 'User created successfully', userId: newUser.id });
        });
    });
});

// Route de connexion
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    User.getUserByEmail(email, async (err, user) => {
        if (err) { return res.status(500).json({ message: 'Server error' }); }
        if (!user) { return res.status(400).json({ message: 'Invalid credentials' }); }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) { return res.status(400).json({ message: 'Invalid credentials' }); }

        const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });
        res.json({ token });
    });
});

// Route de mot de passe oublié
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    User.getUserByEmail(email, (err, user) => {
        if (err) { return res.status(500).json({ message: 'Server error' }); }
        if (!user) { return res.status(400).json({ message: 'User not found' }); }

        const token = crypto.randomBytes(20).toString('hex');
        const tokenExpires = Date.now() + 3600000; // 1 hour

        User.updateUserResetToken(user.id, token, tokenExpires, (err) => {
            if (err) { return res.status(500).json({ message: 'Failed to set reset token' }); }
            console.log(`Password reset token for ${email}: ${token}`);
            res.json({ message: 'Password reset token sent (check server console)' });
        });
    });
});

// Route de réinitialisation du mot de passe
router.post('/reset-password', (req, res) => {
    const { token, password } = req.body;
    User.findUserByResetToken(token, (err, user) => {
        if (err) { return res.status(500).json({ message: 'Server error' }); }
        if (!user) { return res.status(400).json({ message: 'Password reset token is invalid or has expired' }); }

        User.updateUserPassword(user.id, password, (err) => {
            if (err) { return res.status(500).json({ message: 'Failed to reset password' }); }
            res.json({ message: 'Password has been reset successfully' });
        });
    });
});

module.exports = router;
