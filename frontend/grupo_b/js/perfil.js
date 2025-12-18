// ============================================
// PERFIL DE ESTUDIANTE - SICFOR
// ============================================

const API_URL = 'http://localhost:8080/estudiantes';
let estudianteActual = null;

// ============================================
// UTILIDADES
// ============================================
function formatearFecha(fecha) {
  if (!fecha) return '-';
  
  // Si la fecha viene en formato ISO, extraer solo la parte de fecha
  if (fecha.includes('T')) {
    fecha = fecha.split('T')[0];
  }
  
  // Convertir de YYYY-MM-DD a DD/MM/YYYY para mejor legibilidad
  const partes = fecha.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  
  return fecha;
}

// ============================================
// SUBIR IMAGEN A CLOUDINARY
// ============================================
async function subirImagenACloudinary(file) {
  const statusElement = document.getElementById('statusFoto');
  
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
    throw error;
  }
}

// ============================================
// ACTUALIZAR FOTO DEL ESTUDIANTE
// ============================================
async function actualizarFotoEstudiante(id, nuevaUrlFoto) {
  try {
    // Convertir fecha al formato correcto (YYYY-MM-DD)
    let fechaFormateada = estudianteActual.fecha_nacimiento;
    if (fechaFormateada && fechaFormateada.includes('T')) {
      fechaFormateada = fechaFormateada.split('T')[0];
    }
    
    // Actualizar todos los datos del estudiante con la nueva foto
    const datosActualizados = {
      ...estudianteActual,
      fecha_nacimiento: fechaFormateada,
      fotografia: nuevaUrlFoto
    };
    
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosActualizados)
    });
    
    if (response.ok) {
      document.getElementById('statusFoto').textContent = '✅ Foto actualizada correctamente';
      document.getElementById('statusFoto').style.color = '#28a745';
      document.getElementById('fotoEstudiante').src = nuevaUrlFoto;
      setTimeout(() => {
        document.getElementById('statusFoto').textContent = '';
      }, 3000);
    } else {
      throw new Error('Error al actualizar foto en la base de datos');
    }
  } catch (error) {
    console.error('Error al actualizar foto:', error);
    document.getElementById('statusFoto').textContent = '❌ Error al actualizar foto';
    document.getElementById('statusFoto').style.color = '#dc3545';
  }
}

// ============================================
// MANEJAR CAMBIO DE FOTO
// ============================================
async function manejarCambioFoto(file, id) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  // Validar tamaño
  if (file.size > MAX_SIZE) {
    alert('La imagen no debe superar los 5MB');
    return;
  }
  
  // Validar tipo
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    alert('Solo se permiten imágenes JPG, PNG, GIF o WEBP');
    return;
  }
  
  try {
    // Subir imagen a Cloudinary
    const nuevaUrl = await subirImagenACloudinary(file);
    
    // Actualizar en la base de datos
    await actualizarFotoEstudiante(id, nuevaUrl);
  } catch (error) {
    console.error('Error al cambiar foto:', error);
  }
}

// ============================================
// CARGAR PERFIL DEL ESTUDIANTE
// ============================================
async function cargarPerfil() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  
  if (!id) {
    alert('No se especificó un estudiante');
    window.location.href = 'lista.html';
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/${id}`);
    const est = await response.json();
    
    // Guardar datos del estudiante actual
    estudianteActual = est;
    
    // Foto por defecto
    const fotoDefault = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin foto%3C/text%3E%3C/svg%3E';
    
    // Insertar datos en el DOM
    document.getElementById('fotoEstudiante').src = est.fotografia || fotoDefault;
    document.getElementById('nombreCompleto').textContent = `${est.nombres} ${est.apellidos}`;
    document.getElementById('tipoDocumento').textContent = est.tipo_documento;
    document.getElementById('numeroDocumento').textContent = est.numero_identificacion;
    document.getElementById('fechaNacimiento').textContent = formatearFecha(est.fecha_nacimiento);
    document.getElementById('departamentoNacimiento').textContent = est.departamento_nacimiento || '-';
    document.getElementById('municipioNacimiento').textContent = est.municipio_nacimiento || '-';
    document.getElementById('departamentoResidencia').textContent = est.departamento_residencia || '-';
    document.getElementById('municipioResidencia').textContent = est.municipio_residencia || '-';
    document.getElementById('direccion').textContent = est.direccion || '-';
    document.getElementById('correoElectronico').textContent = est.email;
    document.getElementById('celular').textContent = est.celular || '-';
    
    // Configurar botón de editar foto
    const btnEditarFoto = document.getElementById('btnEditarFoto');
    const inputFoto = document.getElementById('inputFotoNueva');
    
    if (btnEditarFoto && inputFoto) {
      btnEditarFoto.onclick = () => inputFoto.click();
      
      inputFoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          manejarCambioFoto(file, id);
        }
      });
    }
    
    // Configurar botones
    const botones = document.querySelectorAll('section:last-of-type button');
    if (botones.length >= 2) {
      botones[0].onclick = () => window.location.href = `registro.html?id=${id}`;
      botones[1].onclick = () => eliminarEstudiante(id);
    }
    
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    alert('Error al cargar el perfil del estudiante');
    window.location.href = 'lista.html';
  }
}

// ============================================
// ELIMINAR ESTUDIANTE
// ============================================
async function eliminarEstudiante(id) {
  if (!confirm('¿Está seguro de eliminar este estudiante?')) return;
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('✅ Estudiante eliminado correctamente');
      window.location.href = 'lista.html';
    } else {
      alert('❌ Error al eliminar estudiante');
    }
  } catch (error) {
    console.error('Error al eliminar:', error);
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', cargarPerfil);