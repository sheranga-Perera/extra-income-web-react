import React, { createContext, useContext, useMemo, useState } from 'react';

type Language = 'en' | 'si' | 'ta';

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  appName: {
    en: 'Extra Income',
    si: 'අතිරේක ආදායම',
    ta: 'கூடுதல் வருமானம்'
  },
  homeHeadline: {
    en: 'Find flexible work that fits your time',
    si: 'ඔබගේ කාලයට ගැළපෙන නම්‍ය වැඩ සොයන්න',
    ta: 'உங்கள் நேரத்திற்கு பொருந்தும் நெகிழ்வான வேலைகளை கண்டுபிடியுங்கள்'
  },
  homeBody: {
    en: 'A trusted Sri Lankan platform for individuals and companies to connect for part-time work.',
    si: 'ශ්‍රී ලංකාවේ පුද්ගලයන් සහ සමාගම් සඳහා අර්ධකාලීන වැඩ සම්බන්ධ කිරීම සඳහා විශ්වාසනීය වේදිකාවක්.',
    ta: 'இலங்கையின் தனிநபர்கள் மற்றும் நிறுவனங்களுக்கு பகுதி நேர வேலைகளை இணைக்கும் நம்பகமான தளம்.'
  },
  login: { en: 'Login', si: 'ප්‍රවේශය', ta: 'உள்நுழை' },
  register: { en: 'Register', si: 'ලියාපදිංචි වන්න', ta: 'பதிவு' },
  profile: { en: 'Profile', si: 'පැතිකඩ', ta: 'சுயவிவரம்' },
  logout: { en: 'Logout', si: 'පිටවීම', ta: 'வெளியேறு' },
  username: { en: 'Username', si: 'පරිශීලක නාමය', ta: 'பயனர் பெயர்' },
  password: { en: 'Password', si: 'මුරපදය', ta: 'கடவுச்சொல்' },
  identifier: { en: 'Identifier Type', si: 'හඳුනාගැනීමේ වර්ගය', ta: 'அடையாள வகை' },
  role: { en: 'Account Type', si: 'ගිණුමේ වර්ගය', ta: 'கணக்கு வகை' },
  individual: { en: 'Individual', si: 'පුද්ගල', ta: 'தனி நபர்' },
  company: { en: 'Company', si: 'සමාගම', ta: 'நிறுவனம்' },
  save: { en: 'Save', si: 'සුරකින්න', ta: 'சேமி' },
  fullName: { en: 'Full Name', si: 'සම්පූර්ණ නම', ta: 'முழு பெயர்' },
  phone: { en: 'Phone', si: 'දුරකථන අංකය', ta: 'தொலைபேசி' },
  location: { en: 'Location', si: 'ස්ථානය', ta: 'இடம்' },
  bio: { en: 'Bio', si: 'විස්තරය', ta: 'சுய வரலாறு' },
  companyName: { en: 'Company Name', si: 'සමාගමේ නම', ta: 'நிறுவன பெயர்' },
  registrationNumber: { en: 'Registration Number', si: 'ලියාපදිංචි අංකය', ta: 'பதிவு எண்' },
  contactPerson: { en: 'Contact Person', si: 'සම්බන්ධීකරණ පුද්ගලයා', ta: 'தொடர்பு நபர்' },
  contactEmail: { en: 'Contact Email', si: 'සම්බන්ධ විද්‍යුත් ලිපිනය', ta: 'தொடர்பு மின்னஞ்சல்' },
  address: { en: 'Address', si: 'ලිපිනය', ta: 'முகவரி' },
  website: { en: 'Website', si: 'වෙබ් අඩවිය', ta: 'வலைதளம்' },
  successSaved: { en: 'Profile saved successfully.', si: 'පැතිකඩ සාර්ථකව සුරකින ලදී.', ta: 'சுயவிவரம் வெற்றிகரமாக சேமிக்கப்பட்டது.' }
};

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof typeof translations) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key) => translations[key][language]
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
