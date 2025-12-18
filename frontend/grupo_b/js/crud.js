// ============================================
// CRUD DE ESTUDIANTES - SICFOR (OPTIMIZADO)
// ============================================

const API_URL = 'http://localhost:8080/estudiantes';

// Variable global para almacenar la URL de la foto subida a Cloudinary
let urlFotoCloudinary = null;

// ============================================
// UTILIDADES
// ============================================
const obtenerDatosFormulario = () => ({
  fotografia: urlFotoCloudinary,
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
// SUBIR IMAGEN A CLOUDINARY
// ============================================
async function subirImagenACloudinary(file) {
  const statusElement = document.getElementById('uploading-status');
  
  try {
    statusElement.textContent = '📤 Subiendo imagen...';
    statusElement.style.color = '#0066cc';
    
    const formData = new FormData();
    formData.append('fotografia', file);
    
    const response = await fetch(`${API_URL}/upload-foto`, {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      urlFotoCloudinary = data.url;
      statusElement.textContent = '✅ Imagen subida correctamente';
      statusElement.style.color = '#28a745';
      return data.url;
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Error al subir imagen');
    }
  } catch (error) {
    console.error('Error al subir imagen:', error);
    statusElement.textContent = '❌ Error al subir imagen';
    statusElement.style.color = '#dc3545';
    urlFotoCloudinary = null;
    throw error;
  }
}

// ============================================
// PREVIEW DE IMAGEN
// ============================================
function validarYMostrarPreview(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  // Validar tamaño
  if (file.size > MAX_SIZE) {
    alert('La imagen no debe superar los 5MB');
    return false;
  }
  
  // Validar tipo
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    alert('Solo se permiten imágenes JPG, PNG, GIF o WEBP');
    return false;
  }
  
  // Mostrar preview
  const preview = document.getElementById('preview-imagen');
  const reader = new FileReader();
  
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = 'block';
  };
  
  reader.readAsDataURL(file);
  return true;
}

// ============================================
// 1. LISTAR ESTUDIANTES
// ============================================
async function listarEstudiantes() {
  const tbody = document.getElementById('tablaEstudiantes');
  
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener estudiantes');
    
    const estudiantes = await response.json();
    
    tbody.innerHTML = estudiantes.length === 0 
      ? '<tr><td colspan="7">No hay estudiantes registrados</td></tr>'
      : estudiantes.map(est => `
          <tr>
            <td><img src="${est.fotografia || fotoDefault(50)}" width="50" height="50" style="object-fit: cover; border-radius: 5px;"></td>
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
    tbody.innerHTML = '<tr><td colspan="7" style="color: red;">Error al cargar estudiantes</td></tr>';
  }
}

// ============================================
// 2. REGISTRAR ESTUDIANTE
// ============================================
async function registrarEstudiante(event) {
  event.preventDefault();
  
  try {
    // Verificar si hay una imagen seleccionada y subirla primero
    const fileInput = document.getElementById('fotografia');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      await subirImagenACloudinary(fileInput.files[0]);
    }
    
    // Enviar el formulario con la URL de Cloudinary
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(obtenerDatosFormulario())
    });
    
    await manejarRespuesta(response, 'Estudiante registrado correctamente', 'lista.html');
    
    if (response.ok) {
      document.getElementById('formularioRegistro').reset();
      document.getElementById('preview-imagen').style.display = 'none';
      document.getElementById('uploading-status').textContent = '';
      urlFotoCloudinary = null;
    }
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
    
    // Guardar la URL de la foto actual
    urlFotoCloudinary = est.fotografia;
    
    Object.keys(est).forEach(key => {
      const input = document.getElementById(key);
      // No intentar asignar valor al input file
      if (input && key !== 'fotografia') {
        input.value = est[key] || '';
      }
    });
    
    // Mostrar preview de la foto actual si existe
    if (est.fotografia) {
      const preview = document.getElementById('preview-imagen');
      if (preview) {
        preview.src = est.fotografia;
        preview.style.display = 'block';
      }
    }
    
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
    // Verificar si hay una nueva imagen seleccionada
    const fileInput = document.getElementById('fotografia');
    if (fileInput && fileInput.files && fileInput.files[0]) {
      // Si hay nueva imagen, subirla primero
      await subirImagenACloudinary(fileInput.files[0]);
    }
    // Si no hay nueva imagen, se mantiene urlFotoCloudinary con la URL existente
    
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
    
    // Event listener para preview de imagen
    const fotoInput = document.getElementById('fotografia');
    if (fotoInput) {
      fotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (!validarYMostrarPreview(file)) {
            fotoInput.value = '';
            return;
          }
          // Resetear URL para que se suba la nueva
          urlFotoCloudinary = null;
          document.getElementById('uploading-status').textContent = '';
        }
      });
    }
    
    if (id) {
      cargarEstudianteParaEditar(id);
      document.getElementById('formularioRegistro').addEventListener('submit', (e) => actualizarEstudiante(e, id));
    } else {
      document.getElementById('formularioRegistro').addEventListener('submit', registrarEstudiante);
    }
  }
});