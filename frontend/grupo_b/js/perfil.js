// ============================================
// PERFIL DE ESTUDIANTE - SICFOR
// ============================================

const API_URL = 'http://localhost:8080/estudiantes';

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
    
    // Foto por defecto
    const fotoDefault = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23ddd" width="150" height="150"/%3E%3Ctext fill="%23999" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin foto%3C/text%3E%3C/svg%3E';
    
    // Insertar datos en el DOM
    document.getElementById('fotoEstudiante').src = est.fotografia || fotoDefault;
    document.getElementById('nombreCompleto').textContent = `${est.nombres} ${est.apellidos}`;
    document.getElementById('tipoDocumento').textContent = est.tipo_documento;
    document.getElementById('numeroDocumento').textContent = est.numero_identificacion;
    document.getElementById('fechaNacimiento').textContent = est.fecha_nacimiento;
    document.getElementById('departamentoNacimiento').textContent = est.departamento_nacimiento || '-';
    document.getElementById('municipioNacimiento').textContent = est.municipio_nacimiento || '-';
    document.getElementById('departamentoResidencia').textContent = est.departamento_residencia || '-';
    document.getElementById('municipioResidencia').textContent = est.municipio_residencia || '-';
    document.getElementById('direccion').textContent = est.direccion || '-';
    document.getElementById('correoElectronico').textContent = est.email;
    document.getElementById('celular').textContent = est.celular || '-';
    
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