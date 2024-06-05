const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profile = require('./Profile');
const Channel = require('./Channel');
const Role = require('./Role');

const UserChannelRole = sequelize.define('UserChannelRole', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    },
    roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Role,
            key: 'id'
        },
        field: "role_id"
    }
}, {
    tableName: 'user_channel_roles',
    timestamps: false
});

module.exports = UserChannelRole;
