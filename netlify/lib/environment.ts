// Netlify.env is provided by modern Netlify Functions. Never expose these values in VITE_*.
declare const Netlify: { env: { get: (key: string) => string | undefined } };
export function settings() {
  const env = (key: string) => (typeof Netlify === 'undefined' ? '' : Netlify.env.get(key) || '');
  const apiKey = env('GEMINI_API_KEY');
  const baseUrl = env('GOOGLE_GEMINI_BASE_URL');
  return {
    enabled: env('KUECHE90_ENABLE_AI') === 'true',
    allowedEmails: env('KUECHE90_ALLOWED_EMAILS'),
    apiKey,
    baseUrl,
    configured: !!apiKey && !!baseUrl,
  };
}
