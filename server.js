const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static('public'));

// --- Socket.io Connection Event Handling ---
io.on('connection', (socket) => {
    console.log('⚡ A user connected via WebSocket:', socket.id);

    // Live chat message broadcasting
    socket.on('chatMessage', (data) => {
        io.emit('message', {
            user: data.user,
            text: data.text,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// --- Authentication Middleware ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or Expired Token' });
        req.user = user;
        next();
    });
};

// --- Role-Based Access Middleware ---
const authorizeRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Access Denied: You do not have permission' });
        }
        next();
    };
};

// --- User Registration API ---
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'user';

        await db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, userRole]
        );

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- User Login API ---
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token: token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Protected Routes ---
app.get('/api/dashboard', verifyToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}! This is your profile data.` });
});

app.get('/api/admin', verifyToken, authorizeRole('admin'), (req, res) => {
    res.json({ message: 'Welcome Admin! You have access to admin panel settings.' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));