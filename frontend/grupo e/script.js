// ===== CONFIGURACIÓN DE API =====
const API_URL = 'http://localhost:8080/api/v1';

// ===== DATA MANAGEMENT =====
let resources = [];
let editingResourceId = null;
let storageType = 'local'; // 'local' o 'cloudinary'

// ===== LÍMITES DE TAMAÑO =====
const MAX_SIZE_IMAGE = 10 * 1024 * 1024; // 10 MB
const MAX_SIZE_VIDEO = 30 * 1024 * 1024; // 30 MB

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    loadResources();
    initializeEventListeners();
    renderDashboard();
});

// ===== INICIALIZAR EVENT LISTENERS =====
function initializeEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection(item.dataset.section);
        });
    });

    // Formularios
    document.getElementById('resourceForm').addEventListener('submit', saveResource);
    document.getElementById('crudForm').addEventListener('submit', saveCrudResource);

    // Búsqueda y filtros
    document.getElementById('search-input').addEventListener('input', filterCrudTable);
    document.getElementById('type-filter').addEventListener('change', filterCrudTable);

    // Modales
    document.getElementById('resourceModal').addEventListener('click', (e) => {
        if (e.target.id === 'resourceModal') closeResourceModal();
    });

    document.getElementById('crudModal').addEventListener('click', (e) => {
        if (e.target.id === 'crudModal') closeCrudModal();
    });
}

// ===== CARGAR RECURSOS DESDE LA API =====
async function loadResources() {
    try {
        const response = await fetch(`${API_URL}/recursos`);
        if (!response.ok) throw new Error('Error al cargar recursos');
        
        resources = await response.json();
        showNotification('Recursos cargados desde la base de datos', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al conectar con la servidor. Verifica que esté corriendo.', 'error');
    }
}

// ===== NAVEGACIÓN =====
function navigateToSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar sección seleccionada
    document.getElementById(sectionId).classList.add('active');

    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });

    // Renderizar contenido
    if (sectionId === 'dashboard') {
        renderDashboard();
    } else if (['pdf', 'guias', 'videos', 'enlaces'].includes(sectionId)) {
        renderResources(sectionId);
    } else if (sectionId === 'crud') {
        renderCrudTable();
    } else if (sectionId === 'config') {
        renderConfiguration();
    }
}

// ===== DASHBOARD =====
function renderDashboard() {
    updateStats();
    renderRecentResources();
}

function updateStats() {
    const stats = {
        pdf: resources.filter(r => r.tipo === 'pdf').length,
        guias: resources.filter(r => r.tipo === 'guias').length,
        videos: resources.filter(r => r.tipo === 'videos').length,
        enlaces: resources.filter(r => r.tipo === 'enlaces').length,
    };

    document.getElementById('count-pdf').textContent = stats.pdf;
    document.getElementById('count-guias').textContent = stats.guias;
    document.getElementById('count-videos').textContent = stats.videos;
    document.getElementById('count-enlaces').textContent = stats.enlaces;
}

