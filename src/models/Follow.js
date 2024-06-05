const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profile = require('./Profile');

const Follow = sequelize.define('Follow', {
    followerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Profile,
            key: 'id'
        },
        field: "follower_id"
    },
    followedId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Profile,
            key: 'id'
        },
        field: "followed_id"
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'created_at'
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'updated_at'
    }
}, {
    tableName: 'follows'
});

Profile.belongsToMany(Profile, { through: Follow, as: 'Followers', foreignKey: 'followedId' });
Profile.belongsToMany(Profile, { through: Follow, as: 'Following', foreignKey: 'followerId' });

module.exports = Follow;
