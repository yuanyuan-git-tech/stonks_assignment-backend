const jwt = require('jsonwebtoken');
const Profile = require('../models/Profile');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        if (!token) {
            throw new Error('Token missing');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            throw new Error('Invalid token');
        }
        const profile = await Profile.findOne({ where: { id: decoded.id } });
        if (!profile) {
            throw new Error('Profile not found');
        }
        req.profile = profile;
        next();
    } catch (error) {
        console.error('Error in auth middleware:', error.message);
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

module.exports = auth;