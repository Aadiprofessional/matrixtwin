import 'i18next';

// Simplified type declaration to fix TypeScript errors
declare module 'i18next' {
  interface TFunction {
    // Override the t function to accept any string key
    (key: string, options?: any): string;
    (key: string, defaultValue: string, options?: any): string;
  }
}

declare module 'react-i18next' {
  export interface UseTranslationResponse {
    t: TFunction;
    i18n: i18next.i18n;
    ready: boolean;
  }
} 