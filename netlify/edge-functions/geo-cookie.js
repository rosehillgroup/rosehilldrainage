export default async (request, context) => {
  // Handle language-prefixed URLs (e.g., /fr/solutions.html → /solutions.html?lang=fr)
  const url = new URL(request.url);
  const languageMatch = url.pathname.match(/^\/(fr|de|es)\/(.*)/);

  if (languageMatch) {
    const [, lang, path] = languageMatch;

    // Check if this is an HTML page request (no extension or .html extension)
    const hasExtension = path.includes('.');
    const isHtmlPage = !hasExtension || path.endsWith('.html');

    if (isHtmlPage) {
      // HTML pages: Rewrite to root file with language query param
      const newUrl = new URL(`/${path}`, url.origin);
      newUrl.searchParams.set('lang', lang);
      return context.rewrite(newUrl);
    } else {
      // Assets (images, CSS, JS, etc.): Rewrite to root path without language param
      // This serves /fr/logo.png from /logo.png
      const newUrl = new URL(`/${path}`, url.origin);
      return context.rewrite(newUrl);
    }
  }

  // Original geo-cookie functionality for non-language paths
  // Netlify adds IP-derived geo on the request at the edge
  // @ts-ignore
  const g = context.geo || {};
  const geo = {
    country: g.country?.code || '',
    region: g.subdivision?.code || '',
    city: g.city || '',
    latitude: g.latitude || '',
    longitude: g.longitude || '',
    timezone: g.timezone || ''
  };

  // Continue to the origin
  const response = await context.next();

  const value = encodeURIComponent(JSON.stringify(geo));
  // Share across subdomains (adjust if you only want per-site)
  const domain = '.rosehill.group'; // or omit to keep per-subdomain
  response.headers.append(
    'Set-Cookie',
    `nl_geo=${value}; Path=/; Max-Age=900; SameSite=Lax; Domain=${domain}`
  );

  return response;
};