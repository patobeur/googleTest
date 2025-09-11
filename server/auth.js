const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUserByEmail, createUser, updateUser, getUserByResetToken } = require('./db');
const crypto = require('crypto');

const router = express.Router();
const saltRounds = 10;
const jwtSecret = 'supersecretkey'; // In a real app, use an environment variable

// Route d'inscription
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password and name are required' });
    }

    const existingUser = getUserByEmail(email);
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = {
        id: Date.now().toString(),
        email,
        name,
        password: hashedPassword
    };

    createUser(newUser);

    res.status(201).json({ message: 'User created successfully' });
});

// Route de connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = getUserByEmail(email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });
    res.json({ token });
});

// Route de mot de passe oublié
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    const user = getUserByEmail(email);
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    updateUser(user);

    // Simuler l'envoi d'un email
    console.log('---- PASSWORD RESET EMAIL ----');
    console.log(`To: ${user.email}`);
    console.log('Please use the following token to reset your password:');
    console.log(token);
    console.log('-----------------------------');

    res.json({ message: 'Password reset token sent to your email' });
});

// Route de réinitialisation du mot de passe
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    const user = getUserByResetToken(token);

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    updateUser(user);

    res.json({ message: 'Password has been reset' });
});

module.exports = router;
