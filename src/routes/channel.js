const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');
const Channel = require('../models/Channel');
const UserChannelRole = require('../models/UserChannelRole');
const Role = require('../models/Role');

const router = express.Router();

router.post('/create', [
    auth,
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    const ownerId = req.profile.id;

    try {
        const channel = await Channel.create({ title, description, ownerId });
        const hostRole = await Role.findOne({ where: { name: 'HOST' } });
        await UserChannelRole.create({ userId: ownerId, channelId: channel.id, roleId: hostRole.id });

        res.status(201).json({ channel });
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

