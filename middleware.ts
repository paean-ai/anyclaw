/**
 * Vercel Edge Middleware — serves install.sh for CLI clients (curl/wget).
 *
 * This replaces the Vite dev-server `clawInstallPlugin()` for production.
 * When `curl anyclaw.sh` or `wget anyclaw.sh` hits the root path,
 * we rewrite the request to /install.sh so the plain-text script is returned.
 *
 * Browser requests pass through normally to the SPA.
 */
export default function middleware(request: Request): Response | undefined {
    const url = new URL(request.url);

    // Only intercept requests to the root path
    if (url.pathname !== "/" && url.pathname !== "/index.html") {
        return undefined; // pass through
    }

    const ua = (request.headers.get("user-agent") || "").toLowerCase();

    // Detect CLI clients: curl, wget, fetch, httpie, or empty UA
    const isCli =
        ua.startsWith("curl") ||
        ua.startsWith("wget") ||
        ua.startsWith("fetch") ||
        ua.startsWith("httpie") ||
        ua === "";

    if (!isCli) {
        return undefined; // pass through to SPA
    }

    // Rewrite CLI requests to /install.sh (served from public/ as static file)
    url.pathname = "/install.sh";
    return Response.redirect(url.toString(), 302);
}

export const config = {
    matcher: ["/", "/index.html"],
};
