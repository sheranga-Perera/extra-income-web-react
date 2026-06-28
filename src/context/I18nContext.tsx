import React, { createContext, useContext, useMemo, useState } from 'react';

type Language = 'en' | 'si' | 'ta';

type Translations = Record<string, Record<Language, string>>;

const translations: Translations = {
  appName: {
    en: 'Extra Income',
    si: 'අතිරේක ආදායම',
    ta: 'கூடுதல் வருமானம்'
  },
  homeEyebrow: {
    en: 'Part-time work marketplace',
    si: 'අර්ධකාලීන රැකියා වෙළඳපොළ',
    ta: 'பகுதி நேர வேலை சந்தை'
  },
  homeHeadline: {
    en: 'Find flexible work that fits your time',
    si: 'ඔබගේ කාලයට ගැළපෙන නම්‍ය වැඩ සොයන්න',
    ta: 'உங்கள் நேரத்திற்கு பொருந்தும் நெகிழ்வான வேலைகளை கண்டுபிடியுங்கள்'
  },
  homeBody: {
    en: 'A trusted Sri Lankan platform for job seekers and job providers to connect for part-time work.',
    si: 'ශ්‍රී ලංකාවේ රැකියා සොයන්නන් සහ රැකියා සැපයුම්කරුවන් අර්ධකාලීන වැඩ සඳහා සම්බන්ධ කරන විශ්වාසනීය වේදිකාවක්.',
    ta: 'இலங்கையின் வேலை தேடுபவர்களுக்கும் வேலை வழங்குநர்களுக்கும் பகுதி நேர வேலைகளை இணைக்கும் நம்பகமான தளம்.'
  },
  'I am a': {
    en: 'I am a',
    si: 'මම',
    ta: 'நான்'
  },
  chooseAccountType: {
    en: 'Choose how you want to use Extra Income',
    si: 'Extra Income භාවිත කරන ආකාරය තෝරන්න',
    ta: 'Extra Income ஐ எப்படி பயன்படுத்த வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்'
  },
  welcomeBack: {
    en: 'Welcome back',
    si: 'නැවත සාදරයෙන් පිළිගනිමු',
    ta: 'மீண்டும் வருக'
  },
  browseJobs: {
    en: 'Browse Jobs',
    si: 'රැකියා බලන්න',
    ta: 'வேலைகளை பார்க்க'
  },
  findPeople: {
    en: 'Find People',
    si: 'පුද්ගලයින් සොයන්න',
    ta: 'நபர்களைக் கண்டுபிடி'
  },
  findWork: {
    en: 'Find work',
    si: 'වැඩ සොයන්න',
    ta: 'வேலை தேடு'
  },
  postJobs: {
    en: 'Post jobs',
    si: 'රැකියා පළ කරන්න',
    ta: 'வேலைகளை இடுகையிடு'
  },
  howItWorks: {
    en: 'How it works',
    si: 'ක්‍රියා කරන ආකාරය',
    ta: 'இது எப்படி செயல்படுகிறது'
  },
  createProfile: {
    en: 'Create a profile',
    si: 'පැතිකඩක් සාදන්න',
    ta: 'சுயவிவரம் உருவாக்கவும்'
  },
  createProfileText: {
    en: 'Tell employers or workers what you offer and where you are available.',
    si: 'ඔබ ලබාදෙන දේ සහ ලබාගත හැකි ස්ථානය සේවායෝජකයන්ට හෝ සේවකයන්ට දන්වන්න.',
    ta: 'நீங்கள் வழங்குவது மற்றும் கிடைக்கும் இடத்தை வேலை வழங்குநர்களுக்கும் பணியாளர்களுக்கும் தெரிவிக்கவும்.'
  },
  connect: {
    en: 'Connect locally',
    si: 'දේශීයව සම්බන්ධ වන්න',
    ta: 'உள்ளூரில் இணைக'
  },
  connectText: {
    en: 'Search jobs, discover workers, and keep the conversation focused.',
    si: 'රැකියා සොයන්න, සේවකයන් සොයාගන්න, සංවාදය පැහැදිලිව තබාගන්න.',
    ta: 'வேலைகளைத் தேடுங்கள், பணியாளர்களைக் கண்டறியுங்கள், உரையாடலை தெளிவாக வைத்திருங்கள்.'
  },
  startWorking: {
    en: 'Start working',
    si: 'වැඩ ආරම්භ කරන්න',
    ta: 'வேலை தொடங்குங்கள்'
  },
  startWorkingText: {
    en: 'Agree on the role, time, and pay before starting the job.',
    si: 'වැඩ ආරම්භ කිරීමට පෙර භූමිකාව, කාලය සහ ගෙවීම එකඟ කරගන්න.',
    ta: 'வேலை தொடங்குவதற்கு முன் பங்கு, நேரம், சம்பளம் ஆகியவற்றில் ஒப்புக்கொள்ளுங்கள்.'
  },
  login: { en: 'Login', si: 'ප්‍රවේශය', ta: 'உள்நுழை' },
  register: { en: 'Register', si: 'ලියාපදිංචි වන්න', ta: 'பதிவு' },
  profile: { en: 'Profile', si: 'පැතිකඩ', ta: 'சுயவிவரம்' },
  logout: { en: 'Logout', si: 'පිටවීම', ta: 'வெளியேறு' },
  username: { en: 'Username', si: 'පරිශීලක නාමය', ta: 'பயனர் பெயர்' },
  password: { en: 'Password', si: 'මුරපදය', ta: 'கடவுச்சொல்' },
  identifier: { en: 'Identifier Type', si: 'හඳුනාගැනීමේ වර්ගය', ta: 'அடையாள வகை' },
  role: { en: 'Account Type', si: 'ගිණුමේ වර්ගය', ta: 'கணக்கு வகை' },
  individual: { en: 'Job Seeker', si: 'රැකියා සොයන්නා', ta: 'வேலை தேடுபவர்' },
  company: { en: 'Job Provider', si: 'රැකියා සැපයුම්කරු', ta: 'வேலை வழங்குநர்' },
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
