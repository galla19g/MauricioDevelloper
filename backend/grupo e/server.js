// ===== IMPORTACIONES =====
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cloudinary = require('./config/cloudinary');
const { initializeDatabase } = require('./init-db');

// ===== INICIALIZACIÓN =====
const app = express();
const PORT = process.env.PORT || 5000;

// ===== VARIABLE GLOBAL DE POOL =====
let pool;

// ===== CARPETA DE UPLOADS =====
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ===== MIDDLEWARE =====
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../../frontend/grupo\ e')));
// Servir archivos locales
app.use('/uploads', express.static(uploadsDir));

// ===== CONFIGURACIÓN DE MULTER =====
// Para Cloudinary (memoria)
const uploadMemory = multer({ storage: multer.memoryStorage() });

// Para almacenamiento local (disco)
const uploadDisk = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
            cb(null, uniqueName);
        }
    })
});

// ===== LÍMITES DE TAMAÑO DE ARCHIVOS =====
const MAX_SIZE_IMAGE = 10 * 1024 * 1024; // 10 MB
const MAX_SIZE_VIDEO = 30 * 1024 * 1024; // 30 MB

// ===== FUNCIÓN PARA SANITIZAR NOMBRES DE ARCHIVO =====
function sanitizeFilename(filename) {
    // Remover extensión
    let name = filename.split('.')[0];
    
    // Remover acentos usando NFD (descomponer) y reemplazar caracteres acentuados
    name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Reemplazar caracteres especiales con guiones o nada
    name = name
        .replace(/[^a-zA-Z0-9_-]/g, '-')  // Reemplazar caracteres especiales con guion
        .replace(/-+/g, '-')               // Reemplazar múltiples guiones con uno solo
        .replace(/^-+|-+$/g, '');          // Remover guiones al inicio y final
    
    // Si el resultado está vacío, usar timestamp
    if (!name) {
        name = 'archivo';
    }
    
    return name.toLowerCase().substring(0, 50); // Limitar a 50 caracteres y minúsculas
}

// ===== POOL DE CONEXIÓN A BD =====
// Se inicializa después de ejecutar initializeDatabase()

// ===== RUTAS DE PRUEBA =====
app.get('/', (req, res) => {
    res.json({ 
        mensaje: 'Servidor Grupo E - Gestión de Recursos',
        versión: '1.0',
        status: 'online'
    });
});

// ===== PRUEBA DE CONEXIÓN A BD =====
app.get('/api/v1/test-db', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT 1');
        connection.release();
        res.json({ 
            success: true,
            mensaje: 'Conexión a base de datos exitosa',
            database: process.env.DB_NAME
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message
        });
    }
});

// ===== UPLOAD A CLOUDINARY =====
app.post('/api/v1/upload', uploadMemory.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha proporcionado un archivo' });
        }

        const { tipo, titulo, descripcion, autor, etiquetas } = req.body;

        // Validación
        if (!tipo || !titulo) {
            return res.status(400).json({ 
                error: 'Tipo y título son requeridos' 
            });
        }

        // ===== VALIDACIÓN DE TAMAÑO =====
        const isVideo = req.file.mimetype.startsWith('video');
        const maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
        const maxSizeMB = isVideo ? 30 : 10;
        const tipoArchivo = isVideo ? 'Video' : 'Imagen';

        if (req.file.size > maxSize) {
            return res.status(413).json({ 
                error: `${tipoArchivo} demasiado grande. Máximo permitido: ${maxSizeMB} MB. Tamaño actual: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB` 
            });
        }

        // Determinar el tipo de recurso (imagen o video)
        const resourceType = isVideo ? 'video' : 'auto';
        const folder = `sicfor/${tipo}`;

        // Subir a Cloudinary
        const cloudinaryPromise = new Promise((resolve, reject) => {
            const sanitizedName = sanitizeFilename(req.file.originalname);
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    folder: folder,
                    public_id: `${Date.now()}-${sanitizedName}`
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(req.file.buffer);
        });

        const cloudinaryResult = await cloudinaryPromise;

        // Guardar en base de datos
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO recursos (tipo, titulo, descripcion, url, url_cloudinary, public_id, autor, etiquetas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                tipo, 
                titulo, 
                descripcion || '', 
                cloudinaryResult.secure_url,
                cloudinaryResult.secure_url,
                cloudinaryResult.public_id,
                autor || '', 
                etiquetas || ''
            ]
        );
        connection.release();

        res.status(201).json({
            id: result.insertId,
            tipo,
            titulo,
            descripcion,
            url: cloudinaryResult.secure_url,
            url_cloudinary: cloudinaryResult.secure_url,
            public_id: cloudinaryResult.public_id,
            autor,
            etiquetas,
            cloudinary_data: {
                resource_type: cloudinaryResult.resource_type,
                format: cloudinaryResult.format,
                size: cloudinaryResult.bytes,
                duration: cloudinaryResult.duration || null
            },
            mensaje: 'Archivo subido y guardado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            details: 'Error al subir archivo a Cloudinary'
        });
    }
});

