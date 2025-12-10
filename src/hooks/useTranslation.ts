// ====================================================================
// L.U.N.A. useTranslation Hook
// ====================================================================
// React hook for accessing translations with AppContext integration
// ====================================================================

import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
    getTranslation,
    languages,
    translations,
    defaultLanguage,
    isValidLanguage,
    SupportedLanguage,
    LanguageInfo,
    TranslationKeys,
} from '../i18n';

// ====================================================================
// Types
// ====================================================================

export interface UseTranslationReturn {
    /** Translation function - get text by key */
    t: (key: string, params?: Record<string, string | number>) => string;
    /** Current language code */
    language: SupportedLanguage;
    /** Current language info */
    languageInfo: LanguageInfo;
    /** All available languages */
    availableLanguages: LanguageInfo[];
    /** Change language */
    setLanguage: (language: SupportedLanguage) => void;
    /** Check if current language is RTL (for future Arabic support) */
    isRTL: boolean;
    /** Full translations object for current language */
    translations: TranslationKeys;
}

// ====================================================================
// Hook
// ====================================================================

export function useTranslation(): UseTranslationReturn {
    const { state, actions } = useApp();
    
    // Get current language from settings, with validation
    const language = useMemo((): SupportedLanguage => {
        const settingsLang = state.settings?.language;
        if (settingsLang && isValidLanguage(settingsLang)) {
            return settingsLang;
        }
        return defaultLanguage;
    }, [state.settings?.language]);
    
    // Translation function
    const t = useCallback(
        (key: string, params?: Record<string, string | number>): string => {
            return getTranslation(language, key, params);
        },
        [language]
    );
    
    // Change language
    const setLanguage = useCallback(
        (newLanguage: SupportedLanguage) => {
            if (isValidLanguage(newLanguage)) {
                actions.updateSettings({ language: newLanguage });
            } else {
                console.error(`[i18n] Invalid language: ${newLanguage}`);
            }
        },
        [actions]
    );
    
    // Get current language info
    const languageInfo = useMemo((): LanguageInfo => {
        return languages[language];
    }, [language]);
    
    // Get all available languages as array
    const availableLanguages = useMemo((): LanguageInfo[] => {
        return Object.values(languages);
    }, []);
    
    // Get current translations
    const currentTranslations = useMemo((): TranslationKeys => {
        return translations[language];
    }, [language]);
    
    return {
        t,
        language,
        languageInfo,
        availableLanguages,
        setLanguage,
        isRTL: false, // Korean, English, Japanese are all LTR
        translations: currentTranslations,
    };
}

// ====================================================================
// Helper Hooks
// ====================================================================

/**
 * Get only the translation function (lighter weight)
 */
export function useT() {
    const { t } = useTranslation();
    return t;
}

/**
 * Get language info without full hook
 */
export function useLanguage() {
    const { language, languageInfo, setLanguage, availableLanguages } = useTranslation();
    return { language, languageInfo, setLanguage, availableLanguages };
}
