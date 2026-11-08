const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'codveda_jwt_secret_key_2026';

app.use(express.json());
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',     
    password: '0714159010sssA&',
    database: 'codveda_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database successfully!');

    // Initialize tables
    const itemsTableQuery = `
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const usersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(itemsTableQuery, (err) => {
        if (err) console.error('Error creating items table:', err);
    });

    db.query(usersTableQuery, (err) => {
        if (err) console.error('Error creating users table:', err);
    });
});

// ================= AUTH ROUTES =================

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }

    const assignedRole = (role === 'admin') ? 'admin' : 'user';

    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        if (results.length > 0) {
            return res.status(400).json({ message: 'Email is already registered. Please log in.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, [username, email, hashedPassword, assignedRole], (insertErr, result) => {
                if (insertErr) {
                    return res.status(500).json({ message: 'Failed to register user', error: insertErr.message });
                }
                res.status(201).json({ message: 'Registration successful! Please log in.' });
            });
        } catch (hashErr) {
            res.status(500).json({ message: 'Encryption error', error: hashErr.message });
        }
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error', error: err.message });
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = results[0];
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({
                message: 'Login successful!',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (compErr) {
            res.status(500).json({ message: 'Authentication error', error: compErr.message });
        }
    });
});

// ================= ITEMS ROUTES =================

app.get('/api/items', (req, res) => {
    const query = 'SELECT * FROM items ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.post('/api/items', (req, res) => {
    const itemName = req.body.name;
    if (!itemName) {
        return res.status(400).json({ error: 'Item name is required' });
    }
    const query = 'INSERT INTO items (name) VALUES (?)';
    db.query(query, [itemName], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, name: itemName });
    });
});

app.delete('/api/items/:id', (req, res) => {
    const itemId = req.params.id;
    const query = 'DELETE FROM items WHERE id = ?';
    db.query(query, [itemId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Item deleted successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
