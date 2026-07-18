import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Define translations directly here for now to keep it simple,
// we can move them to JSON files later if they get too large.
const resources = {
  es: {
    translation: {
      nav: {
        home: 'Inicio',
        matches: 'Matches',
        chats: 'Chats',
        parches: 'Parches',
        events: 'Eventos',
        settings: 'Ajustes',
        admin: 'Admin'
      },
      settings: {
        language: 'Idioma',
        language_desc: 'Elige el idioma de la aplicación (beta)',
        spanish: 'Español',
        english: 'English',
        french: 'Français',
        session: 'Sesión y cuenta',
        logout: 'Cerrar sesión',
        delete_account: 'Eliminar cuenta',
        notifications: 'Notificaciones',
        notif_matches: 'Nuevos matches',
        notif_matches_desc: 'Alertas cuando alguien te da match',
        notif_parches: 'Mensajes de parches',
        notif_parches_desc: 'Avisos de chats no leídos',
        notif_events: 'Eventos cercanos',
        notif_events_desc: 'Recordatorios de eventos próximos',
        about: 'Sobre U•link',
        version: 'Versión',
        institution: 'Institución',
        support: 'Soporte',
        terms: 'Términos de uso',
        privacy: 'Política de privacidad',
        help_center: 'Centro de ayuda',
        accessibility: 'Accesibilidad',
        color: 'Color',
        normal_mode: 'Modo normal',
        daltonian_mode: 'Modo daltónico',
        high_contrast: 'Alto contraste',
        dyslexia: 'Dislexia',
        dyslexia_desc: 'Tipografía especial para facilitar la lectura',
        recover_banner_title: 'Tu cuenta se eliminará pronto',
        recover_banner_desc: 'Pediste eliminarla — todavía estás dentro de las 24 horas de gracia. Puedes recuperarla ahora.',
        recover_btn: 'Recuperar cuenta',
        recovering_btn: 'Recuperando…',
        delete_confirm_title: '¿Eliminar tu cuenta?',
        delete_confirm_desc: 'Tienes 24 horas para recuperar tu cuenta antes de que se borre. Pasado ese tiempo, el borrado es permanente y no se puede deshacer.',
        cancel: 'Cancelar',
        yes_delete: 'Sí, eliminar',
        processing: 'Procesando…',
        privacidad: 'Privacidad',
        notifs: 'Notifs',
        mas: 'Más'
      }
    }
  },
  en: {
    translation: {
      nav: {
        home: 'Home',
        matches: 'Matches',
        chats: 'Chats',
        parches: 'Groups',
        events: 'Events',
        settings: 'Settings',
        admin: 'Admin'
      },
      settings: {
        language: 'Language',
        language_desc: 'Choose the application language (beta)',
        spanish: 'Español',
        english: 'English',
        french: 'Français',
        session: 'Session & Account',
        logout: 'Log out',
        delete_account: 'Delete account',
        notifications: 'Notifications',
        notif_matches: 'New matches',
        notif_matches_desc: 'Alerts when someone matches with you',
        notif_parches: 'Group messages',
        notif_parches_desc: 'Unread chat notifications',
        notif_events: 'Upcoming events',
        notif_events_desc: 'Reminders for upcoming events',
        about: 'About U•link',
        version: 'Version',
        institution: 'Institution',
        support: 'Support',
        terms: 'Terms of Use',
        privacy: 'Privacy Policy',
        help_center: 'Help Center',
        accessibility: 'Accessibility',
        color: 'Color',
        normal_mode: 'Normal mode',
        daltonian_mode: 'Colorblind mode',
        high_contrast: 'High contrast',
        dyslexia: 'Dyslexia',
        dyslexia_desc: 'Special typography for easier reading',
        recover_banner_title: 'Your account will be deleted soon',
        recover_banner_desc: 'You requested to delete it — you are still within the 24-hour grace period. You can recover it now.',
        recover_btn: 'Recover account',
        recovering_btn: 'Recovering…',
        delete_confirm_title: 'Delete your account?',
        delete_confirm_desc: 'You have 24 hours to recover your account before it is deleted. After that time, the deletion is permanent and cannot be undone.',
        cancel: 'Cancel',
        yes_delete: 'Yes, delete',
        processing: 'Processing…',
        privacidad: 'Privacy',
        notifs: 'Notifs',
        mas: 'More'
      }
    }
  },
  fr: {
    translation: {
      nav: {
        home: 'Accueil',
        matches: 'Matchs',
        chats: 'Chats',
        parches: 'Groupes',
        events: 'Événements',
        settings: 'Paramètres',
        admin: 'Admin'
      },
      settings: {
        language: 'Langue',
        language_desc: 'Choisissez la langue de l\'application (bêta)',
        spanish: 'Español',
        english: 'English',
        french: 'Français',
        session: 'Session & Compte',
        logout: 'Se déconnecter',
        delete_account: 'Supprimer le compte',
        notifications: 'Notifications',
        notif_matches: 'Nouveaux matchs',
        notif_matches_desc: 'Alertes lorsque quelqu\'un matche avec vous',
        notif_parches: 'Messages de groupe',
        notif_parches_desc: 'Notifications de chat non lues',
        notif_events: 'Événements à venir',
        notif_events_desc: 'Rappels pour les événements à venir',
        about: 'À propos d\'U•link',
        version: 'Version',
        institution: 'Institution',
        support: 'Support',
        terms: 'Conditions d\'utilisation',
        privacy: 'Politique de confidentialité',
        help_center: 'Centre d\'aide',
        accessibility: 'Accessibilité',
        color: 'Couleur',
        normal_mode: 'Mode normal',
        daltonian_mode: 'Mode daltonien',
        high_contrast: 'Contraste élevé',
        dyslexia: 'Dyslexie',
        dyslexia_desc: 'Typographie spéciale pour faciliter la lecture',
        recover_banner_title: 'Votre compte sera bientôt supprimé',
        recover_banner_desc: 'Vous avez demandé à le supprimer — vous êtes encore dans le délai de grâce de 24 heures. Vous pouvez le récupérer maintenant.',
        recover_btn: 'Récupérer le compte',
        recovering_btn: 'Récupération…',
        delete_confirm_title: 'Supprimer votre compte ?',
        delete_confirm_desc: 'Vous avez 24 heures pour récupérer votre compte avant qu\'il ne soit supprimé. Passé ce délai, la suppression est définitive et ne peut être annulée.',
        cancel: 'Annuler',
        yes_delete: 'Oui, supprimer',
        processing: 'Traitement…',
        privacidad: 'Confidentialité',
        notifs: 'Notifs',
        mas: 'Plus'
      }
    }
  }
};

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('ulink-language') || 'es' : 'es';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
