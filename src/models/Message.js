const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profile = require('./Profile');
const Channel = require('./Channel');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Profile,
            key: 'id'
        },
        field: "user_id"
    },
    channelId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Channel,
            key: 'id'
        },
        field: "channel_id"
    }
}, {
    tableName: 'messages',
    timestamps: false
});

module.exports = Message;
