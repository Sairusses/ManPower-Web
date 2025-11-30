// Client-side environment variables (from .env.local)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

// Server-side environment variables (from .env)
// These are only available server-side via process.env
export const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || "";
