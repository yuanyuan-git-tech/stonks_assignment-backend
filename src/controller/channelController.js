const WebSocket = require('ws');
const Channel = require('../models/Channel');
const Message = require('../models/Message');
const Role = require('../models/Role');
const UserChannelRole = require('../models/UserChannelRole');
const Profile = require('../models/Profile');
const auth = require('../middlewares/auth');
const nodemailer = require('nodemailer');

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const initializeWebSocket = (server) => {
    const wss = new WebSocket.Server({server});

    wss.on('connection', (ws, req) => {
        console.log('New client connected');


        ws.on('message', async (message) => {
            let parsedMessage;
            try {
                parsedMessage = JSON.parse(message);
            } catch (e) {
                ws.send(JSON.stringify({error: 'Invalid message format'}));
                return;
            }

            parsedMessage.ws = ws;

            switch (parsedMessage.type) {
                case 'joinChannel':
                    await handleJoinChannel(parsedMessage);
                    break;
                case 'leaveChannel':
                    await handleLeaveChannel(parsedMessage);
                    break;
                case 'sendMessage':
                    await handleSendMessage(parsedMessage);
                    break;
                case 'startStream':
                    await handleStartStream(parsedMessage);
                    break;
                default:
                    ws.send(JSON.stringify({error: 'Unknown message type'}));
            }
        });

        ws.on('close', (code, reason) => {
            console.log(`Client disconnected with code: ${code}, reason: ${reason}`);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    wss.on('error', (error) => {
        console.error('WebSocket Server error:', error);
    });
};

const handleJoinChannel = async ({ws, channelId, userId}) => {
    console.log(`joinChannel event received with channelId: ${channelId}, userId: ${userId}`);
    try {
        const channel = await Channel.findByPk(channelId);
        if (channel) {
            ws.channelId = channelId;
            ws.send(JSON.stringify({userId, content: `${userId} has joined the channel.`}));
        } else {
            ws.send(JSON.stringify({error: 'Channel not found'}));
        }
    } catch (error) {
        console.error('Error handling joinChannel:', error);
        ws.send(JSON.stringify({error: 'Internal server error'}));
    }
};

const handleLeaveChannel = ({ws, channelId, userId}) => {
    console.log(`leaveChannel event received with channelId: ${channelId}, userId: ${userId}`);
    ws.channelId = null;
    ws.send(JSON.stringify({userId, content: `${userId} has left the channel.`}));
};

const handleSendMessage = async ({ws, channelId, userId, content}) => {
    console.log(`sendMessage event received with channelId: ${channelId}, userId: ${userId}, content: ${content}`);
    try {
        const message = await Message.create({channelId, userId, content});
        ws.send(JSON.stringify({userId, content}));
    } catch (error) {
        console.error('Error handling sendMessage:', error);
        ws.send(JSON.stringify({error: 'Internal server error'}));
    }
};

const handleStartStream = async ({ws, channelId, userId}) => {
    console.log(`startStream event received with channelId: ${channelId}, userId: ${userId}`);
    try {
        const channel = await Channel.findByPk(channelId);
        if (!channel) {
            ws.send(JSON.stringify({error: 'Channel not found'}));
            return;
        }

        // Get followers
        const followers = await getFollowers(userId);

        for (const follower of followers) {
            const followerWs = findWebSocketByUserId(follower.id);
            if (followerWs) {
                // Send WebSocket notification if follower is online
                followerWs.send(JSON.stringify({
                    userId,
                    content: `User ${userId} has started a stream in channel ${channelId}`
                }));
            } else {
                // Send email notification if follower is offline
                await sendEmailNotification(follower.email, `User ${userId} has started a stream in channel ${channelId}`);
            }
        }
    } catch (error) {
        console.error('Error handling startStream:', error);
        ws.send(JSON.stringify({error: 'Internal server error'}));
    }
};

const getFollowers = async (userId) => {
    // Get followers of the user
    const followers = await Profile.findAll({
        include: [{
            model: Profile,
            as: 'Followers',
            where: {followedId: userId}
        }]
    });
    return followers;
};

const findWebSocketByUserId = (userId) => {
    // Find the WebSocket connection for a given user ID
    for (const client of wss.clients) {
        if (client.profile && client.profile.id === userId) {
            return client;
        }
    }
    return null;
};

const sendEmailNotification = async (email, content) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Stream Notification',
        text: content
    };

    await transporter.sendMail(mailOptions);
};

const handleCommand = async ({ws, channelId, userId, command, args, profile}) => {
    console.log(`command event received with channelId: ${channelId}, userId: ${userId}, command: ${command}, args: ${args}`);
    try {
        const channel = await Channel.findByPk(channelId);
        const userChannelRole = await UserChannelRole.findOne({where: {userId, channelId}});
        if (!channel || !userChannelRole) {
            ws.send(JSON.stringify({error: 'Channel or user role not found'}));
            return;
        }

        const role = await Role.findByPk(userChannelRole.roleId);
        if (!role) {
            ws.send(JSON.stringify({error: 'Role not found'}));
            return;
        }

        switch (command) {
            case '/set':
                if (role.name === 'HOST') {
                    await setRole(ws, channelId, args, 'ADMIN');
                } else {
                    ws.send(JSON.stringify({error: 'You do not have permission to set roles'}));
                }
                break;
            case '/unset':
                if (role.name === 'HOST') {
                    await unsetRole(ws, channelId, args);
                } else {
                    ws.send(JSON.stringify({error: 'You do not have permission to unset roles'}));
                }
                break;
            case '/mute':
            case '/unmute':
            case '/ban':
            case '/unban':
            case '/set title':
            case '/set description':
                if (role.name === 'ADMIN' || role.name === 'HOST') {
                    await updateChannel(ws, channelId, command, args);
                } else {
                    ws.send(JSON.stringify({error: 'You do not have permission to execute this command'}));
                }
                break;
            case '/suspend':
                if (profile.role === 'SUPERADMIN') {
                    await suspendChannel(ws, channelId);
                } else {
                    ws.send(JSON.stringify({error: 'Only SUPERADMIN can suspend the channel'}));
                }
                break;
            default:
                ws.send(JSON.stringify({error: 'Unknown command'}));
        }
    } catch (error) {
        console.error('Error handling command:', error);
        ws.send(JSON.stringify({error: 'Internal server error'}));
    }
};

const setRole = async (ws, channelId, args, targetRoleName) => {
    const targetUserId = args[0];
    const targetRole = await Role.findOne({where: {name: targetRoleName}});
    if (targetRole) {
        await UserChannelRole.create({userId: targetUserId, channelId, roleId: targetRole.id});
        ws.send(JSON.stringify({userId: 'system', content: `${targetUserId} is now an ${targetRoleName}`}));
    } else {
        ws.send(JSON.stringify({error: 'Role not found'}));
    }
};

const unsetRole = async (ws, channelId, args) => {
    const targetUserId = args[0];
    await UserChannelRole.destroy({where: {userId: targetUserId, channelId}});
    ws.send(JSON.stringify({userId: 'system', content: `${targetUserId} is no longer an admin`}));
};

const updateChannel = async (ws, channelId, command, args) => {
    let update;
    switch (command) {
        case '/mute':
            update = {muted: true};
            break;
        case '/unmute':
            update = {muted: false};
            break;
        case '/ban':
            update = {banned: true};
            break;
        case '/unban':
            update = {banned: false};
            break;
        case '/set title':
            update = {title: args.join(' ')};
            break;
        case '/set description':
            update = {description: args.join(' ')};
            break;
        default:
            ws.send(JSON.stringify({error: 'Unknown command'}));
            return;
    }
    await Channel.update(update, {where: {id: channelId}});
    ws.send(JSON.stringify({userId: 'system', content: 'Channel updated'}));
};

const suspendChannel = async (ws, channelId) => {
    await Channel.update({suspended: true}, {where: {id: channelId}});
    ws.send(JSON.stringify({userId: 'system', content: 'Channel suspended'}));
};

module.exports = initializeWebSocket;
