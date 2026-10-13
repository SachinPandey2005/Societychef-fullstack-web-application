/**
 * i18n Translation Dictionary
 */
export const translations = {
  en: {
    welcome: 'Welcome Back',
    online: 'Go Online',
    offline: 'Go Offline',
    orders: 'Orders',
    wallet: 'Wallet',
    support: 'Support',
    profile: 'Profile',
    sos: 'EMERGENCY SOS',
  },
  hi: {
    welcome: 'आपका स्वागत है',
    online: 'ऑनलाइन जाएँ',
    offline: 'ऑफलाइन जाएँ',
    orders: 'ऑर्डर',
    wallet: 'बटुआ',
    support: 'सहायता',
    profile: 'प्रोफाइल',
    sos: 'आपातकालीन सहायता',
  },
  kn: {
    welcome: 'ಸ್ವಾಗತ',
    online: 'ಆನ್‌ಲೈನ್‌ಗೆ ಹೋಗಿ',
    offline: 'ಆಫ್‌ಲೈನ್‌ಗೆ ಹೋಗಿ',
    orders: 'ಆರ್ಡರ್‌ಗಳು',
    wallet: 'ಪರ್ಸ್',
    support: 'ಬೆಂಬಲ',
    profile: 'ಪ್ರೊಫೈಲ್',
    sos: 'ತುರ್ತು ಸಹಾಯ',
  },
  ta: {
    welcome: 'வரவேற்பு',
    online: 'ஆன்லைனில் செல்லுங்கள்',
    offline: 'ஆஃப்லைனில் செல்லுங்கள்',
    orders: 'ஆர்டர்கள்',
    wallet: 'பணப்பை',
    support: 'ஆதரவு',
    profile: 'சுயவிவரம்',
    sos: 'அவசர உதவி',
  },
};

export const translate = (key: keyof typeof translations.en, lang: 'en' | 'hi' | 'kn' | 'ta' = 'en'): string => {
  return translations[lang][key] || translations.en[key];
};

export default translate;
