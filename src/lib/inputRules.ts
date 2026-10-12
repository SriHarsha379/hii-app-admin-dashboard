// Shared input rules for form fields (phone, etc.)
export const digitsMax = (v: string, max = 10): string =>
  (v || '').replace(/\D/g, '').slice(0, max);

export const isPhone10 = (v: string): boolean => /^\d{10}$/.test(v || '');