// ===== UPLOAD LOCAL =====
app.post('/api/v1/upload-local', uploadDisk.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha proporcionado un archivo' });
        }

        const { tipo, titulo, descripcion, autor, etiquetas } = req.body;

        // Validación
        if (!tipo || !titulo) {
            // Eliminar archivo si falta datos
            fs.unlink(req.file.path, () => {});
            return res.status(400).json({ 
                error: 'Tipo y título son requeridos' 
            });
        }

        // ===== VALIDACIÓN DE TAMAÑO =====
        const isVideo = req.file.mimetype.startsWith('video');
        const maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
        const maxSizeMB = isVideo ? 30 : 10;
        const tipoArchivo = isVideo ? 'Video' : 'Imagen';

        if (req.file.size > maxSize) {
            // Eliminar archivo si es muy grande
            fs.unlink(req.file.path, () => {});
            return res.status(413).json({ 
                error: `${tipoArchivo} demasiado grande. Máximo permitido: ${maxSizeMB} MB. Tamaño actual: ${(req.file.size / (1024 * 1024)).toFixed(2)} MB` 
            });
        }

        // URL local del archivo
        const fileUrl = `/uploads/${req.file.filename}`;

        // Guardar en base de datos
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO recursos (tipo, titulo, descripcion, url, url_cloudinary, public_id, autor, etiquetas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                tipo, 
                titulo, 
                descripcion || '', 
                fileUrl,
                null,
                `local:${req.file.filename}`,
                autor || '', 
                etiquetas || ''
            ]
        );
        connection.release();

        res.status(201).json({
            id: result.insertId,
            tipo,
            titulo,
            descripcion,
            url: fileUrl,
            storage: 'local',
            filename: req.file.filename,
            autor,
            etiquetas,
            file_data: {
                mimetype: req.file.mimetype,
                size: req.file.size,
                sizeMB: (req.file.size / (1024 * 1024)).toFixed(2)
            },
            mensaje: 'Archivo subido localmente y recurso creado exitosamente'
        });
    } catch (error) {
        // Eliminar archivo en caso de error
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ 
            error: error.message,
            details: 'Error al subir archivo localmente'
        });
    }
});

// ===== CRUD DE RECURSOS =====

// GET - Obtener todos los recursos
app.get('/api/v1/recursos', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM recursos ORDER BY fecha_creacion DESC'
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener recurso por ID
app.get('/api/v1/recursos/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM recursos WHERE id = ?',
            [req.params.id]
        );
        connection.release();
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET - Obtener recursos por tipo
app.get('/api/v1/recursos/tipo/:tipo', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
            'SELECT * FROM recursos WHERE tipo = ? ORDER BY fecha_creacion DESC',
            [req.params.tipo]
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Crear nuevo recurso
app.post('/api/v1/recursos', async (req, res) => {
    try {
        const { tipo, titulo, descripcion, url, autor, etiquetas } = req.body;
        
        // Validación
        if (!tipo || !titulo || !url) {
            return res.status(400).json({ 
                error: 'Tipo, título y URL son requeridos' 
            });
        }

        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'INSERT INTO recursos (tipo, titulo, descripcion, url, autor, etiquetas) VALUES (?, ?, ?, ?, ?, ?)',
            [tipo, titulo, descripcion || '', url, autor || '', etiquetas || '']
        );
        connection.release();

        res.status(201).json({
            id: result.insertId,
            tipo,
            titulo,
            descripcion,
            url,
            autor,
            etiquetas,
            mensaje: 'Recurso creado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT - Actualizar recurso
app.put('/api/v1/recursos/:id', async (req, res) => {
    try {
        const { tipo, titulo, descripcion, url, autor, etiquetas } = req.body;
        
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'UPDATE recursos SET tipo=?, titulo=?, descripcion=?, url=?, autor=?, etiquetas=? WHERE id=?',
            [tipo, titulo, descripcion, url, autor, etiquetas, req.params.id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        res.json({
            id: req.params.id,
            tipo,
            titulo,
            descripcion,
            url,
            autor,
            etiquetas,
            mensaje: 'Recurso actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Eliminar recurso
app.delete('/api/v1/recursos/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query(
            'DELETE FROM recursos WHERE id = ?',
            [req.params.id]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        res.json({ 
            mensaje: 'Recurso eliminado exitosamente',
            id: req.params.id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== ESTADÍSTICAS =====
app.get('/api/v1/estadisticas', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [stats] = await connection.query(
            'SELECT tipo, COUNT(*) as cantidad FROM recursos GROUP BY tipo'
        );
        const [total] = await connection.query(
            'SELECT COUNT(*) as total FROM recursos'
        );
        connection.release();

        res.json({
            total: total[0].total,
            por_tipo: stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== BÚSQUEDA =====
app.get('/api/v1/buscar', async (req, res) => {
    try {
        const { q, tipo } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
        }

        const connection = await pool.getConnection();
        
        let query = 'SELECT * FROM recursos WHERE (titulo LIKE ? OR descripcion LIKE ? OR etiquetas LIKE ?)';
        let params = [`%${q}%`, `%${q}%`, `%${q}%`];

        if (tipo) {
            query += ' AND tipo = ?';
            params.push(tipo);
        }

        query += ' ORDER BY fecha_creacion DESC';

        const [rows] = await connection.query(query, params);
        connection.release();

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== MANEJO DE ERRORES 404 =====
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// ===== FUNCIÓN PARA INICIAR EL SERVIDOR =====
async function startServer() {
    try {
        // Inicializar base de datos (crear tabla si no existe)
        pool = await initializeDatabase();

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`
    ╔═══════════════════════════════════╗
    ║  Servidor Grupo E - Recursos      ║
    ║  Puerto: ${PORT}                      ║
    ║  Ambiente: ${process.env.NODE_ENV}    ║
    ║  DB: ${process.env.DB_NAME}            ║
    ╚═══════════════════════════════════╝
            `);
            console.log('🚀 Servidor listo y escuchando...\n');
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

// ===== INICIAR =====
startServer();

// ===== MANEJO DE ERRORES NO CAPTURADOS =====
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
});
