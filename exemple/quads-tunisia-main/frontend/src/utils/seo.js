const SITE_NAME = 'Quads Tunisia';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80';

function setMetaTag(attr, attrValue, content) {
  let tag = document.querySelector(`meta[${attr}="${attrValue}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, attrValue);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.href = url;
}

/**
 * Sets document title, meta description/keywords, and Open Graph/Twitter tags.
 * Works from any page effect: setSEO({ title, description, keywords, image, path }).
 */
export function setSEO({ title, description, keywords, image, path }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  document.title = fullTitle;

  if (description) setMetaTag('name', 'description', description);
  if (keywords) setMetaTag('name', 'keywords', keywords);

  const url = path ? `${window.location.origin}${path}` : window.location.href;
  setCanonical(url);

  setMetaTag('property', 'og:site_name', SITE_NAME);
  setMetaTag('property', 'og:title', fullTitle);
  if (description) setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:image', image || DEFAULT_IMAGE);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:type', 'website');

  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', fullTitle);
  if (description) setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image || DEFAULT_IMAGE);
}
