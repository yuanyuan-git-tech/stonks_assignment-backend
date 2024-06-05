const express = require('express');
const auth = require('../middlewares/auth');  // Ensure correct import
const Follow = require('../models/Follow');
const Profile = require('../models/Profile');

const router = express.Router();

// Follow a user
router.post('/:id', auth, async (req, res) => {
    try {
        const followerId = req.profile.id;
        const followedId = req.params.id;

        // Check if already following
        const existingFollow = await Follow.findOne({ where: { followerId, followedId } });
        if (existingFollow) {
            return res.status(400).send({ error: 'You are already following this user.' });
        }
        console.log(req.profile.id);
        const follow = await Follow.create({ followerId, followedId });
        res.status(201).send(follow);
    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).send({ error: 'Something went wrong.' });
    }
});

// Unfollow a user
router.delete('/:id', auth, async (req, res) => {
    try {
        const followerId = req.profile.id;
        const followedId = req.params.id;

        const follow = await Follow.findOne({ where: { followerId, followedId } });
        if (!follow) {
            return res.status(400).send({ error: 'You are not following this user.' });
        }

        await follow.destroy();
        res.status(200).send({ message: 'Successfully unfollowed the user.' });
    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).send({ error: 'Something went wrong.' });
    }
});

module.exports = router;
