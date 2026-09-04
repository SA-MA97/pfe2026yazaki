// ================================================================
// YAZAKI — Utilitaire de Validation des Formulaires
// ================================================================

// Regex
const ONLY_LETTERS_SPACES = /^[a-zA-ZÀ-ÿ\s\-']+$/;
const ALPHANUMERIC_UNDERSCORE = /^[a-zA-Z0-9_\-]+$/;

// ---- Helpers ----
export function required(value, fieldName = 'Ce champ') {
  if (!value || String(value).trim() === '') return `${fieldName} est obligatoire.`;
  return null;
}

export function minLength(value, min, fieldName = 'Ce champ') {
  if (value && String(value).trim().length < min) return `${fieldName} doit contenir au moins ${min} caractères.`;
  return null;
}

export function maxLength(value, max, fieldName = 'Ce champ') {
  if (value && String(value).trim().length > max) return `${fieldName} ne doit pas dépasser ${max} caractères.`;
  return null;
}

export function onlyLetters(value, fieldName = 'Ce champ') {
  if (value && !ONLY_LETTERS_SPACES.test(value)) return `${fieldName} ne doit contenir que des lettres et espaces.`;
  return null;
}

export function alphanumeric(value, fieldName = 'Ce champ') {
  if (value && !ALPHANUMERIC_UNDERSCORE.test(value)) return `${fieldName} ne doit contenir que des lettres, chiffres, tirets ou underscores (sans espaces).`;
  return null;
}

export function onlyNumbers(value, fieldName = 'Ce champ') {
  if (value && !/^\d+$/.test(value)) return `${fieldName} ne doit contenir que des chiffres.`;
  return null;
}

// Latitude Bizerte governorate (36.7 – 37.5)
export function validateLatitude(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return 'La latitude doit être un nombre décimal (ex: 37.2746).';
  if (n < 36.7 || n > 37.5) return 'La latitude doit être comprise entre 36.7 et 37.5 (gouvernorat de Bizerte).';
  return null;
}

// Longitude Bizerte governorate (9.3 – 10.5)
export function validateLongitude(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return 'La longitude doit être un nombre décimal (ex: 9.8739).';
  if (n < 9.3 || n > 10.5) return 'La longitude doit être comprise entre 9.3 et 10.5 (gouvernorat de Bizerte).';
  return null;
}

// Time format HH:MM
export function validateTime(value, fieldName = 'L\'heure') {
  if (!value) return `${fieldName} est obligatoire.`;
  if (!/^\d{2}:\d{2}$/.test(value)) return `${fieldName} doit être au format HH:MM.`;
  return null;
}

export function validateArrivalLogic(heure_depart, heure_arrivee) {
  if (!heure_depart || !heure_arrivee) return null;
  const [dh, dm] = heure_depart.split(':').map(Number);
  const [ah, am] = heure_arrivee.split(':').map(Number);
  const departMins = dh * 60 + dm;
  const arrivalMins = ah * 60 + am;
  
  let diff = arrivalMins - departMins;
  
  // S'il est arrivé avec plus de 12 heures "d'avance", c'est sûrement un shift de nuit (ex: shift 23:00, arrivée 01:00)
  if (diff < -720) {
    diff += 1440;
  }
  
  // S'il est arrivé plus de 2 heures en avance
  if (diff < -120) return 'Attention : Le bus est arrivé plus de 2 heures en avance. Vérifiez les données.';
  
  // S'il est arrivé plus de 4 heures en retard
  if (diff > 240) return 'Attention : Le retard dépasse 4 heures. Vérifiez les données.';
  
  return null;
}

// Run an array of validators and return first error
export function validate(...validators) {
  for (const v of validators) {
    if (v) return v;
  }
  return null;
}

// Validate all fields and return errors object
export function validateForm(rules) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    const error = validate(...validators);
    if (error) errors[field] = error;
  }
  return errors;
}

// Check if errors object is empty (form is valid)
export function isFormValid(errors) {
  return Object.keys(errors).length === 0;
}
