import { en, validationEn } from './locales/en';
import { ar, validationAr } from './locales/ar';

// Build ErrorMessages by combining en and ar locales
type ErrorMessageKeys = keyof typeof en;
type BilingualMessage = { en: string; ar: string };

export const ErrorMessages: Record<ErrorMessageKeys, BilingualMessage> = (
  Object.keys(en) as ErrorMessageKeys[]
).reduce(
  (acc, key) => {
    acc[key] = { en: en[key], ar: ar[key] };
    return acc;
  },
  {} as Record<ErrorMessageKeys, BilingualMessage>,
);

// Build ValidationMessages by combining validationEn and validationAr locales
type ValidationMessageKeys = keyof typeof validationEn;

export const ValidationMessages: Record<ValidationMessageKeys, BilingualMessage> = (
  Object.keys(validationEn) as ValidationMessageKeys[]
).reduce(
  (acc, key) => {
    acc[key] = { en: validationEn[key], ar: validationAr[key] };
    return acc;
  },
  {} as Record<ValidationMessageKeys, BilingualMessage>,
);

export type ErrorMessageKey = keyof typeof ErrorMessages;
export type ValidationMessageKey = keyof typeof ValidationMessages;

// Helper function to format messages with parameters
export function formatMessage(
  message: { en: string; ar: string },
  params?: Record<string, string>,
): { en: string; ar: string } {
  if (!params) return message;

  let enMsg = message.en;
  let arMsg = message.ar;

  for (const [key, value] of Object.entries(params)) {
    enMsg = enMsg.replace(`{${key}}`, value);
    arMsg = arMsg.replace(`{${key}}`, value);
  }

  return { en: enMsg, ar: arMsg };
}

// Get bilingual message
export function getErrorMessage(
  key: ErrorMessageKey,
  params?: Record<string, string>,
): { en: string; ar: string } {
  return formatMessage(ErrorMessages[key], params);
}

export function getValidationMessage(
  key: ValidationMessageKey,
): { en: string; ar: string } {
  return ValidationMessages[key];
}
