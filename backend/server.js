const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const duckdb = require('duckdb');

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', req.body);
    }
    next();
});

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let db;
let connection;
try {
    db = new duckdb.Database(':memory:');
    connection = db.connect();
} catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
}

function runQuery(query) {
    return new Promise((resolve, reject) => {
        connection.all(query, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
}

try {
    connection.run(`
        CREATE TABLE IF NOT EXISTS cars (
            id INTEGER PRIMARY KEY,
            model VARCHAR NOT NULL,
            manufacturer VARCHAR NOT NULL,
            price DOUBLE CHECK (price >= 0),
            stock INTEGER CHECK (stock >= 0)
        );
    `);

    connection.run(`
        INSERT INTO cars VALUES
        (1, 'Swift', 'Maruti Suzuki', 750000, 50),
        (2, 'Creta', 'Hyundai', 1050000, 30),
        (3, 'Harrier', 'Tata', 1500000, 20)
        ON CONFLICT(id) DO NOTHING;
    `);
} catch (error) {
    console.error('Schema initialization error:', error);
    process.exit(1);
}

app.get('/api/cars', async (req, res) => {
    try {
        const cars = await runQuery('SELECT * FROM cars ORDER BY id;');
        res.json({
            success: true,
            data: cars
        });
    } catch (error) {
        console.error('Error retrieving cars:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve cars'
        });
    }
});

app.post('/api/cars', async (req, res) => {
    console.log('Received POST request to /api/cars');
    console.log('Request body:', req.body);
    
    try {
        const { id, model, manufacturer, price, stock } = req.body;

        if (!id || !model || !manufacturer || price === undefined || stock === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        await runQuery(
            `INSERT INTO cars (id, model, manufacturer, price, stock) 
             VALUES (${id}, '${model}', '${manufacturer}', ${price}, ${stock})`
        );

        const insertedCar = await runQuery('SELECT * FROM cars WHERE id = ' + id);

        res.status(201).json({
            success: true,
            message: 'Car added successfully',
            data: insertedCar[0]
        });

    } catch (error) {
        console.error('Error adding car:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add car'
        });
    }
});

app.delete('/api/cars/:id', async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        
        if (isNaN(carId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ID format'
            });
        }

        await runQuery('DELETE FROM cars WHERE id = ' + carId);
        
        res.json({
            success: true,
            message: `Car with id ${carId} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete car'
        });
    }
});

app.use((req, res) => {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET    /api/cars');
    console.log('  POST   /api/cars');
    console.log('  DELETE /api/cars/:id');
});