// ===== INICIALIZADOR AUTOMÁTICO DE BASE DE DATOS =====
require('dotenv').config();
const mysql = require('mysql2/promise');

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

function log(type, message) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };
    console.log(`${icons[type]} ${message}`);
}

async function initializeDatabase() {
    let connectionPool;

    try {
        log('info', 'Conectando a la base de datos...');

        // Crear conexión inicial sin especificar base de datos
        connectionPool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
        });

        const connection = await connectionPool.getConnection();

        // ===== VERIFICAR/CREAR BASE DE DATOS =====
        log('info', `Validando base de datos "${process.env.DB_NAME}"...`);

        await connection.query(
            `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
        );

        log('success', `Base de datos "${process.env.DB_NAME}" lista.`);

        // Seleccionar base de datos
        await connection.query(`USE ${process.env.DB_NAME}`);

        // ===== VERIFICAR SI LA TABLA EXISTE =====
        const [tables] = await connection.query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'recursos'`,
            [process.env.DB_NAME]
        );

        if (tables.length === 0) {
            log('warning', 'Tabla "recursos" no existe. Creando...');

            // Crear tabla
            await connection.query(`
                CREATE TABLE recursos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    tipo ENUM('pdf', 'guias', 'videos', 'enlaces') NOT NULL,
                    titulo VARCHAR(255) NOT NULL,
                    descripcion TEXT,
                    url VARCHAR(500) NOT NULL,
                    url_cloudinary VARCHAR(500),
                    public_id VARCHAR(255),
                    storage_type ENUM('local', 'cloudinary', 'url') DEFAULT 'url',
                    autor VARCHAR(150),
                    etiquetas VARCHAR(500),
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_tipo (tipo),
                    INDEX idx_titulo (titulo),
                    INDEX idx_fecha (fecha_creacion)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);

            log('success', 'Tabla "recursos" creada exitosamente.');

            // ===== INSERTAR DATOS DE EJEMPLO =====
            log('info', 'Insertando datos de ejemplo...');

            const sampleData = [
                ['pdf', 'Guía JavaScript ES6', 'Introducción a características modernas de JavaScript', '#', 'Grupo E', 'javascript,web,programación'],
                ['guias', 'Metodología Ágil', 'Guía práctica sobre desarrollo ágil', '#', 'Grupo E', 'agile,metodología,gestión'],
                ['videos', 'Tutorial React Hooks', 'Series de videos sobre React y Hooks', '#', 'Grupo E', 'react,hooks,frontend'],
                ['enlaces', 'Documentación MDN', 'Referencia oficial de tecnologías web', 'https://developer.mozilla.org', 'Mozilla', 'documentación,referencia,web'],
            ];

            for (const data of sampleData) {
                await connection.query(
                    'INSERT INTO recursos (tipo, titulo, descripcion, url, autor, etiquetas) VALUES (?, ?, ?, ?, ?, ?)',
                    data
                );
            }

            log('success', `${sampleData.length} registros de ejemplo insertados.`);
        } else {
            log('success', 'Tabla "recursos" ya existe. Saltando creación.');

            // Contar registros existentes
            const [countResult] = await connection.query('SELECT COUNT(*) as total FROM recursos');
            const totalRecords = countResult[0].total;
            log('info', `Total de registros en la tabla: ${totalRecords}`);
        }

        connection.release();

        log('success', '✨ Base de datos inicializada correctamente.\n');

        return connectionPool;
    } catch (error) {
        log('error', `Error inicializando base de datos: ${error.message}`);
        console.error('Detalles del error:', error);
        
        if (connectionPool) {
            await connectionPool.end();
        }
        
        throw error;
    }
}

module.exports = { initializeDatabase };
