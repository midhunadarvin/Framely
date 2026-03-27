export function getLink({
  subdomain,
  pathName = "",
  method = true,
}: {
  subdomain?: string;
  pathName?: string;
  method?: boolean;
}): string {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const isLocalhost =
    rootDomain.includes("localhost") || rootDomain.includes("127.0.0.1");

  // For localhost: use path-based routing (/app, /editor)
  if (isLocalhost) {
    let path = "";
    if (subdomain === "app" || subdomain === "dashboard") {
      path = "/app";
    } else if (subdomain === "editor") {
      path = "/editor";
    } else if (subdomain) {
      path = `/${subdomain}`;
    }
    return `${path}${pathName ? "/" + pathName : ""}`;
  }

  // For production: use subdomain-based routing
  const formattedSubdomain = subdomain ? `${subdomain}.` : "";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  return `${method ? protocol + "://" : ""}${formattedSubdomain}${rootDomain}/${pathName}`;
}
