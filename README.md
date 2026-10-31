# 📲 QR Attendance PWA — Sistema de Control y Registro de Asistencias

> Aplicación web progresiva (**PWA**) diseñada para el registro ágil de asistencias en tiempo real mediante **escáner de códigos QR** con cámara móvil y PC, persistencia local y panel administrativo.

---

## 🚀 Características Principales

- 📷 **Escáner QR en Tiempo Real:** Integración nativa con `html5-qrcode` para lectura instantánea de credenciales y pases digitales.
- 📱 **Progressive Web App (PWA):** Interfaz adaptativa, ligera y optimizada para uso en smartphones, tablets o navegadores de escritorio.
- 👥 **Gestión Modular de Equipos:** Organización por grupos de trabajo, ramas operativas y miembros con estado activo/inactivo.
- 📊 **Panel Administrativo & Reportes:** Métricas de puntualidad, control de metas mensuales y visualización consolidada de asistencias.
- 💾 **Persistencia Offline-First:** Capa de almacenamiento desacoplada con operaciones CRUD sobre `localStorage` (sin dependencias externas de backend requeridas para operación local).

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 19, React Router DOM v7
- **Bundler & Tooling:** Vite, Oxlint
- **Lector & Generador QR:** `html5-qrcode`, `qrcode.react`
- **Estilos:** CSS3 responsive mobile-first

---

## 💻 Instalación y Uso Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/lincoln-vega/QR-Attendance-PWA.git

# 2. Ingresar al directorio
cd QR-Attendance-PWA

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```

### Credenciales de Demostración (Panel Admin):
* **Usuario:** `admin`
* **Contraseña:** `admin123`

---

## 👤 Autor

**Lincoln Vega Hidalgo**  
- **LinkedIn:** [linkedin.com/in/lincoln-vega-hidalgo-09a0a0165](https://linkedin.com/in/lincoln-vega-hidalgo-09a0a0165)  
- **GitHub:** [@lincoln-vega](https://github.com/lincoln-vega)  
- **Portafolio:** [portafolio-psi-neon-82.vercel.app](https://portafolio-psi-neon-82.vercel.app/)
