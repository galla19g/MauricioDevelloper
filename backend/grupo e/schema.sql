-- ===== CREAR TABLA DE RECURSOS =====
CREATE TABLE IF NOT EXISTS recursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('pdf', 'guias', 'videos', 'enlaces') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    url VARCHAR(500) NOT NULL,
    url_cloudinary VARCHAR(500),
    public_id VARCHAR(255),
    storage_type ENUM('local', 'cloudinary', 'url') DEFAULT 'url',
    autor VARCHAR(150),
    etiquetas VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tipo (tipo),
    INDEX idx_titulo (titulo),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== INSERTAR DATOS DE EJEMPLO =====
INSERT INTO recursos (tipo, titulo, descripcion, url, autor, etiquetas) VALUES
('pdf', 'Guía JavaScript ES6', 'Introducción a características modernas de JavaScript', '#', 'Grupo E', 'javascript,web,programación'),
('guias', 'Metodología Ágil', 'Guía práctica sobre desarrollo ágil', '#', 'Grupo E', 'agile,metodología,gestión'),
('videos', 'Tutorial React Hooks', 'Series de videos sobre React y Hooks', '#', 'Grupo E', 'react,hooks,frontend'),
('enlaces', 'Documentación MDN', 'Referencia oficial de tecnologías web', 'https://developer.mozilla.org', 'Mozilla', 'documentación,referencia,web');
