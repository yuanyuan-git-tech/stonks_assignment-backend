const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profile = require('./Profile');

const Channel = sequelize.define('Channel', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING
    },
    ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Profile,
            key: 'id'
        },
        field: "owner_id"
    }
}, {
    tableName: 'channels',
    timestamps: false
});

module.exports = Channel;
