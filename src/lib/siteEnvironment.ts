export type RelloSiteEnvironment = "local" | "production" | "staging";

interface SiteEnvironmentConfig {
  environment: RelloSiteEnvironment;
  indexable: boolean;
  url: string;
}

const PRODUCTION_URL = "https://www.rello.online";

function isPrivateHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
}

function readEnvironment(value: string | undefined): RelloSiteEnvironment {
  if (value === "local" || value === "production" || value === "staging") {
    return value;
  }

  throw new Error(
    "RELLO_SITE_ENVIRONMENT must be set to local, staging, or production.",
  );
}

function readSiteUrl(value: string | undefined): URL {
  if (!value) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
  }

  try {
    return new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
  }
}

export function getSiteEnvironment(): SiteEnvironmentConfig {
  const environment = readEnvironment(process.env.RELLO_SITE_ENVIRONMENT);
  const configuredUrl = readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const url = configuredUrl.origin;

  if (environment === "production" && url !== PRODUCTION_URL) {
    throw new Error(
      `Production NEXT_PUBLIC_SITE_URL must be ${PRODUCTION_URL}.`,
    );
  }

  if (
    environment === "staging" &&
    (configuredUrl.protocol !== "https:" ||
      isPrivateHostname(configuredUrl.hostname) ||
      url === PRODUCTION_URL)
  ) {
    throw new Error(
      "Staging NEXT_PUBLIC_SITE_URL must be a public HTTPS origin distinct from production.",
    );
  }

  if (environment === "local" && !isPrivateHostname(configuredUrl.hostname)) {
    throw new Error(
      "Local NEXT_PUBLIC_SITE_URL must use localhost or a private-network hostname.",
    );
  }

  return {
    environment,
    indexable: environment === "production",
    url,
  };
}