function renderRecentResources() {
    const container = document.getElementById('recent-recursos');
    const recent = [...resources].reverse().slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay recursos agregados aún</p>';
        return;
    }

    container.innerHTML = recent.map(resource => `
        <div class="resource-item">
            <div class="resource-item-info">
                <div class="resource-item-title">${resource.titulo}</div>
                <div class="resource-item-meta">
                    <span class="resource-type-badge">${getTypeName(resource.tipo)}</span>
                    <span>${new Date(resource.fecha_creacion).toLocaleDateString('es-ES')}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== RENDERIZAR RECURSOS POR TIPO =====
function renderResources(type) {
    const container = document.getElementById(`${type}-list`);
    const filtered = resources.filter(r => r.tipo === type);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="empty-state">No hay ${getTypeName(type).toLowerCase()}</p>`;
        return;
    }

    container.innerHTML = filtered.map(resource => {
        const isImage = resource.url && (resource.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || resource.url.includes('cloudinary'));
        const isVideo = resource.url && (resource.url.match(/\.(mp4|webm|mov|avi|mkv)$/i) || resource.url.includes('cloudinary'));
        
        let preview = '';
        if (isImage && resource.url) {
            preview = `<img src="${resource.url}" alt="${resource.titulo}" class="resource-preview" onclick="openMediaModal(${resource.id}, 'image')" style="cursor: pointer;">`;
        } else if (isVideo && resource.url) {
            preview = `
                <div class="resource-preview-video">
                    <video src="${resource.url}" class="resource-preview" style="max-height: 200px; width: 100%;" controls onclick="event.stopPropagation()" onplay="event.stopPropagation()"></video>
                    <div class="video-play-btn" onclick="openMediaModal(${resource.id}, 'video')" style="cursor: pointer; position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                        <span style="pointer-events: auto; cursor: pointer;">📺 Ver completo</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="resource-card">
                ${preview}
                <h3>${resource.titulo}</h3>
                ${resource.descripcion ? `<p>${resource.descripcion}</p>` : ''}
                <div class="resource-meta">
                    ${resource.autor ? `<span>👤 ${resource.autor}</span>` : ''}
                    <span>📅 ${new Date(resource.fecha_creacion).toLocaleDateString('es-ES')}</span>
                </div>
                ${resource.etiquetas ? `
                    <div class="resource-meta">
                        ${resource.etiquetas.split(',').map(tag => `<span>#${tag.trim()}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="resource-actions">
                    ${resource.url ? `<a href="${resource.url}" target="_blank" class="btn btn-primary btn-icon">Abrir</a>` : ''}
                    ${(isImage || isVideo) && resource.url ? `<button class="btn btn-secondary btn-icon" onclick="downloadMedia('${resource.url}', '${resource.titulo}')">Descargar</button>` : ''}
                    <button class="btn btn-danger btn-icon" onclick="deleteResource(${resource.id})">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== TABLA CRUD =====
function renderCrudTable(filtered = null) {
    const tbody = document.getElementById('crud-tbody');
    const data = filtered || resources;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No hay recursos. Agrega uno nuevo.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(resource => `
        <tr>
            <td><span class="type-badge">${getTypeName(resource.tipo)}</span></td>
            <td>${resource.titulo}</td>
            <td>${resource.descripcion || '-'}</td>
            <td>${new Date(resource.fecha_creacion).toLocaleDateString('es-ES')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editCrudResource(${resource.id})">✏️ Editar</button>
                    <button class="btn-delete" onclick="deleteResource(${resource.id})">🗑️ Eliminar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterCrudTable() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;

    const filtered = resources.filter(resource => {
        const matchSearch = resource.titulo.toLowerCase().includes(search) ||
                          (resource.descripcion && resource.descripcion.toLowerCase().includes(search));
        const matchType = !typeFilter || resource.tipo === typeFilter;
        return matchSearch && matchType;
    });

    renderCrudTable(filtered);
}

// ===== MODALES - RESOURCE =====
function openAddResourceModal(type) {
    clearResourceForm();
    document.getElementById('modal-title').textContent = `Agregar ${getTypeName(type)}`;
    const modal = document.getElementById('resourceModal');
    modal.classList.add('active');
    modal.dataset.type = type;
}

function closeResourceModal() {
    document.getElementById('resourceModal').classList.remove('active');
    clearResourceForm();
}

function clearResourceForm() {
    document.getElementById('resourceForm').reset();
    document.getElementById('file-info-resource').innerHTML = '';
}

async function saveResource(e) {
    e.preventDefault();

    const modal = document.getElementById('resourceModal');
    const type = modal.dataset.type;
    const archivoInput = document.getElementById('resource-archivo');
    const urlInput = document.getElementById('resource-url');
    const tituloInput = document.getElementById('resource-titulo');

    // Validar que se proporcione archivo o URL
    if (!archivoInput.files[0] && !urlInput.value) {
        showNotification('⚠️ Debes proporcionar un archivo o una URL', 'error');
        return;
    }

    // Validar tamaño de archivo si se proporciona
    if (archivoInput.files[0]) {
        if (!validarTamanoArchivoResource()) {
            showNotification('❌ El archivo excede el tamaño máximo permitido', 'error');
            return;
        }
    }

    try {
        if (archivoInput.files[0]) {
            // Subir archivo a Cloudinary
            showNotification('⏳ Subiendo archivo a Cloudinary...', 'info');
            
            const formData = new FormData();
            formData.append('file', archivoInput.files[0]);
            formData.append('tipo', type);
            formData.append('titulo', tituloInput.value);
            formData.append('descripcion', document.getElementById('resource-descripcion').value);
            formData.append('autor', document.getElementById('resource-autor').value);
            formData.append('etiquetas', document.getElementById('resource-etiquetas').value);

            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al subir archivo');
            }

            const newResource = await response.json();
            resources.push(newResource);
            showNotification('✅ ¡Archivo subido exitosamente! Recurso creado.', 'success');
        } else {
            // Crear con URL solamente
            const resourceData = {
                tipo: type,
                titulo: tituloInput.value,
                descripcion: document.getElementById('resource-descripcion').value,
                url: urlInput.value,
                autor: document.getElementById('resource-autor').value,
                etiquetas: document.getElementById('resource-etiquetas').value,
            };

            const response = await fetch(`${API_URL}/recursos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resourceData)
            });

            if (!response.ok) throw new Error('Error al crear recurso');

            const newResource = await response.json();
            resources.push(newResource);
            showNotification('✅ Recurso agregado exitosamente');
        }
        
        closeResourceModal();
        navigateToSection(type);
        renderRecentResources();
        updateStats();
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ ' + (error.message || 'Error al agregar recurso'), 'error');
    }
}

// ===== MODALES - CRUD =====
function openCrudModal() {
    editingResourceId = null;
    document.getElementById('crud-modal-title').textContent = 'Nuevo Recurso';
    document.getElementById('crudForm').reset();
    document.getElementById('file-info').innerHTML = '';
    document.getElementById('crudModal').classList.add('active');
}

function closeCrudModal() {
    document.getElementById('crudModal').classList.remove('active');
}

// ===== VALIDACIÓN DE TAMAÑO DE ARCHIVO =====
function validarTamanoArchivo() {
    const archivoInput = document.getElementById('crud-archivo');
    const fileInfo = document.getElementById('file-info');
    
    if (!archivoInput.files[0]) {
        fileInfo.innerHTML = '';
        return;
    }

    const file = archivoInput.files[0];
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    
    let maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
    let maxSizeMB = isVideo ? 30 : 10;
    let tipo = isVideo ? 'Video' : 'Imagen';

    // Mostrar información del archivo
    let infoHTML = `📁 ${file.name} (${sizeMB} MB)`;
    
    if (file.size > maxSize) {
        // ❌ ARCHIVO DEMASIADO GRANDE
        infoHTML += `<br><span style="color: #d32f2f; font-weight: bold;">❌ ERROR: El ${tipo.toLowerCase()} es demasiado grande</span>`;
        infoHTML += `<br><span style="color: #d32f2f;">Máximo permitido: ${maxSizeMB} MB</span>`;
        fileInfo.innerHTML = infoHTML;
        archivoInput.value = ''; // Limpiar input
        return false;
    } else {
        // ✅ ARCHIVO VÁLIDO
        infoHTML += `<br><span style="color: #388e3c; font-weight: bold;">✅ ${tipo} válido (Máximo: ${maxSizeMB} MB)</span>`;
        fileInfo.innerHTML = infoHTML;
        return true;
    }
}

// ===== MODAL DE VISUALIZACIÓN DE MEDIA =====
function openMediaModal(resourceId, type) {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    const modal = document.getElementById('mediaModal');
    const mediaContainer = document.getElementById('media-container');
    const mediaTitle = document.getElementById('media-title');
    const mediaDescription = document.getElementById('media-description');

    mediaTitle.textContent = resource.titulo;
    mediaDescription.textContent = resource.descripcion || 'Sin descripción';

    if (type === 'image') {
        mediaContainer.innerHTML = `<img src="${resource.url}" alt="${resource.titulo}" style="max-width: 100%; max-height: 70vh; object-fit: contain;">`;
    } else if (type === 'video') {
        mediaContainer.innerHTML = `
            <video controls style="max-width: 100%; max-height: 70vh;">
                <source src="${resource.url}" type="video/mp4">
                Tu navegador no soporta video HTML5.
            </video>
        `;
    }

    modal.classList.add('active');
}

function closeMediaModal() {
    document.getElementById('mediaModal').classList.remove('active');
}

// ===== DESCARGAR MEDIA =====
function downloadMedia(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'descarga';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showNotification('✅ Descarga iniciada', 'success');
}
function validarTamanoArchivoResource() {
    const archivoInput = document.getElementById('resource-archivo');
    const fileInfo = document.getElementById('file-info-resource');
    
    if (!archivoInput.files[0]) {
        fileInfo.innerHTML = '';
        return;
    }

    const file = archivoInput.files[0];
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    
    let maxSize = isVideo ? MAX_SIZE_VIDEO : MAX_SIZE_IMAGE;
    let maxSizeMB = isVideo ? 30 : 10;
    let tipo = isVideo ? 'Video' : 'Imagen';

    // Mostrar información del archivo
    let infoHTML = `📁 ${file.name} (${sizeMB} MB)`;
    
    if (file.size > maxSize) {
        // ❌ ARCHIVO DEMASIADO GRANDE
        infoHTML += `<br><span style="color: #d32f2f; font-weight: bold;">❌ ERROR: El ${tipo.toLowerCase()} es demasiado grande</span>`;
        infoHTML += `<br><span style="color: #d32f2f;">Máximo permitido: ${maxSizeMB} MB</span>`;
        fileInfo.innerHTML = infoHTML;
        archivoInput.value = ''; // Limpiar input
        return false;
    } else {
        // ✅ ARCHIVO VÁLIDO
        infoHTML += `<br><span style="color: #388e3c; font-weight: bold;">✅ ${tipo} válido (Máximo: ${maxSizeMB} MB)</span>`;
        fileInfo.innerHTML = infoHTML;
        return true;
    }
}

// ===== CAMBIAR TIPO DE ALMACENAMIENTO =====
function cambiarTipoStorage() {
    const selectedStorage = document.querySelector('input[name="storage-type"]:checked').value;
    storageType = selectedStorage;
    
    const tipoNombre = selectedStorage === 'local' ? '💾 Local' : '☁️ Cloudinary';
    showNotification(`Almacenamiento cambiado a: ${tipoNombre}`, 'info');
}

function editCrudResource(id) {
    const resource = resources.find(r => r.id === id);
    if (!resource) return;

    editingResourceId = id;
    document.getElementById('crud-modal-title').textContent = 'Editar Recurso';
    document.getElementById('crud-tipo').value = resource.tipo;
    document.getElementById('crud-titulo').value = resource.titulo;
    document.getElementById('crud-descripcion').value = resource.descripcion || '';
    document.getElementById('crud-url').value = resource.url;
    document.getElementById('crud-autor').value = resource.autor || '';

    document.getElementById('crudModal').classList.add('active');
}

async function saveCrudResource(e) {
    e.preventDefault();

    const archivoInput = document.getElementById('crud-archivo');
    const tipoSelect = document.getElementById('crud-tipo');
    const tituloInput = document.getElementById('crud-titulo');
    const descripcionInput = document.getElementById('crud-descripcion');
    const urlInput = document.getElementById('crud-url');
    const autorInput = document.getElementById('crud-autor');

    // Validar que se proporcione archivo o URL
    if (!archivoInput.files[0] && !urlInput.value) {
        showNotification('⚠️ Debes proporcionar un archivo o una URL', 'error');
        return;
    }

    // Validar tamaño de archivo si se proporciona
    if (archivoInput.files[0]) {
        if (!validarTamanoArchivo()) {
            showNotification('❌ El archivo excede el tamaño máximo permitido', 'error');
            return;
        }
    }

    try {
        if (editingResourceId) {
            // Actualizar recurso existente
            const resourceData = {
                tipo: tipoSelect.value,
                titulo: tituloInput.value,
                descripcion: descripcionInput.value,
                url: urlInput.value,
                autor: autorInput.value,
            };

            const response = await fetch(`${API_URL}/recursos/${editingResourceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resourceData)
            });

            if (!response.ok) throw new Error('Error al actualizar');

            const index = resources.findIndex(r => r.id === editingResourceId);
            if (index !== -1) {
                resources[index] = { ...resources[index], ...resourceData };
            }
            showNotification('✅ Recurso actualizado exitosamente');
        } else {
            // Crear nuevo recurso
            if (archivoInput.files[0]) {
                // Subir archivo (local o Cloudinary según selección)
                const endpoint = storageType === 'cloudinary' ? `${API_URL}/upload` : `${API_URL}/upload-local`;
                const tipoDeSe = storageType === 'cloudinary' ? '☁️ Cloudinary' : '💾 Local';
                
                showNotification(`⏳ Subiendo archivo a ${tipoDeSe}...`, 'info');
                
                const formData = new FormData();
                formData.append('file', archivoInput.files[0]);
                formData.append('tipo', tipoSelect.value);
                formData.append('titulo', tituloInput.value);
                formData.append('descripcion', descripcionInput.value);
                formData.append('autor', autorInput.value);

                const response = await fetch(endpoint, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || `Error al subir archivo a ${tipoDeSe}`);
                }

                const newResource = await response.json();
                resources.push(newResource);
                showNotification(`✅ ¡Archivo subido a ${tipoDeSe} exitosamente! Recurso creado.`, 'success');
            } else {
                // Crear con URL solamente
                const resourceData = {
                    tipo: tipoSelect.value,
                    titulo: tituloInput.value,
                    descripcion: descripcionInput.value,
                    url: urlInput.value,
                    autor: autorInput.value,
                };

                const response = await fetch(`${API_URL}/recursos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(resourceData)
                });

                if (!response.ok) throw new Error('Error al crear');

                const newResource = await response.json();
                resources.push(newResource);
                showNotification('✅ Recurso agregado exitosamente');
            }
        }

        closeCrudModal();
        renderCrudTable();
        updateStats();
        renderRecentResources();
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ ' + (error.message || 'Error al guardar recurso'), 'error');
    }
}

// ===== ELIMINAR RECURSO =====
async function deleteResource(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este recurso?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/recursos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar');

        resources = resources.filter(r => r.id !== id);
        showNotification('Recurso eliminado');

        // Re-renderizar sección activa
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection) {
            navigateToSection(activeSection.id);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar recurso', 'error');
    }
}

// ===== CONFIGURACIÓN =====
function renderConfiguration() {
    const statsInfo = document.getElementById('stats-info');
    const total = resources.length;
    const byType = {
        pdf: resources.filter(r => r.tipo === 'pdf').length,
        guias: resources.filter(r => r.tipo === 'guias').length,
        videos: resources.filter(r => r.tipo === 'videos').length,
        enlaces: resources.filter(r => r.tipo === 'enlaces').length,
    };

    statsInfo.innerHTML = `
        <p><strong>Total de Recursos:</strong> ${total}</p>
        <p><strong>PDFs:</strong> ${byType.pdf}</p>
        <p><strong>Guías:</strong> ${byType.guias}</p>
        <p><strong>Videos:</strong> ${byType.videos}</p>
        <p><strong>Enlaces:</strong> ${byType.enlaces}</p>
        <p style="font-size: 12px; color: #666; margin-top: 16px;">
            Última actualización: ${new Date().toLocaleDateString('es-ES')}
        </p>
    `;
}

async function exportData() {
    try {
        const response = await fetch(`${API_URL}/recursos`);
        const data = await response.json();

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            resources: data,
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grupo-e-recursos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Datos exportados exitosamente');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al exportar datos', 'error');
    }
}

function importData() {
    const fileInput = document.getElementById('importFile');
    fileInput.click();

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.resources && Array.isArray(data.resources)) {
                    if (confirm('¿Deseas importar estos recursos?')) {
                        // Aquí simplemente cargamos los datos nuevamente
                        showNotification('Datos importados. Cargando recursos...');
                        await loadResources();
                        renderDashboard();
                    }
                }
            } catch (error) {
                showNotification('Error al importar archivo', 'error');
            }
        };
        reader.readAsText(file);
    }, { once: true });
}

async function clearAllData() {
    if (!confirm('⚠️ ¿Estás seguro? Esto elimará TODOS los recursos. No se puede deshacer.')) {
        return;
    }

    if (!confirm('Segunda confirmación: ¿Realmente deseas eliminar todo?')) {
        return;
    }

    try {
        // Eliminar cada recurso
        for (const resource of resources) {
            await fetch(`${API_URL}/recursos/${resource.id}`, {
                method: 'DELETE'
            });
        }

        resources = [];
        navigateToSection('dashboard');
        showNotification('Todos los datos han sido eliminados');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar datos', 'error');
    }
}

// ===== UTILIDADES =====
function getTypeName(type) {
    const names = {
        pdf: 'Material PDF',
        guias: 'Guía',
        videos: 'Video',
        enlaces: 'Enlace',
    };
    return names[type] || type;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background-color: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 2000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
