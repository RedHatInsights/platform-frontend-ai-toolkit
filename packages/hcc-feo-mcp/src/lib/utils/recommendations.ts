import { cachedSchema } from './schemaCache.js';

export function getRecommendedPosition(bundle: string): number {
  // Use schema defaults or provide reasonable default
  if (!cachedSchema) return 800;

  const bundleSegmentProps = cachedSchema.$defs?.frontendSpec?.properties?.bundleSegments;
  if (bundleSegmentProps?.items?.properties?.position?.default) {
    return bundleSegmentProps.items.properties.position.default;
  }

  // Return schema-suggested default or safe fallback
  return 800;
}

export function getRecommendedServiceSection(bundle: string): { section: string; group: string } {
  if (!cachedSchema) {
    return { section: 'insights', group: 'platform' };
  }

  const serviceTilesProps = cachedSchema.$defs?.frontendSpec?.properties?.serviceTiles;
  const sectionDefault = serviceTilesProps?.items?.properties?.section?.default || 'insights';
  const groupDefault = serviceTilesProps?.items?.properties?.group?.default || 'platform';

  return { section: sectionDefault, group: groupDefault };
}

export function getRecommendedIcon(bundle: string): string {
  if (!cachedSchema) return 'Application';

  const serviceTilesProps = cachedSchema.$defs?.frontendSpec?.properties?.serviceTiles;
  const iconDefault = serviceTilesProps?.items?.properties?.icon?.default;

  return iconDefault || 'Application';
}

export function getProductName(bundle: string): string {
  if (!cachedSchema) {
    return bundle.split('-').map((word: string) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  const navItemsProps = cachedSchema.$defs?.frontendSpec?.properties?.bundleSegments?.items?.properties?.navItems;
  const productDefault = navItemsProps?.items?.properties?.product?.default;

  if (productDefault) {
    return productDefault;
  }

  // Generate from bundle name as fallback
  return bundle.split('-').map((word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
