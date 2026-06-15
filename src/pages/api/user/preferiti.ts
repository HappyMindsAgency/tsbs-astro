import type { APIRoute } from 'astro';
import { getFavoriteProfilesByJwt, updateFavoriteByJwt } from '../../../lib/strapi/preferiti';

type FavoritePayload = {
	profileId?: string;
};

export const GET: APIRoute = async ({ cookies }) => {
	const jwt = cookies.get('jwt')?.value;
	if (!jwt) return json({ error: 'unauthorized' }, 401);

	const favorites = await getFavoriteProfilesByJwt(jwt);
	return json({
		favoriteIds: favorites.map((profile) => profile.id),
		favorites,
	});
};

export const POST: APIRoute = async ({ request, cookies }) => {
	return handleFavoriteMutation(request, cookies.get('jwt')?.value, 'add');
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
	return handleFavoriteMutation(request, cookies.get('jwt')?.value, 'remove');
};

async function handleFavoriteMutation(request: Request, jwt: string | undefined, action: 'add' | 'remove') {
	if (!jwt) return json({ error: 'unauthorized' }, 401);

	let body: FavoritePayload;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body' }, 400);
	}

	const profileId = body.profileId?.trim();
	if (!profileId) return json({ error: 'missing_profile_id' }, 400);

	const result = await updateFavoriteByJwt(jwt, profileId, action);
	if (!result.ok) return json({ error: result.error }, result.status);

	return json({ success: true, favoriteIds: result.favoriteIds });
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store',
		},
	});
}
