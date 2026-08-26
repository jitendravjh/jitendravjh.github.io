import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { html } from 'satori-html';

// Every page is rendered twice (dark + light) from the same text, so the two
// renders would otherwise fetch the same two fonts twice.
const fontCache = new Map<string, Promise<ArrayBuffer>>();

function loadGoogleFont(font: string, text: string) {
    const API = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
    const cached = fontCache.get(API);
    if (cached) return cached;

    const pending = (async () => {
        const css = await (await fetch(API, {
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1" }
        })).text();
        const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
        if (!resource) throw new Error("Failed to download dynamic font");
        const res = await fetch(resource[1]);
        return res.arrayBuffer();
    })();

    fontCache.set(API, pending);
    pending.catch(() => fontCache.delete(API));
    return pending;
}

// The markup below is assembled as a string and then parsed, so anything a
// value carries that the parser would read as a tag has to go first. Entities
// are no help: ultrahtml does not decode them, so `&lt;` would draw literally.
const plain = (value: string) => value.replace(/[<>]/g, '');

// Destination icons for the corner badge, drawn as SVG so they render inside the poster.
const ICON = {
    github: {
        viewBox: '0 0 496 512',
        d: 'M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8z',
    },
    play: {
        viewBox: '0 0 512 512',
        d: 'M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z',
    },
    globe: {
        viewBox: '0 0 512 512',
        d: 'M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z',
    },
} satisfies Record<string, { viewBox: string; d: string }>;

export type OgBadge = { label: string; icon: keyof typeof ICON };

// The accent tracks the site theme: green in light mode, yellow in dark mode.
const ACCENT = {
    light: { solid: '#08c225', soft: 'rgba(8, 194, 37, 0.14)' },
    dark: { solid: '#ffd523', soft: 'rgba(255, 213, 35, 0.14)' },
} as const;

export type OgTheme = keyof typeof ACCENT;

export async function generateOgImage(
    title: string,
    subtitle: string,
    theme: OgTheme = 'dark',
    badge: OgBadge | null = null,
) {
    const accent = ACCENT[theme];
    const glyph = badge ? ICON[badge.icon] : null;
    const safeTitle = plain(title);
    const safeSubtitle = plain(subtitle);
    const safeLabel = badge ? plain(badge.label) : "";
    const textToLoad = safeTitle + safeSubtitle + safeLabel + "Jitendra Verma Portfolio ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@";
    const fontDataRegular = await loadGoogleFont("Nunito", textToLoad);
    const fontDataBold = await loadGoogleFont("Nunito:wght@700", textToLoad);

    const markupString = `
        <div style="background-color: #1a1a1a; width: 100%; height: 100%; display: flex; flex-direction: column; font-family: 'Nunito';">
            <div style="display: flex; flex-direction: column; justify-content: space-between; padding: 80px; flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; padding: 12px 28px; background-color: ${accent.soft}; border-radius: 999px; border: 2px solid ${accent.solid};">
                        <span style="color: ${accent.solid}; font-size: 26px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
                            ${safeSubtitle}
                        </span>
                    </div>
                    ${badge ? `
                    <div style="display: flex; align-items: center; padding: 12px 28px; background-color: rgba(255, 255, 255, 0.08); border-radius: 999px; border: 2px solid rgba(255, 255, 255, 0.28);">
                        <svg width="28" height="28" viewBox="${glyph!.viewBox}" fill="#e8e8e8" style="margin-right: 12px;">
                            <path d="${glyph!.d}" />
                        </svg>
                        <span style="color: #e8e8e8; font-size: 26px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
                            ${safeLabel}
                        </span>
                    </div>` : ''}
                </div>

                <div style="display: flex; color: #ffffff; font-size: 88px; font-weight: 700; line-height: 1.12; letter-spacing: -0.02em; max-width: 1040px; max-height: 320px; overflow: hidden;">
                    ${safeTitle}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: #b3b3b3; font-size: 28px; font-weight: 400;">Portfolio</span>
                        <span style="color: #ffffff; font-size: 34px; font-weight: 700;">Jitendra Verma</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; width: 84px; height: 84px; background-color: ${accent.solid}; border-radius: 22px;">
                        <span style="color: #000000; font-size: 46px; font-weight: 700;">@</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; height: 16px; background-color: ${accent.solid}; width: 100%;"></div>
        </div>
    `;

    const svg = await satori(html(markupString), {
        width: 1200,
        height: 630,
        fonts: [
            { name: "Nunito", data: fontDataRegular, weight: 400, style: "normal" },
            { name: "Nunito", data: fontDataBold, weight: 700, style: "normal" }
        ],
    });

    // satori already emits every glyph as a path, so scanning the machine's fonts
    // only costs time: about 1.3s per poster against 10ms, for the same bytes.
    const resvg = new Resvg(svg, { font: { loadSystemFonts: false } });
    const pngData = resvg.render();
    return new Uint8Array(pngData.asPng());
}
