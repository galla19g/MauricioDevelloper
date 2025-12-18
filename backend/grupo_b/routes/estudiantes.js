const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const validarEstudiante = require('../middleware/validarEstudiante');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Helper para verificar duplicados
const verificarDuplicados = async (numero_identificacion, email, idExcluir = null) => {
  const query = idExcluir
    ? 'SELECT id FROM estudiantes WHERE (numero_identificacion = ? OR email = ?) AND id <> ?'
    : 'SELECT id FROM estudiantes WHERE numero_identificacion = ? OR email = ?';
  
  const params = idExcluir ? [numero_identificacion, email, idExcluir] : [numero_identificacion, email];
  const [rows] = await pool.promise().query(query, params);
  return rows.length > 0;
};

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validar que sea una imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// ============================================
// RUTA PARA SUBIR IMAGEN A CLOUDINARY
// ============================================
router.post('/upload-foto', (req, res, next) => {
  upload.single('fotografia')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'El archivo excede el tamaño máximo de 5MB' });
        }
        return res.status(400).json({ error: `Error de carga: ${err.message}` });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    // Subir imagen a Cloudinary usando el buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'sicfor/estudiantes', // Carpeta en Cloudinary
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' }, // Limitar tamaño máximo
            { quality: 'auto' } // Optimización automática
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      
      // Enviar el buffer a Cloudinary
      uploadStream.end(req.file.buffer);
    });

    // Retornar la URL segura de la imagen
    res.json({ 
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT * FROM estudiantes');
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener estudiantes:', err);
    res.status(500).json({ error: 'Error al obtener estudiantes' });
  }
});

router.get('/buscar', async (req, res) => {
  try {
    const { numero_identificacion } = req.query;
    const [rows] = await pool.promise().query(
      'SELECT * FROM estudiantes WHERE numero_identificacion = ?',
      [numero_identificacion]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar estudiante' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.promise().query(
      'SELECT * FROM estudiantes WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener estudiante' });
  }
});

router.post('/', validarEstudiante, async (req, res) => {
  const {
    fotografia,
    nombres,
    apellidos,
    tipo_documento,
    numero_identificacion,
    fecha_nacimiento,
    departamento_nacimiento,
    municipio_nacimiento,
    departamento_residencia,
    municipio_residencia,
    zona,
    direccion,
    email,
    celular
  } = req.body;

  try {
    // 🔍 Validar duplicados por CC o email
    if (await verificarDuplicados(numero_identificacion, email)) {
      return res.status(400).json({ error: 'Estudiante ya registrado' });
    }

    // ✅ Insertar si no hay duplicados
    const [result] = await pool.promise().query(
      `INSERT INTO estudiantes 
      (fotografia, nombres, apellidos, tipo_documento, numero_identificacion, fecha_nacimiento,
       departamento_nacimiento, municipio_nacimiento, departamento_residencia, municipio_residencia,
       zona, direccion, email, celular)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fotografia,
        nombres,
        apellidos,
        tipo_documento,
        numero_identificacion,
        fecha_nacimiento,
        departamento_nacimiento,
        municipio_nacimiento,
        departamento_residencia,
        municipio_residencia,
        zona,
        direccion,
        email,
        celular
      ]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Estudiante creado correctamente'
    });
  } catch (err) {
    console.error('Error al crear estudiante:', err);
    res.status(500).json({ error: 'Error al crear estudiante' });
  }
});

router.put('/:id', validarEstudiante, async (req, res) => {
  const { id } = req.params;
  const {
    fotografia,
    nombres,
    apellidos,
    tipo_documento,
    numero_identificacion,
    fecha_nacimiento,
    departamento_nacimiento,
    municipio_nacimiento,
    departamento_residencia,
    municipio_residencia,
    zona,
    direccion,
    email,
    celular
  } = req.body;

  try {
    // 🔍 Validar duplicados: que el CC o email no pertenezcan a otro estudiante
    if (await verificarDuplicados(numero_identificacion, email, id)) {
      return res.status(400).json({ error: 'Ya existe otro estudiante con ese documento o email' });
    }

    // ✅ Actualizar si no hay duplicados
    const [result] = await pool.promise().query(
      `UPDATE estudiantes SET 
        fotografia = ?, 
        nombres = ?, 
        apellidos = ?, 
        tipo_documento = ?, 
        numero_identificacion = ?, 
        fecha_nacimiento = ?, 
        departamento_nacimiento = ?, 
        municipio_nacimiento = ?, 
        departamento_residencia = ?, 
        municipio_residencia = ?, 
        zona = ?, 
        direccion = ?, 
        email = ?, 
        celular = ?
      WHERE id = ?`,
      [
        fotografia,
        nombres,
        apellidos,
        tipo_documento,
        numero_identificacion,
        fecha_nacimiento,
        departamento_nacimiento,
        municipio_nacimiento,
        departamento_residencia,
        municipio_residencia,
        zona,
        direccion,
        email,
        celular,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    res.json({ message: 'Estudiante actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar estudiante:', err);
    res.status(500).json({ error: 'Error al actualizar estudiante' });
  }
});


router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.promise().query(
      'DELETE FROM estudiantes WHERE id = ?',
      [id]  
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado' });
    }

    res.json({ message: 'Estudiante eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar estudiante:', err);
    res.status(500).json({ error: 'Error al eliminar estudiante' });
  }
});

module.exports = router;