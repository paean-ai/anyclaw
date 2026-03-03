// Vercel Edge Middleware — runs before CDN cache on every request.
// Detects CLI user-agents (curl, wget, etc.) and serves the install script
// instead of the SPA HTML when the root URL is accessed.

const CLI_UA = /^(curl|wget|fetch|httpie|Wget)/i;

export default function middleware(request) {
    const { pathname } = new URL(request.url);
    if (pathname !== '/') return;

    const ua = request.headers.get('user-agent') || '';
    if (CLI_UA.test(ua)) {
        return Response.redirect(new URL('/install.sh', request.url), 302);
    }
}

export const config = {
    matcher: '/',
};
