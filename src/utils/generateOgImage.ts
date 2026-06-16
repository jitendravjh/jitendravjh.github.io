import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { html } from 'satori-html';

async function loadGoogleFont(font: string, text: string) {
    const API = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(API, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1" }
    })).text();
    const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);
    if (!resource) throw new Error("Failed to download dynamic font");
    const res = await fetch(resource[1]);
    return res.arrayBuffer();
}

export async function generateOgImage(title: string, subtitle: string) {
    const textToLoad = title + subtitle + "Jitendra Verma Portfolio ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@";
    const fontDataRegular = await loadGoogleFont("Nunito", textToLoad);
    const fontDataBold = await loadGoogleFont("Nunito:wght@700", textToLoad);

    const markup = html`
        <div style="background-color: #1a1a1a; width: 100%; height: 100%; display: flex; flex-direction: column; font-family: 'Nunito';">
            <div style="display: flex; flex-direction: column; justify-content: space-between; padding: 80px; flex: 1;">
                <div style="display: flex;">
                    <div style="display: flex; align-items: center; padding: 12px 28px; background-color: rgba(255, 213, 35, 0.14); border-radius: 999px; border: 2px solid #ffd523;">
                        <span style="color: #ffd523; font-size: 26px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;">
                            ${subtitle}
                        </span>
                    </div>
                </div>

                <div style="display: flex; color: #ffffff; font-size: 88px; font-weight: 700; line-height: 1.12; letter-spacing: -0.02em; max-width: 1040px; max-height: 320px; overflow: hidden;">
                    ${title}
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="color: #b3b3b3; font-size: 28px; font-weight: 400;">Portfolio</span>
                        <span style="color: #ffffff; font-size: 34px; font-weight: 700;">Jitendra Verma</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; width: 84px; height: 84px; background-color: #ffd523; border-radius: 22px;">
                        <span style="color: #000000; font-size: 46px; font-weight: 700;">@</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; height: 16px; background-color: #ffd523; width: 100%;"></div>
        </div>
    `;

    const svg = await satori(markup, {
        width: 1200,
        height: 630,
        fonts: [
            { name: "Nunito", data: fontDataRegular, weight: 400, style: "normal" },
            { name: "Nunito", data: fontDataBold, weight: 700, style: "normal" }
        ],
    });

    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    return new Uint8Array(pngData.asPng());
}
