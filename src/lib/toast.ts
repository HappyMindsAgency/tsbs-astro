/**
 * toast.ts — Sistema di notifiche Toast globale per TSBS
 *
 * Uso rapido:
 *   import { showToast, dismissToast } from '../lib/toast';
 *
 *   showToast({ type: 'success', message: 'Tessera inviata per la verifica!' });
 *
 *   showToast({
 *     type: 'error',
 *     lottie: '/animations/error.lottie',
 *     title: 'Tessera non valida',
 *     message: 'Il numero inserito non è corretto. Riprova.',
 *     button: { label: 'Reinserisci', onClick: () => openTesseraForm() },
 *   });
 *
 * Il container (#tsbs-toast-container) viene montato automaticamente sul <body>
 * al primo utilizzo. Non serve aggiungere nulla al layout.
 */

// ---------------------------------------------------------------------------
// CONFIGURAZIONE — modifica qui senza toccare il resto del codice
// ---------------------------------------------------------------------------

/** Durata default in ms prima della chiusura automatica */
const DEFAULT_DURATION = 5000;

/** Posizione del container (applicata via classe CSS) */
const DEFAULT_POSITION: ToastPosition = 'bottom-end';

/**
 * Mappa type → aspetto visivo.
 * Ogni entry controlla:
 *   - accent: colore del bordo sinistro / indicatore
 *   - icon:   Bootstrap Icon class (bi-*) usata se non viene passata lottie/image
 *   - ariaRole: role ARIA del toast ('alert' per errori, 'status' per info)
 */
const TYPE_CONFIG: Record<ToastType, TypeConfig> = {
    success: {
        accent: '#5a7c2b',     // verde TSBS-vicino
        icon: 'bi-check-circle-fill',
        ariaRole: 'status',
    },
    error: {
        accent: '#b94040',
        icon: 'bi-x-circle-fill',
        ariaRole: 'alert',
    },
    warning: {
        accent: '#c99a2e',
        icon: 'bi-exclamation-triangle-fill',
        ariaRole: 'alert',
    },
    info: {
        accent: '#2a3369',     // blu Astraria
        icon: 'bi-info-circle-fill',
        ariaRole: 'status',
    },
};

// ---------------------------------------------------------------------------
// TIPI
// ---------------------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';

type TypeConfig = {
    accent: string;
    icon: string;
    ariaRole: 'alert' | 'status';
};

export type ToastOptions = {
    /** Variante visiva del toast */
    type?: ToastType;
    /** Path a un file .lottie — prioritario rispetto a image */
    lottie?: string;
    /** URL immagine — usata solo se lottie non è presente */
    image?: string;
    /** Titolo opzionale */
    title?: string;
    /** Messaggio principale */
    message: string;
    /** Pulsante di azione opzionale */
    button?: {
        label: string;
        onClick: () => void;
        /** Se true, il click non chiude il toast automaticamente */
        keepOpen?: boolean;
    };
    /** Durata in ms (0 = nessun auto-dismiss) */
    duration?: number;
    /** Mostra pulsante ✕ per chiusura manuale */
    dismissible?: boolean;
    /**
     * Chiave univoca (es. 'benvenuto-accademia', 'prima-missione-sbloccata').
     * Se presente, il toast viene mostrato una sola volta per membro:
     * viene saltato se la chiave è già presente in datiAggiuntivi,
     * altrimenti viene mostrato e la chiave viene salvata dopo la prima visualizzazione.
     * Richiede che l'utente sia autenticato (cookie JWT presente).
     */
    once?: string;
};

// ---------------------------------------------------------------------------
// STATO INTERNO
// ---------------------------------------------------------------------------

let container: HTMLElement | null = null;
let idCounter = 0;
const activeToasts = new Map<string, { el: HTMLElement; timerId?: ReturnType<typeof setTimeout> }>();

// ---------------------------------------------------------------------------
// API PUBBLICA
// ---------------------------------------------------------------------------

/**
 * Mostra un toast. Restituisce l'id per poterlo chiudere programmaticamente.
 *
 * Se `options.once` è valorizzato, la funzione opera in modo asincrono:
 * controlla prima se il toast è già stato visto (via datiAggiuntivi del Membro)
 * e lo mostra solo se non lo è. Il valore restituito sarà una stringa vuota
 * se il toast viene saltato.
 */
export function showToast(options: ToastOptions): string {
    if (options.once) {
        // Gestione asincrona: verifica + mostra + segna come visto
        void showToastOnce(options);
        // L'id reale verrà assegnato internamente; restituiamo una stringa vuota
        // come segnale che il toast è in pending (non ancora montato)
        return '';
    }
    return mountToast(options);
}

