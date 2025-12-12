// ============================================
// CRUD DE ESTUDIANTES - SICFOR (OPTIMIZADO)
// ============================================

const API_URL = 'http://localhost:8080/estudiantes';

// ============================================
// UTILIDADES
// ============================================
const obtenerDatosFormulario = () => ({
  fotografia: document.getElementById('fotografia')?.value || null,
  nombres: document.getElementById('nombres').value,
  apellidos: document.getElementById('apellidos').value,
  tipo_documento: document.getElementById('tipo_documento').value,
  numero_identificacion: document.getElementById('numero_identificacion').value,
  fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
  departamento_nacimiento: document.getElementById('departamento_nacimiento')?.value || null,
  municipio_nacimiento: document.getElementById('municipio_nacimiento')?.value || null,
  departamento_residencia: document.getElementById('departamento_residencia')?.value || null,
  municipio_residencia: document.getElementById('municipio_residencia')?.value || null,
  zona: document.getElementById('zona')?.value || null,
  direccion: document.getElementById('direccion')?.value || null,
  email: document.getElementById('email').value,
  celular: document.getElementById('celular')?.value || null
});

const manejarRespuesta = async (response, mensajeExito, redireccion) => {
  const data = await response.json();
  if (response.ok) {
    alert(`✅ ${mensajeExito}`);
    if (redireccion) window.location.href = redireccion;
  } else {
    alert(`❌ Error: ${data.error || 'Operación fallida'}`);
  }
};

const fotoDefault = (size) => `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"%3E%3Crect fill="%23ddd" width="${size}" height="${size}"/%3E%3Ctext fill="%23999" font-size="12" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFoto%3C/text%3E%3C/svg%3E`;

// ============================================
// 1. LISTAR ESTUDIANTES
// ============================================
async function listarEstudiantes() {
  try {
    const response = await fetch(API_URL);
    const estudiantes = await response.json();
    const tbody = document.getElementById('tablaEstudiantes');
    
    tbody.innerHTML = estudiantes.length === 0 
      ? '<tr><td colspan="7">No hay estudiantes registrados</td></tr>'
      : estudiantes.map(est => `
          <tr>
            <td><img src="${est.fotografia || fotoDefault(50)}" width="50" height="50" style="object-fit: cover;"></td>
            <td>${est.nombres} ${est.apellidos}</td>
            <td>${est.tipo_documento}</td>
            <td>${est.numero_identificacion}</td>
            <td>${est.email}</td>
            <td>${est.celular || 'N/A'}</td>
            <td>
              <button onclick="verPerfil(${est.id})">Ver Perfil</button>
              <button onclick="editarEstudiante(${est.id})">Editar</button>
              <button onclick="eliminarEstudiante(${est.id})">Eliminar</button>
            </td>
          </tr>
        `).join('');
  } catch (error) {
    console.error('Error al listar:', error);
  }
}

// ============================================
// 2. REGISTRAR ESTUDIANTE
// ============================================
async function registrarEstudiante(event) {
  event.preventDefault();
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obtenerDatosFormulario())
    });
    await manejarRespuesta(response, 'Estudiante registrado correctamente', 'lista.html');
    if (response.ok) document.getElementById('formularioRegistro').reset();
  } catch (error) {
    console.error('Error al registrar:', error);
    alert('Error de conexión al registrar estudiante');
  }
}

// ============================================
// 3. ELIMINAR ESTUDIANTE
// ============================================
async function eliminarEstudiante(id) {
  if (!confirm('¿Está seguro de eliminar este estudiante?')) return;
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) {
      alert('✅ Estudiante eliminado correctamente');
      listarEstudiantes();
    } else {
      alert('❌ Error al eliminar estudiante');
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
  }
}

// ============================================
// 4. EDITAR ESTUDIANTE
// ============================================
async function cargarEstudianteParaEditar(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const est = await response.json();
    
    Object.keys(est).forEach(key => {
      const input = document.getElementById(key);
      if (input) input.value = est[key] || '';
    });
    
    document.querySelector('h2').textContent = 'Editar Estudiante';
    document.querySelector('button[type="submit"]').textContent = 'Actualizar Estudiante';
  } catch (error) {
    console.error('Error al cargar estudiante:', error);
    alert('Error al cargar datos del estudiante');
    window.location.href = 'lista.html';
  }
}

async function actualizarEstudiante(event, id) {
  event.preventDefault();
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obtenerDatosFormulario())
    });
    await manejarRespuesta(response, 'Estudiante actualizado correctamente', 'lista.html');
  } catch (error) {
    console.error('Error al actualizar:', error);
    alert('Error de conexión al actualizar estudiante');
  }
}

// ============================================
// 5. NAVEGACIÓN
// ============================================
const verPerfil = (id) => window.location.href = `perfil.html?id=${id}`;
const editarEstudiante = (id) => window.location.href = `registro.html?id=${id}`;

// ============================================
// 6. INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('tablaEstudiantes')) {
    listarEstudiantes();
  }
  
  if (document.getElementById('formularioRegistro')) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (id) {
      cargarEstudianteParaEditar(id);
      document.getElementById('formularioRegistro').addEventListener('submit', (e) => actualizarEstudiante(e, id));
    } else {
      document.getElementById('formularioRegistro').addEventListener('submit', registrarEstudiante);
    }
  }
});