# PATRICI.A — Plataforma Social ECI

> Plataforma social universitaria diseñada exclusivamente para la comunidad de la **Escuela Colombiana de Ingeniería Julio Garavito**.

---

## ¿Qué es PATRICI.A?

PATRICI.A es una red social privada y verificada para estudiantes de la ECI. Integra comunicación en tiempo real, inteligencia artificial, gamificación y bienestar estudiantil en un solo lugar. Solo accesible con correo institucional `@mail.escuelaing.edu.co`.

---

## Funcionalidades principales

| Módulo | Descripción |
|---|---|
| **Parches** | Grupos de interés con chat, voz, lienzo colaborativo y juegos integrados (Parqués) |
| **Matching** | Algoritmo de compatibilidad basado en intereses académicos y personales |
| **Bienestar 24/7** | Chatbot de apoyo emocional, diario con IA, respiración guiada y sonidos de relajación |
| **Álbum de Monas** | 12 personajes coleccionables con 4 rarezas. Gana XP participando en la comunidad |
| **Eventos** | Hackathones, charlas, torneos y actividades con geolocalización en tiempo real |
| **Chats privados** | Mensajería directa entre estudiantes con matches |
| **Perfil** | Perfil personalizable con intereses, nivel ECI y ranking |

---

## Tecnologías

- **React 18** + **TypeScript**
- **Vite 6** — bundler y dev server
- **Tailwind CSS v4** — estilos con `@tailwindcss/vite`
- **motion/react** — animaciones fluidas
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
├── assets/          # Imágenes, audios y recursos estáticos
├── components/      # Componentes reutilizables (AnimatedBackground, ToastSystem, ParquesBoard, ...)
├── pages/           # Vistas principales (LandingPage, HomeView, ParchesView, BienestarView, ...)
├── store/           # Contextos globales (ThemeContext, LanguageContext)
├── utils/           # Utilidades e internacionalización
└── App.tsx          # Raíz de la aplicación y enrutamiento de vistas
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
