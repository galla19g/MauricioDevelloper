const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const estudiantesRoutes = require('./backend/grupo_b/routes/estudiantes');

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/estudiantes', estudiantesRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});