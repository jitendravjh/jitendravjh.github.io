import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { generateOgImage, type OgBadge, type OgTheme } from "../utils/generateOgImage";
import { SITE_TITLE } from "../consts";
import projectsData from "../data/projects.json";

type OgPage = { route: string; title: string; subtitle: string; badge?: OgBadge | null };

export async function getStaticPaths() {
    const posts = await getCollection('blog');

    // Base static pages
    const staticPages: OgPage[] = [
        { route: 'og', title: SITE_TITLE, subtitle: 'Software Developer' },
        { route: 'about', title: 'About', subtitle: SITE_TITLE },
        { route: 'projects', title: 'Projects', subtitle: SITE_TITLE },
        { route: 'blog', title: 'Blog', subtitle: SITE_TITLE },
    ];

    // Dynamic blog posts
    const blogPages: OgPage[] = posts.map((post) => ({
        route: `blog/${post.id}`,
        title: post.data.title,
        subtitle: 'Blog Post',
    }));

    // The badge names where the card's primary link goes, so the poster says it
    // too and both pills share one line.
    const destination = (href?: string): OgBadge | null => {
        if (!href) return null;
        if (href.includes('play.google.com')) return { label: 'Play Store', icon: 'play' };
        if (href.includes('github.com')) return { label: 'GitHub', icon: 'github' };
        return { label: 'Live', icon: 'globe' };
    };

    const projectPages: OgPage[] = projectsData.map((project) => ({
        route: `projects/${project.id}`,
        title: project.title,
        subtitle: project.status === 'Open Source' ? 'Open Source Contribution' : 'Project',
        badge: destination(project.links?.[0]?.href),
    }));

    // Each image is rendered twice so the poster's accent can follow the site
    // theme: `<name>.png` is the dark/yellow one (also what social previews get)
    // and `<name>-light.png` is the green one shown in light mode.
    return [...staticPages, ...blogPages, ...projectPages].flatMap((page) =>
        (['dark', 'light'] as const).map((theme) => ({
            params: { route: theme === 'dark' ? page.route : `${page.route}-light` },
            props: { title: page.title, subtitle: page.subtitle, theme, badge: page.badge ?? null },
        })),
    );
}

export const GET: APIRoute = async ({ props }) => {
    return new Response(
        await generateOgImage(props.title as string, props.subtitle as string, props.theme as OgTheme, props.badge as OgBadge | null),
        { headers: { "Content-Type": "image/png" } },
    );
};
