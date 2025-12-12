const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const validarEstudiante = require('../middleware/validarEstudiante');

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
    const [exists] = await pool.promise().query(
      'SELECT id FROM estudiantes WHERE numero_identificacion = ? OR email = ?',
      [numero_identificacion, email]
    );

    if (exists.length > 0) {
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
    const [exists] = await pool.promise().query(
      'SELECT id FROM estudiantes WHERE (numero_identificacion = ? OR email = ?) AND id <> ?',
      [numero_identificacion, email, id]
    );

    if (exists.length > 0) {
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