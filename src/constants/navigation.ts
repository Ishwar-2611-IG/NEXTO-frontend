
export type NavLink = {
  label: string;
  target: string;
};

export type FooterLink = {
  label: string;
  target: string;
};

export type FooterGroup = {
  title: string;
  links: FooterLink[];
};

export type SocialPlatform = "facebook" | "instagram" | "x" | "linkedin";

export type SocialLink = {
  label: string;
  platform: SocialPlatform;
  href: string | null;
};

export const NAV_LINKS: NavLink[] = [
  { label: "Men", target: "men" },
  { label: "Women", target: "women" },
  { label: "Collections", target: "products" },
  { label: "New Arrivals", target: "products" },
  { label: "Accessories", target: "accessories" },
  { label: "About", target: "story" },
];

export const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: "Shop",
    links: [
      { label: "Men", target: "men" },
      { label: "Women", target: "women" },
      { label: "Accessories", target: "accessories" },
      { label: "New Arrivals", target: "products" },
      { label: "Best Sellers", target: "products" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQs", target: "faq" },
      { label: "Shipping", target: "shipping" },
      { label: "Returns", target: "returns" },
      { label: "Size Guide", target: "size-guide" },
      { label: "Contact Us", target: "contact" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", target: "story" },
      { label: "Sustainability", target: "sustainability" },
      { label: "Journal", target: "journal" },
      { label: "Careers", target: "careers" },
    ],
  },
];

export const LEGAL_LINKS: FooterLink[] = [
  { label: "Terms", target: "terms" },
  { label: "Privacy", target: "privacy" },
  { label: "Cookies", target: "cookies" },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "Facebook", platform: "facebook", href: "https://www.facebook.com/nexoto" },
  { label: "Instagram", platform: "instagram", href: "https://www.instagram.com/nexoto" },
  { label: "X", platform: "x", href: "https://twitter.com/nexoto" },
  { label: "LinkedIn", platform: "linkedin", href: "https://www.linkedin.com/company/nexoto" },
];
