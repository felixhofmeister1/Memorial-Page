// The foundation's main menu, reproduced so these pages sit inside the same site.
// Labels and structure come from padrewassonfoundation.org (LOVE / MEET / DISCOVER / SHARE).
// `verified: false` marks addresses that could not yet be checked against the live site;
// see DESIGN.md. Until then they point to the home page.

export const FOUNDATION_URL = 'https://padrewassonfoundation.org';

export type MenuLink = { label: string; href: string; verified: boolean; current?: boolean };
export type MenuSection = { label: string; links: MenuLink[] };

const page = (path: string) => `${FOUNDATION_URL}${path}`;
const unverified = (label: string): MenuLink => ({ label, href: page('/'), verified: false });

export const MAIN_MENU: MenuSection[] = [
  {
    label: 'LOVE',
    links: [
      { label: 'Purpose (why)', href: page('/padre-wasson'), verified: true },
      { label: 'Sauce (how)', href: page('/philosophy'), verified: true },
      { label: 'Foundation (what)', href: page('/legacy'), verified: true },
      unverified('History'),
    ],
  },
  {
    label: 'MEET',
    links: [
      { label: 'Padre Wasson', href: page('/padre-wasson-2'), verified: true },
      { label: 'Founders', href: page('/founders'), verified: true },
      unverified('Family'),
      unverified('Alumni'),
      // This app. The path is relative so it works on any domain it is deployed to.
      { label: 'Remembered', href: '/remembered', verified: true, current: true },
      { label: 'Team', href: page('/team'), verified: true },
      unverified('You'),
    ],
  },
  {
    label: 'DISCOVER',
    links: [
      unverified('Facts'),
      { label: 'Actions', href: page('/about-us'), verified: true },
      unverified('Visions'),
      unverified('Blog'),
      unverified('Reports'),
      { label: 'Partners', href: page('/partners'), verified: true },
    ],
  },
  {
    label: 'SHARE',
    links: [
      unverified('Participate'),
      unverified('Donate'),
      { label: 'Shop', href: page('/shop'), verified: true },
      unverified('Share big'),
      unverified('Share forever'),
    ],
  },
];

export const FOUNDATION_IMPRESSUM_URL = page('/impressum');
export const FOUNDATION_EMAIL = 'info@padrewassonfoundation.org';