/**
 * Chiude un toast per id. Sicuro da chiamare anche se il toast è già chiuso.
 */
export function dismissToast(id: string): void {
    if (!id) return;
    const entry = activeToasts.get(id);
    if (!entry) return;
    clearTimeout(entry.timerId);
    animateOut(entry.el, () => {
        entry.el.remove();
        activeToasts.delete(id);
    });
}

// ---------------------------------------------------------------------------
// LOGICA "ONCE" — mostra il toast al massimo una volta per membro
// ---------------------------------------------------------------------------

const ONCE_KEY_PREFIX = 'toast_seen_';

async function showToastOnce(options: ToastOptions): Promise<void> {
    const key = ONCE_KEY_PREFIX + options.once;

    try {
        // Controlla se la chiave è già segnata in datiAggiuntivi
        const res = await fetch('/api/user/dati-aggiuntivi');
        if (res.ok) {
            const { datiAggiuntivi } = await res.json() as { datiAggiuntivi: Record<string, unknown> };
            if (datiAggiuntivi[key] === true) return; // già visto → skip
        } else if (res.status === 401) {
            // Utente non autenticato: non mostrare il toast once
            return;
        }
        // In caso di errore diverso (404 membro, 500...) mostriamo comunque il toast
        // per non penalizzare l'esperienza, ma non tentiamo di salvare
    } catch {
        // Rete non disponibile: mostriamo il toast senza salvare
    }

    const id = mountToast(options);

    // Segna come visto dopo la visualizzazione (fire-and-forget)
    try {
        await fetch('/api/user/dati-aggiuntivi', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [key]: true }),
        });
    } catch {
        // Salvataggio fallito: il toast sarà mostrato di nuovo alla prossima visita
        // ma è il comportamento più sicuro (meglio ridondante che mai visto)
    }

    return;
}

/** Monta il toast nel DOM e avvia il timer. Restituisce l'id. */
function mountToast(options: ToastOptions): string {
    ensureContainer();

    const id = `tsbs-toast-${++idCounter}`;
    const type = options.type ?? 'info';
    const duration = options.duration ?? DEFAULT_DURATION;
    const dismissible = options.dismissible !== false;

    const el = buildToastElement(id, type, options, dismissible);

    container!.prepend(el);

    // Forza reflow per l'animazione di entrata
    el.getBoundingClientRect();
    el.classList.add('tsbs-toast--visible');

    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (duration > 0) {
        timerId = scheduleAutoDismiss(id, el, duration, !!options.button);
    }

    activeToasts.set(id, { el, timerId });
    return id;
}

// ---------------------------------------------------------------------------
// COSTRUZIONE DEL DOM
// ---------------------------------------------------------------------------

