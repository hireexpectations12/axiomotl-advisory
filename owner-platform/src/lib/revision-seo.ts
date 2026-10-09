export const revisionOrigin = "https://axiomotl-kevin-murphy.vercel.app";

// Only facts already published on the approved site; no inferred address or ratings.
export const revisionOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${revisionOrigin}/#organization`,
  name: "Axiomotl Advisory",
  url: revisionOrigin,
  logo: `${revisionOrigin}/site-assets/revision/axiomotl-logo-cropped.png`,
  email: "hello@axiomotl.com.au",
};
