# U•link — Plataforma Social ECI

> Plataforma social universitaria diseñada exclusivamente para la comunidad de la **Escuela Colombiana de Ingeniería Julio Garavito**.

---

## ¿Qué es U•link?

U•link es una red social privada y verificada para estudiantes de la ECI. Integra comunicación en tiempo real, inteligencia artificial, gamificación y bienestar estudiantil en un solo lugar. El acceso es exclusivo mediante correo institucional `@mail.escuelaing.edu.co`, verificado con código OTP al momento del registro.

---

## Funcionalidades principales

| Módulo | Descripción |
|---|---|
| **Landing Page** | Página de inicio con hero dinámico, galería de la comunidad ECI, sección de funcionalidades y pasos de onboarding |
| **Registro con OTP** | Flujo de 4 pasos: verificación de correo vía código OTP → datos básicos → perfil académico → intereses. Validación de campos obligatorios en cada paso |
| **Parches** | Grupos de interés con chat en tiempo real, lienzo colaborativo (canvas con pluma, borrador, paleta de colores), voz grupal, juego de Parqués integrado y vinculación con eventos |
| **Matching IA** | Algoritmo de compatibilidad basado en carrera, semestre e intereses. Tarjetas de match con porcentaje de compatibilidad |
| **Eventos** | Creación de eventos con emoji, fecha y opción de vincularlos a parches. Los eventos vinculados aparecen como notificación en el chat del parche |
| **Bienestar 24/7** | Chatbot de apoyo emocional, diario con IA, ejercicios de respiración guiada y reproductor de sonidos de relajación (lluvia, bosque, olas, ruido blanco/marrón) |
| **Álbum de Monas** | 13 personajes coleccionables con 4 rarezas (Común, Rara, Épica, Legendaria). Sistema de raspado real con canvas: toca la tarjeta → popup de revelación → raspa para desbloquear. Dos páginas de álbum estilo Panini con navegación |
| **Chats** | Mensajería directa entre estudiantes con historial y soporte de archivos |
| **Perfil** | Perfil personalizable con foto, intereses, carrera, semestre, nivel ECI y sistema de XP |
| **Ajustes** | Modo oscuro/claro, accesibilidad visual (daltonismo, modo dislexia), notificaciones y privacidad |

---

## Branding

| | |
|---|---|
| **Nombre** | U•link |
| **Logo modo oscuro** | `src/assets/logoNuevoOscuro.png` |
| **Logo modo claro** | `src/assets/logoNuevoClaro.png` |
| **Mascota** | Mono Patricia (`src/assets/monoPATRICIA.png`) |
| **Colores principales** | `#6C63FF` (púrpura), `#7FE7C4` (verde agua), `#FFB347` (ámbar) |

---

## Tecnologías

- **React 18** + **TypeScript**
- **Vite 6** — bundler y dev server
- **Tailwind CSS v4** — estilos con `@tailwindcss/vite`
- **motion/react** — animaciones fluidas (spring, AnimatePresence)
- **HTML5 Canvas API** — lienzo colaborativo y mecánica de raspado de monas
- **lucide-react** — iconografía
- **Radix UI** — componentes accesibles base
- **HTML5 Audio API** — reproductor de sonidos de bienestar

---

## Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

El servidor de desarrollo corre en `http://localhost:5173` por defecto.

---

## Estructura del proyecto

```
src/
├── assets/          # Imágenes (logos, monas), audios y recursos estáticos
├── components/      # Componentes reutilizables
│   ├── AnimatedBackground.tsx
│   ├── ColorAccessibility.tsx
│   ├── ImageWithFallback.tsx
│   ├── InteresesPicker.tsx
│   ├── ParquesBoard.tsx
│   └── ToastSystem.tsx
├── pages/           # Vistas principales
│   ├── LandingPage.tsx
│   ├── LoginView.tsx
│   ├── RegisterView.tsx
│   ├── HomeView.tsx
│   ├── MatchingView.tsx
│   ├── ParchesView.tsx
│   ├── EventosView.tsx
│   ├── ChatsView.tsx
│   ├── BienestarView.tsx
│   ├── ProfileView.tsx
│   └── AjustesView (en App.tsx)
├── store/           # Contextos globales (ThemeContext)
├── utils/           # Utilidades e internacionalización
└── App.tsx          # Raíz de la app, AlbumView, ScratchCanvas y enrutamiento
```

---

## Integrantes

| Nombre |
|---|
| Julián David Castiblanco |
| Karol Estefany Estupiñán |
| Tomás Felipe Ramírez |
| Juan Pablo Contreras |
| Mariana Malagón Tochoy |
| Juan Carlos Leal |

---

## Institución

**Escuela Colombiana de Ingeniería Julio Garavito**  
Proyecto académico · 2026
