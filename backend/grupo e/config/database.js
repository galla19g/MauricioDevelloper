// ===== CONFIGURACIÓN DE BASE DE DATOS =====
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'SICFOR',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Función para obtener conexión
async function getConnection() {
    return await pool.getConnection();
}

// Función para ejecutar query
async function executeQuery(sql, params = []) {
    const connection = await getConnection();
    try {
        const [results] = await connection.query(sql, params);
        return results;
    } finally {
        connection.release();
    }
}

module.exports = {
    pool,
    getConnection,
    executeQuery
};
