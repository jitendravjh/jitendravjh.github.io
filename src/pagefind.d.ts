// Pagefind's default UI ships without TypeScript types.
declare module '@pagefind/default-ui' {
	export class PagefindUI {
		constructor(options: Record<string, unknown>);
	}
}
