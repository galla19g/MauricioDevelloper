const mysql=require("mysql2")
const express=require("express")
const path=require("path")
const app=express()
const cors=require("cors")
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

app.use(cors())
app.use(express.json())

// Servir archivos estáticos desde la carpeta frontend
app.use(express.static(path.join(__dirname, '../../frontend')))

// Crear conexión usando variables de entorno
const conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
})

// Probar la conexión
conexion.connect((error) => {
    if (error) {
        console.error('Error conectando a la base de datos:', error)
        throw error
    }
    console.log('Conexión exitosa a MySQL')
})

app.get('/cursos', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/grupo_d/curso.html'))
})
app.get('/api/cursos', (req, res) => {
    const sql = 'SELECT * FROM cursos'
    conexion.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener cursos:', error)
            return res.status(500).json({ error: 'Error al obtener cursos' })
        }
        res.json(results)
    })
})
app.get('/api/estudiantes', (req, res) => {
    // Lista inscripciones con datos del estudiante y curso
    const sql = 'SELECT i.*, e.nombres, c.titulo FROM inscripciones i JOIN cursos c ON i.id_curso = c.id JOIN estudiantes e ON i.id_estudiante = e.id'
    conexion.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener estudiantes:', error)
            return res.status(500).json({ error: 'Error al obtener estudiantes' })
        }
        res.json(results)
    })
})

app.delete('/api/estudiantes/:id', (req, res) => {
    const { id } = req.params
    const sql = 'DELETE FROM inscripciones WHERE id = ?'
    conexion.query(sql, [id], (error, result) => {
        if (error) {
            console.error('Error al eliminar inscripción:', error)
            return res.status(500).json({ error: 'Error al eliminar inscripción' })
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Inscripción no encontrada' })
        }
        res.json({ success: true })
    })
})

app.post('/api/cursos', (req, res) => {
    const { titulo, descripcion, duracion, modalidad, unidades_formacion } = req.body
    const sql = 'INSERT INTO cursos (titulo, descripcion, duracion, modalidad, unidades_formacion) VALUES (?, ?, ?, ?, ?)'
    conexion.query(sql, [titulo, descripcion, duracion, modalidad, unidades_formacion], (error, result) => {
        if (error) {
            console.error('Error al crear curso:', error)
            return res.status(500).json({ error: 'Error al crear curso' })
        }
        res.json({ id: result.insertId, titulo, descripcion, duracion, modalidad, unidades_formacion })
    })
})

app.delete('/api/cursos/:id', (req, res) => {
    const { id } = req.params
    const sql = 'DELETE FROM cursos WHERE id = ?'
    conexion.query(sql, [id], (error, result) => {
        if (error) {
            console.error('Error al eliminar curso:', error)
            return res.status(500).json({ error: 'Error al eliminar curso' })
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }
        res.json({ success: true })
    })
})

app.get('/api/estudiantes/list', (req, res) => {
    const sql = 'SELECT id, nombres FROM estudiantes'
    conexion.query(sql, (error, results) => {
        if (error) {
            console.error('Error al obtener lista de estudiantes:', error)
            return res.status(500).json({ error: 'Error al obtener lista de estudiantes' })
        }
        res.json(results)
    })
})

app.post('/api/estudiantes', (req, res) => {
    const { id_estudiante, id_curso } = req.body
    const sql = 'INSERT INTO inscripciones (id_estudiante, id_curso) VALUES (?, ?)'
    conexion.query(sql, [id_estudiante, id_curso], (error, result) => {
        if (error) {
            console.error('Error al inscribir estudiante:', error)
            return res.status(500).json({ error: 'Error al inscribir estudiante' })
        }
        res.json({ id: result.insertId, id_estudiante, id_curso })
    })
})

app.get('/api/cursos/:id', (req, res) => {
    const { id } = req.params
    const sql = 'SELECT * FROM cursos WHERE id = ?'
    conexion.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener curso:', error)
            return res.status(500).json({ error: 'Error al obtener curso' })
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }
        res.json(results[0])
    })
})

app.put('/api/cursos/:id', (req, res) => {
    const { id } = req.params
    const { titulo, descripcion, duracion, modalidad, unidades_formacion } = req.body
    const sql = 'UPDATE cursos SET titulo = ?, descripcion = ?, duracion = ?, modalidad = ?, unidades_formacion = ? WHERE id = ?'
    conexion.query(sql, [titulo, descripcion, duracion, modalidad, unidades_formacion, id], (error, result) => {
        if (error) {
            console.error('Error al actualizar curso:', error)
            return res.status(500).json({ error: 'Error al actualizar curso' })
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' })
        }
        res.json({ id, titulo, descripcion, duracion, modalidad, unidades_formacion })
    })
})

// Iniciar servidor
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`)
    console.log(`Accede a: http://localhost:${PORT}/grupo_d/curso.html`)
})

module.exports = { conexion, app }
