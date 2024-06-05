CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    CONSTRAINT fk_owner FOREIGN KEY(owner_id) REFERENCES profiles(id)
);
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
);
CREATE TABLE user_channel_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    channel_id UUID NOT NULL,
    role_id UUID NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES profiles(id),
    CONSTRAINT fk_channel FOREIGN KEY(channel_id) REFERENCES channels(id),
    CONSTRAINT fk_role FOREIGN KEY(role_id) REFERENCES roles(id)
);
CREATE TABLE twoFactorAuth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profileId UUID REFERENCES Profile(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fullName VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL,
    followed_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_follower FOREIGN KEY(follower_id) REFERENCES profiles(id),
    CONSTRAINT fk_followed FOREIGN KEY(followed_id) REFERENCES profiles(id)
);
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL,
    channel_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES profiles (id),
    FOREIGN KEY (channel_id) REFERENCES channels (id)
);

INSERT INTO roles (name)
VALUES
('SUPERADMIN'),
('HOST'),
('ADMIN');
