// Single source for the API origin. Empty base falls back to same-origin '/api'
// for local development against the ASP.NET dev server.
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
