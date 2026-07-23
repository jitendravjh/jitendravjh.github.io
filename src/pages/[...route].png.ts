import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { generateOgImage, type OgTheme } from "../utils/generateOgImage";
import { SITE_TITLE } from "../consts";
import projectsData from "../data/projects.json";

export async function getStaticPaths() {
    const posts = await getCollection('blog');

    // Base static pages
    const staticPages = [
        { route: 'og', title: SITE_TITLE, subtitle: 'Software Developer' },
        { route: 'about', title: 'About', subtitle: SITE_TITLE },
        { route: 'projects', title: 'Projects', subtitle: SITE_TITLE },
        { route: 'blog', title: 'Blog', subtitle: SITE_TITLE },
    ];

    // Dynamic blog posts
    const blogPages = posts.map((post) => ({
        route: `blog/${post.id}`,
        title: post.data.title,
        subtitle: 'Blog Post',
    }));

    const projectPages = projectsData.map((project) => ({
        route: `projects/${project.id}`,
        title: project.title,
        subtitle: 'Project',
    }));

    // Each image is rendered twice so the poster's accent can follow the site
    // theme: `<name>.png` is the dark/yellow one (also what social previews get)
    // and `<name>-light.png` is the green one shown in light mode.
    return [...staticPages, ...blogPages, ...projectPages].flatMap((page) =>
        (['dark', 'light'] as const).map((theme) => ({
            params: { route: theme === 'dark' ? page.route : `${page.route}-light` },
            props: { title: page.title, subtitle: page.subtitle, theme },
        })),
    );
}

export const GET: APIRoute = async ({ props }) => {
    const safeTitle = (props.title as string).replace(/&/g, 'and');
    return new Response(
        await generateOgImage(safeTitle, props.subtitle as string, props.theme as OgTheme),
        { headers: { "Content-Type": "image/png" } },
    );
};
