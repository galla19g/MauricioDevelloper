document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // LÓGICA DE AUTENTICACIÓN (LOGIN) - index.html
    // -----------------------------------------------------------------
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Simulación de validación (el administrador del sistema)
            if (email === 'juan.perez@sicfor.edu' && password === 'admin123') {
                alert('¡Ingreso Exitoso! Redirigiendo a Dashboard...');
                // En un sistema real, se redirigiría a dashboard.html
                window.location.href = 'dashboard.html'; 
            } else {
                alert('Credenciales incorrectas. Inténtalo de nuevo.');
            }
        });

        // Simulación de "Olvidaste tu contraseña"
        const forgotPasswordLink = document.querySelector('.forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Se ha enviado un correo de recuperación a tu dirección. (Proceso de Grupo A)');
            });
        }
    }

    // -----------------------------------------------------------------
    // LÓGICA DE GESTIÓN DE USUARIOS (CRUD SIMULADO) - gestion_usuarios.html
    // -----------------------------------------------------------------

    // Función para simular el botón de Agregar Usuario
    const addBtn = document.querySelector('.btn.primary');
    if (addBtn && addBtn.textContent.includes('Agregar Usuario')) {
        addBtn.addEventListener('click', () => {
            // En un sistema real, se mostraría el modal/formulario
            alert('Activando formulario de "Agregar Nuevo Usuario" (Pantalla en la imagen: WhatsApp Image 2025-11-25 at 6.43.50 PM.jpeg)');
            // Para el ejercicio, se podría simular una redirección al formulario
            // window.location.href = 'agregar_usuario.html';
        });
    }

    // Función para simular las acciones CRUD (Editar/Eliminar)
    const actionButtons = document.querySelectorAll('.action-icons i');
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.classList.contains('edit') ? 'Editar' : 'Eliminar';
            const userId = button.closest('tr').querySelector('.user-id').textContent;
            
            if (action === 'Editar') {
                alert(`Simulación: Abrir formulario para ${action} usuario con ID: ${userId}`);
            } else if (action === 'Eliminar') {
                 // Confirmación de eliminación
                if (confirm(`¿Estás seguro de que deseas ${action} el usuario con ID: ${userId}?`)) {
                    alert(`Simulación: Usuario con ID ${userId} ${action} (Desactivado).`);
                }
            }
        });
    });

    // -----------------------------------------------------------------
    // LÓGICA DE PERFIL (EDICIÓN) - perfil.html
    // -----------------------------------------------------------------
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            alert('Simulación: Habilitar campos del perfil para edición. (GRUPO A: Perfil Propio)');
        });
    }

    // Lógica para cambiar contraseña (debe ser un proceso seguro y aparte)
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            alert('Simulación: Redirigir/Mostrar modal de cambio de contraseña.');
        });
    }

    // -----------------------------------------------------------------
    // LÓGICA DE ROLES - gestion_roles.html
    // -----------------------------------------------------------------
    const createRoleBtn = document.querySelector('.roles-header .btn');
    if (createRoleBtn && createRoleBtn.textContent.includes('Crear Nuevo Rol')) {
        createRoleBtn.addEventListener('click', () => {
            alert('Simulación: Mostrar formulario para Crear Nuevo Rol con permisos.');
        });
    }

    // Lógica de edición/eliminación de Roles (los íconos en los encabezados de rol)
    document.querySelectorAll('.role-list .card .actions i').forEach(icon => {
        icon.addEventListener('click', () => {
            const action = icon.classList.contains('edit') ? 'Editar' : 'Eliminar';
            const roleName = icon.closest('.card').querySelector('h4').textContent;
            
            if (action === 'Eliminar' && roleName !== 'Administrador') {
                 if (confirm(`¿Desea ${action} el rol ${roleName}?`)) {
                    alert(`Simulación: Rol ${roleName} ${action} del sistema.`);
                }
            } else if (action === 'Editar') {
                 alert(`Simulación: Abrir interfaz para ${action} permisos del rol ${roleName}.`);
            } else if (action === 'Eliminar' && roleName === 'Administrador') {
                alert('Error: No se puede eliminar el rol principal "Administrador".');
            }
        });
    });

});

// Función para simular el Logout (Añadir a la barra superior en layout_base.html)
function logout() {
    alert('Cerrando sesión. Redirigiendo a Login...');
    window.location.href = 'index.html'; 
}