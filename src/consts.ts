// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Jitendra Verma';
// the handle is the brand in the menu bar, the name is what tabs and shared links show
export const SITE_HANDLE = '@jitendravjh';
export const SITE_DESCRIPTION =
  'Jitendra Verma - a software developer building mobile and web apps with Flutter, Swift, and modern web tech.';

// Resume / CV - points to the in-site resume viewer page.
export const CV_URL = '/resume';
export const CV_PDF = '/resume.pdf';

// GitHub profile (shown in the header).
export const GITHUB_PROFILE = 'https://github.com/jitendravjh';

export const INTRO = {
  name: 'Jitendra Verma',
};

export const CONTACT = {
  emails: [
    'jitendravjh@gmail.com',
  ],
};

export type SocialIcon =
  | 'website'
  | 'scholar'
  | 'email'
  | 'github'
  | 'linkedin'
  | 'twitter'
  | 'instagram';

export const SOCIAL_LINKS: ReadonlyArray<{
  label: string;
  href: string;
  icon: SocialIcon;
}> = [
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/jitendravjh',
    icon: 'linkedin',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/jitendravjh',
    icon: 'github',
  },
  {
    label: 'X',
    href: 'https://twitter.com/jitendravjh',
    icon: 'twitter',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/jitendravjh',
    icon: 'instagram',
  },
  {
    label: 'Email',
    href: 'mailto:jitendravjh@gmail.com',
    icon: 'email',
  },
];

export const FOOTER_CREDIT = {
  sourceUrl: 'https://github.com/jitendravjh/jitendravjh.github.io',
};
