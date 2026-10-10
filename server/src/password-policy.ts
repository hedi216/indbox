// Shared by the API and browser. Login accepts existing passwords unchanged.
export const passwordRules = [
  { label: "12 caractères minimum", test: (v: string) => v.length >= 12 },
  { label: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Une minuscule", test: (v: string) => /[a-z]/.test(v) },
  { label: "Un chiffre", test: (v: string) => /[0-9]/.test(v) },
  {
    label: "Un caractère spécial",
    test: (v: string) => /[^A-Za-z0-9\s]/.test(v),
  },
  {
    label: "72 octets maximum",
    test: (v: string) => new TextEncoder().encode(v).length <= 72,
  },
];
export const validPassword = (value: string) =>
  passwordRules.every((rule) => rule.test(value));
