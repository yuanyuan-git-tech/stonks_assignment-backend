require('dotenv').config();
const express = require('express');
const http = require('http');
const passport = require('passport');
const session = require('express-session');
const Redis = require('ioredis');
const RedisStore = require('connect-redis').default;
const cors = require('cors');
const initializeWebSocket = require('./controller/channelController'); // Import WebSocket logic

const app = express();
const server = http.createServer(app);

const redisClient = new Redis(process.env.REDIS_URL);


const profileRoutes = require('./routes/profile');
const authRoutes = require('./routes/auth');
const twoFARoutes = require('./routes/2fa');
const followRoutes = require('./routes/follow');
const channelRoutes = require('./routes/channel');

require('./config/passport');

app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for testing; change to specific origin in production
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(session({
    // store: new RedisStore({ client: redisClient }),
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/profile', profileRoutes);
app.use('/auth', authRoutes);
app.use('/2fa', twoFARoutes);
app.use('/follow', followRoutes);
app.use('/channel', channelRoutes);

initializeWebSocket(server);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
