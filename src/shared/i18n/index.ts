import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import uz from './locales/uz.json';
import kaa from './locales/kaa.json';

export const SUPPORTED_LANGUAGES = ['ru', 'uz', 'kaa'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'exam.lang';

const detectInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'ru';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
    return stored as Language;
  }
  return 'ru';
};

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    uz: { translation: uz },
    kaa: { translation: kaa },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export const setLanguage = (lang: Language): void => {
  void i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
};

export default i18n;
