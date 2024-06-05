const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');
const Profile = require('../models/Profile');

const router = express.Router();

// Fetch profile
router.get('', auth, async (req, res) => {
    res.send(req.profile);
});

// Update profile
router.patch('', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['fullName', 'username', 'email', 'password', 'avatar', 'active'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        updates.forEach(update => req.profile[update] = req.body[update]);
        if (req.body.password) {
            req.profile.password = await bcrypt.hash(req.body.password, 8);
        }
        await req.profile.save();
        res.send(req.profile);
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
