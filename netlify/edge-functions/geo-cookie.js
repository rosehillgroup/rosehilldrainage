export default async (request, context) => {
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