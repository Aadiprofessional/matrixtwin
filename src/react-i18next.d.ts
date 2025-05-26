import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    // Disable typescript checking for translations
    defaultNS: 'ns1';
    resources: {
      ns1: {
        [key: string]: string;
      };
    };
  }
} 