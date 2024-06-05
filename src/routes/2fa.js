const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const auth = require('../middlewares/auth');
const { TwoFactorAuth } = require('../models/TwoFactorAuth');

const router = express.Router();

// Generate 2FA secret
router.post('/generate', auth, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ length: 20 });
        const url = speakeasy.otpauthURL({
            secret: secret.base32,
            label: req.profile.email,
            issuer: 'StonksApp'
        });

        qrcode.toDataURL(url, async (err, dataUrl) => {
            if (err) {
                return res.status(500).send({ error: 'Failed to generate QR code' });
            }

            await TwoFactorAuth.upsert({
                profileId: req.profile.id,
                secret: secret.base32,
                enabled: false
            });

            res.send({ secret: secret.base32, qrCodeUrl: dataUrl });
        });
    } catch (error) {
        res.status(500).send({ error: 'Failed to generate 2FA secret' });
    }
});

// Verify 2FA code
router.post('/verify', auth, async (req, res) => {
    const { token } = req.body;
    const twoFARecord = await TwoFactorAuth.findOne({ where: { profileId: req.profile.id } });

    if (!twoFARecord) {
        return res.status(400).send({ error: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
        secret: twoFARecord.secret,
        encoding: 'base32',
        token
    });

    if (verified) {
        twoFARecord.enabled = true;
        await twoFARecord.save();
        res.send({ message: '2FA enabled successfully' });
    } else {
        res.status(400).send({ error: 'Invalid 2FA code' });
    }
});

// Validate 2FA during login
router.post('/validate', auth, async (req, res) => {
    const { token } = req.body;
    const twoFARecord = await TwoFactorAuth.findOne({ where: { profileId: req.profile.id } });

    if (!twoFARecord) {
        return res.status(400).send({ error: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
        secret: twoFARecord.secret,
        encoding: 'base32',
        token
    });

    if (verified) {
        res.send({ message: '2FA validated successfully' });
    } else {
        res.status(400).send({ error: 'Invalid 2FA code' });
    }
});

module.exports = router;
