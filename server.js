const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

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
});

app.get('/api/items', (req, res) => {
    const query = 'SELECT * FROM items';
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
    const query = 'INSERT INTO items (name) VALUES (?)';
    
    db.query(query, [itemName], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: result.insertId, name: itemName });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});