const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const auth = require('../middlewares/auth');
const Profile = require('../models/Profile');

const router = express.Router();

// Sign up
router.post('/signup', [
    body('fullName').notEmpty(),
    body('username').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation Errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, username, email, password, avatar } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 8);
        const profile = await Profile.create({ fullName, username, email, password: hashedPassword, avatar });
        const token = jwt.sign({ id: profile.id }, process.env.JWT_SECRET);
        res.status(201).send({ profile, token });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(400).send(error);
    }
});

// Local Login
router.post('/login', [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required')
], (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ message: info.message });
        req.logIn(user, (err) => {
            if (err) return next(err);

            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
            res.json({ user, token });
        });
    })(req, res, next);
});


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET);
    res.send({ profile: req.user, token });
});


module.exports = router;
