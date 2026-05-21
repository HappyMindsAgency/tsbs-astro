import { defineMiddleware } from 'astro:middleware';

const MAINTENANCE_MODE_ENABLED = true;
const MAINTENANCE_PATH = '/maintenance';
const API_PATH = '/api';
const BYPASS_QUERY_PARAM = 'bypass';
const BYPASS_QUERY_VALUE = 'tsbs';
const BYPASS_COOKIE_NAME = 'maintenance_bypass';
const BYPASS_COOKIE_MAX_AGE = 60 * 60 * 12;

function isApiRoute(pathname: string) {
	return pathname === API_PATH || pathname.startsWith(`${API_PATH}/`);
}

function isMaintenanceRoute(pathname: string) {
	return pathname === MAINTENANCE_PATH || pathname.startsWith(`${MAINTENANCE_PATH}/`);
}

function isStaticAsset(pathname: string) {
	return pathname.startsWith('/_astro/') || pathname === '/favicon.ico' || /\.[a-zA-Z0-9]+$/.test(pathname);
}

function getCleanBypassUrl(url: URL) {
	const cleanUrl = new URL(url);
	cleanUrl.searchParams.delete(BYPASS_QUERY_PARAM);
	return cleanUrl;
}

function getBypassRedirectUrl(url: URL) {
	if (isMaintenanceRoute(url.pathname)) {
		return new URL('/landing/', url);
	}

	return getCleanBypassUrl(url);
}

function getRequestBase(context: Parameters<Parameters<typeof defineMiddleware>[0]>[0]): URL {
	const host = context.request.headers.get('x-forwarded-host') || context.request.headers.get('host');
	const proto = context.request.headers.get('x-forwarded-proto') || context.url.protocol.replace(':', '');
	if (host) {
		return new URL(`${proto}://${host}`);
	}
	return new URL(`${context.url.protocol}//${context.url.host}`);
}

export const onRequest = defineMiddleware((context, next) => {
	const { pathname, searchParams } = context.url;
	const hasValidBypass = searchParams.get(BYPASS_QUERY_PARAM) === BYPASS_QUERY_VALUE;

	if (hasValidBypass) {
		context.cookies.set(BYPASS_COOKIE_NAME, BYPASS_QUERY_VALUE, {
			httpOnly: true,
			maxAge: BYPASS_COOKIE_MAX_AGE,
			path: '/',
			sameSite: 'lax',
			secure: context.url.protocol === 'https:',
		});

		const base = getRequestBase(context);
		const bypassTarget = getBypassRedirectUrl(context.url);
		bypassTarget.host = base.host;
		bypassTarget.protocol = base.protocol;
		return Response.redirect(bypassTarget, 302);
	}

	if (!MAINTENANCE_MODE_ENABLED) {
		return next();
	}

	if (
		isMaintenanceRoute(pathname) ||
		isApiRoute(pathname) ||
		isStaticAsset(pathname) ||
		context.cookies.has(BYPASS_COOKIE_NAME)
	) {
		return next();
	}

	const base = getRequestBase(context);
	return Response.redirect(new URL(MAINTENANCE_PATH, base), 302);
});