function buildToastElement(
    id: string,
    type: ToastType,
    opts: ToastOptions,
    dismissible: boolean,
): HTMLElement {
    const config = TYPE_CONFIG[type];

    const el = document.createElement('div');
    el.id = id;
    el.className = `tsbs-toast tsbs-toast--${type}`;
    el.setAttribute('role', config.ariaRole);
    el.setAttribute('aria-live', config.ariaRole === 'alert' ? 'assertive' : 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.style.setProperty('--toast-accent', config.accent);

    // --- Visual (lottie / immagine / icona di default) ---
    const visualHtml = buildVisualHtml(opts, config);

    // --- Testo ---
    const titleHtml = opts.title
        ? `<p class="tsbs-toast__title">${escapeHtml(opts.title)}</p>`
        : '';
    const messageHtml = `<p class="tsbs-toast__message">${escapeHtml(opts.message)}</p>`;

    // --- Pulsante ---
    const buttonHtml = opts.button
        ? `<button type="button" class="tsbs-toast__btn" data-toast-action>${escapeHtml(opts.button.label)}</button>`
        : '';

    // --- Chiudi ---
    const closeHtml = dismissible
        ? `<button type="button" class="tsbs-toast__close" aria-label="Chiudi notifica" data-toast-close>
               <i class="bi bi-x-lg" aria-hidden="true"></i>
           </button>`
        : '';

    el.innerHTML = `
        ${closeHtml}
        <div class="tsbs-toast__inner">
            ${visualHtml}
            <div class="tsbs-toast__body">
                ${titleHtml}
                ${messageHtml}
                ${buttonHtml}
            </div>
        </div>
    `;

    // Wire-up pulsante azione
    if (opts.button) {
        const btn = el.querySelector<HTMLButtonElement>('[data-toast-action]');
        btn?.addEventListener('click', () => {
            opts.button!.onClick();
            if (!opts.button!.keepOpen) dismissToast(id);
        });
    }

    // Wire-up pulsante chiudi
    const closeBtn = el.querySelector<HTMLButtonElement>('[data-toast-close]');
    closeBtn?.addEventListener('click', () => dismissToast(id));

    // Carica Lottie in modo asincrono dopo il mount (ha bisogno del canvas nel DOM)
    if (opts.lottie) {
        requestAnimationFrame(() => loadLottie(el, opts.lottie!));
    }

    return el;
}

function buildVisualHtml(opts: ToastOptions, config: TypeConfig): string {
    if (opts.lottie) {
        // Placeholder canvas — Lottie viene montato dopo (in requestAnimationFrame)
        return `<div class="tsbs-toast__visual" data-toast-lottie="${escapeHtml(opts.lottie)}">
                    <canvas class="tsbs-toast__lottie-canvas"></canvas>
                </div>`;
    }
    if (opts.image) {
        return `<div class="tsbs-toast__visual">
                    <img src="${escapeHtml(opts.image)}" alt="" class="tsbs-toast__image" aria-hidden="true" />
                </div>`;
    }
    // Fallback: icona Bootstrap Icon
    return `<div class="tsbs-toast__visual tsbs-toast__visual--icon">
                <i class="bi ${config.icon}" aria-hidden="true"></i>
            </div>`;
}

// ---------------------------------------------------------------------------
// LOTTIE (lazy-loaded per non bloccare il bundle principale)
// ---------------------------------------------------------------------------

async function loadLottie(el: HTMLElement, src: string): Promise<void> {
    const canvas = el.querySelector<HTMLCanvasElement>('.tsbs-toast__lottie-canvas');
    if (!canvas) return;

    try {
        // Import dinamico — viene incluso nel bundle solo se usato
        const { DotLottie } = await import('@lottiefiles/dotlottie-web');
        new DotLottie({
            canvas,
            src,
            loop: true,
            autoplay: true,
        });
    } catch {
        // Fallback silenzioso: mostra l'icona di default al posto del canvas
        const visual = el.querySelector<HTMLElement>('[data-toast-lottie]');
        if (visual) {
            const type = (el.className.match(/tsbs-toast--(\w+)/) ?? [])[1] as ToastType ?? 'info';
            visual.innerHTML = `<i class="bi ${TYPE_CONFIG[type].icon}" aria-hidden="true"></i>`;
            visual.classList.add('tsbs-toast__visual--icon');
        }
    }
}

// ---------------------------------------------------------------------------
// TIMER E ANIMAZIONI
// ---------------------------------------------------------------------------

function scheduleAutoDismiss(
    id: string,
    el: HTMLElement,
    duration: number,
    pauseOnHover: boolean,
): ReturnType<typeof setTimeout> {
    let remaining = duration;
    let startedAt = Date.now();
    let timerId = setTimeout(() => dismissToast(id), remaining);

    if (pauseOnHover) {
        el.addEventListener('mouseenter', () => {
            clearTimeout(timerId);
            remaining -= Date.now() - startedAt;
        });
        el.addEventListener('mouseleave', () => {
            startedAt = Date.now();
            timerId = setTimeout(() => dismissToast(id), remaining);
            // Aggiorna il timerId nell'entry così dismissToast può cancellarlo
            const entry = activeToasts.get(id);
            if (entry) entry.timerId = timerId;
        });
    }

    return timerId;
}

function animateOut(el: HTMLElement, onDone: () => void): void {
    el.classList.remove('tsbs-toast--visible');
    el.classList.add('tsbs-toast--hiding');
    el.addEventListener('transitionend', onDone, { once: true });
    // Fallback sicuro se la transizione non parte (display:none, prefers-reduced-motion)
    setTimeout(onDone, 400);
}

// ---------------------------------------------------------------------------
// CONTAINER
// ---------------------------------------------------------------------------

/** Monta il container una sola volta sul <body>. */
function ensureContainer(): void {
    if (container) return;
    container = document.createElement('div');
    container.id = 'tsbs-toast-container';
    container.className = `tsbs-toast-container tsbs-toast-container--${DEFAULT_POSITION}`;
    container.setAttribute('aria-label', 'Notifiche');
    document.body.appendChild(container);
}

// ---------------------------------------------------------------------------
// UTILITY
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
