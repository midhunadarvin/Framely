import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host")!;
  const path = url.pathname;

  // For localhost/local development: use path-based routing
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    // Path-based routing: /app/* -> /dashboard, /editor/* -> /editor, etc.
    if (path.startsWith("/app/") || path === "/app") {
      return NextResponse.rewrite(
        new URL(`/dashboard${path === "/app" ? "" : path.slice(4)}`, req.url),
      );
    }
    // /editor routes stay as-is
    return NextResponse.next();
  }

  // For production with subdomains: extract subdomain from hostname
  const subdomain = hostname.split(".")[0];

  // Handle editor subdomain
  if (subdomain === "editor") {
    return NextResponse.rewrite(
      new URL(`/editor${path === "/" ? "" : path}`, req.url),
    );
  }

  // Handle app/dashboard subdomains
  if (subdomain === "app" || subdomain === "dashboard") {
    return NextResponse.rewrite(
      new URL(`/dashboard${path === "/" ? "" : path}`, req.url),
    );
  }

  // Handle custom subdomains (user pages)
  if (subdomain && subdomain !== "www") {
    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
  }

  // Default routing
  return NextResponse.next();
}
