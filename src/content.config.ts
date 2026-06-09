import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

type SchemaContext = { image: () => any };

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }: SchemaContext) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			authors: z.array(z.string()).optional(), // References 'id' in authors.json
			toc: z.boolean().optional(),
			tags: z.array(z.string()).optional(),
			// External post: when set, listings link to this URL (new tab) instead of a local page.
			externalUrl: z.string().url().optional(),
			// Where an external post is published (e.g. "GeeksforGeeks", "Medium").
			source: z.string().optional(),
		}),
});

export const collections = { blog };
