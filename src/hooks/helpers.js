/* ================================
   STRING HELPERS
================================ */

// Capitalize first letter of each word
export const capitalizeWords = (text = "") =>
  text.replace(/\b\w/g, (c) => c.toUpperCase());

// Capitalize only first letter
export const capitalizeFirst = (text = "") =>
  text.charAt(0).toUpperCase() + text.slice(1);

// Convert to kebab-case
export const toKebabCase = (text = "") =>
  text.toLowerCase().trim().replace(/\s+/g, "-");

// Convert to camelCase
export const toCamelCase = (text = "") =>
  text
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));

// Truncate string
export const truncate = (text = "", length = 50) =>
  text.length > length ? `${text.slice(0, length)}...` : text;

// Remove extra spaces
export const normalizeSpaces = (text = "") => text.replace(/\s+/g, " ").trim();

/* ================================
   NUMBER HELPERS
================================ */

// Format number with commas
export const formatNumber = (num = 0) => new Intl.NumberFormat().format(num);

export const toCommaAndDollar = (x) =>
  "$" +
  Math.ceil(x)
    .toFixed(0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// Clamp number between min and max
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// Random number between min & max
export const randomBetween = (min = 0, max = 1) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/* ================================
   ARRAY HELPERS
================================ */

// Remove duplicates
export const uniqueArray = (arr = []) => [...new Set(arr)];

// Chunk array
export const chunkArray = (arr = [], size = 1) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

// Check if array is empty
export const isEmptyArray = (arr) => !Array.isArray(arr) || arr.length === 0;

/* ================================
   OBJECT HELPERS
================================ */

// Check if object is empty
export const isEmptyObject = (obj = {}) => Object.keys(obj).length === 0;

// Pick keys from object
export const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, k) => (k in obj ? { ...acc, [k]: obj[k] } : acc), {});

// Omit keys from object
export const omit = (obj = {}, keys = []) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/* ================================
   BOOLEAN / VALIDATION
================================ */

// Check if value exists
export const isTruthy = (value) =>
  value !== null && value !== undefined && value !== "";

// Email validation
export const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ================================
   MISC HELPERS
================================ */

// No-op function
export const noop = () => {};

// Delay (promise-based)
export const sleep = (ms = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Safe JSON parse
export const safeJSONParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Convert ISO date to Australian format (DD/MM/YYYY)
export const formatAustralianDate = (dateString = "") => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-AU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
};
