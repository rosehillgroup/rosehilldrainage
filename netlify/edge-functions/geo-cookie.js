export default async (request, context) => {
  // Static site - language directories contain pre-translated HTML files
  // No rewriting needed - Netlify serves static files directly from /fr/, /de/, /es/

  // Geo-cookie functionality for analytics
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

  // Continue to the origin (serve static files)
  const response = await context.next();

  const value = encodeURIComponent(JSON.stringify(geo));
  // Share across subdomains
  const domain = '.rosehill.group';
  response.headers.append(
    'Set-Cookie',
    `nl_geo=${value}; Path=/; Max-Age=900; SameSite=Lax; Domain=${domain}`
  );

  return response;
};