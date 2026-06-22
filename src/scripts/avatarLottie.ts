// Mount/refresh di avatar .lottie su <canvas>, sempre in loop e mai in pausa.
import { DotLottie } from '@lottiefiles/dotlottie-web';

const instances = new WeakMap<HTMLCanvasElement, { dot: DotLottie; src: string }>();

function sizeCanvas(canvas: HTMLCanvasElement): number {
	const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
	const rect = canvas.getBoundingClientRect();
	canvas.width = Math.round(rect.width * dpr) || 256;
	canvas.height = Math.round(rect.height * dpr) || 256;
	return dpr;
}

/** Crea (o aggiorna) l'animazione lottie in loop su una canvas avatar. */
export function setAvatarLottie(canvas: HTMLCanvasElement, src: string): void {
	if (!src) return;

	const current = instances.get(canvas);
	if (current && current.src === src) return;
	if (current) current.dot.destroy();

	const dpr = sizeCanvas(canvas);
	const dot = new DotLottie({
		canvas,
		src,
		autoplay: true,
		loop: true,
		renderConfig: { devicePixelRatio: dpr },
	});

	instances.set(canvas, { dot, src });
	canvas.dataset.avatarLottieSrc = src;
}

/** Inizializza tutte le canvas avatar già presenti nel DOM (render statico). */
export function initAvatarLotties(root: ParentNode = document): void {
	root.querySelectorAll<HTMLCanvasElement>('canvas[data-avatar-lottie]').forEach((canvas) => {
		const src = canvas.dataset.avatarLottieSrc;
		if (src) setAvatarLottie(canvas, src);
	});
}

if (typeof document !== 'undefined') {
	const run = () => initAvatarLotties();
	if (document.readyState !== 'loading') run();
	else document.addEventListener('DOMContentLoaded', run);
	document.addEventListener('astro:page-load', run);
}
