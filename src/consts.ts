// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = '@jitendravjh';
export const SITE_DESCRIPTION = 'The personal portfolio of Jitendra Verma.';

export const SITE_URL = 'https://jitendravjh.github.io';

// Resume / CV — points to the in-site resume viewer page.
export const CV_URL = '/resume';

// GitHub repository for this website (shown in the header).
export const REPO_URL = 'https://github.com/jitendravjh/jitendravjh.github.io';

// Home page intro (old-site content).
export const INTRO = {
  heading: 'Welcome to My Portfolio Webpage',
  name: 'Jitendra Verma',
  greeting: "Hi! I'm Jitendra Verma.",
  image: '/me.jpeg',
};

export const CONTACT = {
  organization: 'Jitendra Verma',
  addressLines: [
    'India',
  ],
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
  designerName: '@jitendravjh',
  designerUrl: 'https://linkedin.com/in/jitendravjh',
  sourceLabel: 'Source',
  sourceUrl: 'https://github.com/jitendravjh/jitendravjh.github.io',
};
