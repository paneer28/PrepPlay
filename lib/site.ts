export function getSiteUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitUrl) {
    return explicitUrl.startsWith("http") ? explicitUrl : `https://${explicitUrl}`;
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return productionUrl.startsWith("http") ? productionUrl : `https://${productionUrl}`;
  }

  const previewUrl = process.env.VERCEL_URL?.trim();
  if (previewUrl) {
    return previewUrl.startsWith("http") ? previewUrl : `https://${previewUrl}`;
  }

  return "http://localhost:3000";
}

