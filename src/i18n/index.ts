// ====================================================================
// L.U.N.A. i18n - Internationalization System
// ====================================================================
// Custom lightweight i18n solution for React
// Supports: Korean (ko), English (en), Japanese (ja)
// ====================================================================

import { ko, TranslationKeys } from './locales/ko';
import { en } from './locales/en';
import { ja } from './locales/ja';

// ====================================================================
// Types
// ====================================================================

export type SupportedLanguage = 'ko' | 'en' | 'ja';

export type { TranslationKeys };

// Language metadata
export interface LanguageInfo {
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    flag: string;
}

// ====================================================================
// Constants
// ====================================================================

export const languages: Record<SupportedLanguage, LanguageInfo> = {
    ko: {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        flag: '🇰🇷',
    },
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
    },
    ja: {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
    },
};

export const translations: Record<SupportedLanguage, TranslationKeys> = {
    ko,
    en,
    ja,
};

export const defaultLanguage: SupportedLanguage = 'ko';

// ====================================================================
// Utility Functions
// ====================================================================

/**
 * Get nested value from object using dot notation
 * @example getNestedValue(obj, 'settings.title') => obj.settings.title
 */
function getNestedValue(obj: any, path: string): string | undefined {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[key];
    }
    
    return typeof current === 'string' ? current : undefined;
}

/**
 * Replace placeholders in string
 * @example interpolate('안녕 {name}!', { name: '루나' }) => '안녕 루나!'
 */
function interpolate(text: string, params: Record<string, string | number>): string {
    return text.replace(/\{(\w+)\}/g, (_, key) => {
        return params[key]?.toString() ?? `{${key}}`;
    });
}

/**
 * Check if a language code is supported
 */
export function isValidLanguage(code: string): code is SupportedLanguage {
    return code in translations;
}

/**
 * Get translation for a key
 */
export function getTranslation(
    language: SupportedLanguage,
    key: string,
    params?: Record<string, string | number>
): string {
    const translation = translations[language] || translations[defaultLanguage];
    const value = getNestedValue(translation, key);
    
    if (value === undefined) {
        // Fallback to default language
        const fallback = getNestedValue(translations[defaultLanguage], key);
        if (fallback !== undefined) {
            console.warn(`[i18n] Missing translation for "${key}" in ${language}, using fallback`);
            return params ? interpolate(fallback, params) : fallback;
        }
        
        // Return key as last resort
        console.error(`[i18n] Missing translation key: "${key}"`);
        return key;
    }
    
    return params ? interpolate(value, params) : value;
}

/**
 * Create a translator function for a specific language
 */
export function createTranslator(language: SupportedLanguage) {
    return (key: string, params?: Record<string, string | number>): string => {
        return getTranslation(language, key, params);
    };
}

// ====================================================================
// Exports
// ====================================================================

export { ko, en, ja };
