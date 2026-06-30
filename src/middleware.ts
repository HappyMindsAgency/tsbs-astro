import { defineMiddleware } from 'astro:middleware';
import { getAuthenticatedUserAcademy } from './lib/strapi/user-academy';
import { registraReferral } from './lib/strapi/referral';

const REFERRAL_QUERY_PARAM = 'ref';

const MAINTENANCE_MODE_ENABLED = false;
const MAINTENANCE_PATH = '/maintenance';
const API_PATH = '/api';
const BYPASS_QUERY_PARAM = 'bypass';
const BYPASS_QUERY_VALUE = 'tsbs';
const BYPASS_COOKIE_NAME = 'maintenance_bypass';
const BYPASS_COOKIE_MAX_AGE = 60 * 60 * 12;

// Percorsi accessibili senza sessione attiva.
const PUBLIC_PATHS = ['/', '/registrazione/', '/auth/'];

function isPublicPath(pathname: string) {
	return PUBLIC_PATHS.some((p) => {
		if (p === '/') return pathname === '/';
		return pathname === p || pathname.startsWith(p);
	});
}

function isLoginPage(pathname: string) {
	return pathname === '/';
}

function isApiRoute(pathname: string) {
	return pathname === API_PATH || pathname.startsWith(`${API_PATH}/`);
}

function isSortingTestRoute(pathname: string) {
	return pathname === '/test-smistamento' || pathname.startsWith('/test-smistamento/');
}

function isSortingAvatarRoute(pathname: string) {
	return pathname === '/test-smistamento/scegli-avatar' || pathname.startsWith('/test-smistamento/scegli-avatar/');
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

export const onRequest = defineMiddleware(async (context, next) => {
	const { pathname, searchParams } = context.url;

	// Link referral (missione 12): visitare /?ref=CODICE completa la missione e
	// assegna il trofeo al referrer. Idempotente; auto-referral scartato lato
	// servizio tramite il JWT del visitatore. Si pulisce subito la query e si
	// reindirizza, così refresh/prefetch non ripetono l'azione sull'URL sporco.
	// ponytail: GET con side effect; accettabile perché tutto il completamento è idempotente.
	const referralCode = searchParams.get(REFERRAL_QUERY_PARAM)?.trim();
	if (referralCode && !isApiRoute(pathname) && !isStaticAsset(pathname)) {
		await registraReferral(referralCode, context.cookies.get('jwt')?.value);
		const base = getRequestBase(context);
		const clean = new URL(context.url);
		clean.searchParams.delete(REFERRAL_QUERY_PARAM);
		clean.host = base.host;
		clean.protocol = base.protocol;
		return new Response(null, { status: 302, headers: { Location: clean.toString() } });
	}

	// Guarda auth solo per route non-API, non-asset, non-maintenance.
	if (!isApiRoute(pathname) && !isStaticAsset(pathname) && !isMaintenanceRoute(pathname)) {
		const hasJwt = context.cookies.has('jwt');
		const jwt = context.cookies.get('jwt')?.value;
		const academy = hasJwt ? await getAuthenticatedUserAcademy(jwt) : null;

		if (isLoginPage(pathname) && hasJwt) {
			const base = getRequestBase(context);
			const targetPath = academy ? '/atrio/' : '/test-smistamento/';
			return new Response(null, { status: 302, headers: { Location: new URL(targetPath, base).toString() } });
		}

		if (!isPublicPath(pathname) && !hasJwt) {
			const base = getRequestBase(context);
			return new Response(null, { status: 302, headers: { Location: new URL('/', base).toString() } });
		}

		if (hasJwt && academy && isSortingTestRoute(pathname) && !isSortingAvatarRoute(pathname)) {
			const base = getRequestBase(context);
			return new Response(null, { status: 302, headers: { Location: new URL('/atrio/', base).toString() } });
		}

		if (hasJwt && !isPublicPath(pathname) && !isSortingTestRoute(pathname)) {
			if (!academy) {
				const base = getRequestBase(context);
				return new Response(null, { status: 302, headers: { Location: new URL('/test-smistamento/', base).toString() } });
			}
		}
	}

	const hasValidBypass = searchParams.get(BYPASS_QUERY_PARAM) === BYPASS_QUERY_VALUE;

	if (hasValidBypass) {
		const base = getRequestBase(context);
		const bypassTarget = getBypassRedirectUrl(context.url);
		bypassTarget.host = base.host;
		bypassTarget.protocol = base.protocol;

		const isSecure = base.protocol === 'https:';
		const cookieValue = [
			`${BYPASS_COOKIE_NAME}=${BYPASS_QUERY_VALUE}`,
			'Path=/',
			`Max-Age=${BYPASS_COOKIE_MAX_AGE}`,
			'HttpOnly',
			'SameSite=Lax',
			...(isSecure ? ['Secure'] : []),
		].join('; ');

		return new Response(null, {
			status: 302,
			headers: {
				Location: bypassTarget.toString(),
				'Set-Cookie': cookieValue,
			},
		});
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
	return new Response(null, { status: 302, headers: { Location: new URL(MAINTENANCE_PATH, base).toString() } });
});
