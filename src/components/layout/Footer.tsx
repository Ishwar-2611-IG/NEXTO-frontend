import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  FOOTER_GROUPS,
  LEGAL_LINKS,
  SOCIAL_LINKS,
} from '../../constants/navigation';
import { ROUTES } from '../../constants/routes';
import { useToast } from '../../hooks/useToast';
import { SocialIcon } from './footer/SocialIcon';
import { isSocialPlatform } from './footer/socialPlatforms';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const focusRing =
  'rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6B7B6E]';

const interactive = `transition-colors duration-200 motion-reduce:transition-none ${focusRing}`;

const linkStyles = `inline-block py-1.5 text-sm leading-normal text-[#66645F] no-underline hover:text-[#6B7B6E] ${interactive}`;

const legalLinkStyles = `inline-block py-1 text-sm font-bold text-[#7E7C77] no-underline hover:text-[#6B7B6E] ${interactive}`;

const headingStyles =
  'text-sm font-extrabold uppercase tracking-[0.16em] text-[#2E2D2B]';

const FOOTER_LINK_DESTINATIONS: Record<string, string> = {
  men: ROUTES.men,
  women: ROUTES.women,
  accessories: ROUTES.accessories,
  products: ROUTES.collections,
  faq: ROUTES.support,
  shipping: ROUTES.support,
  returns: ROUTES.support,
  'size-guide': ROUTES.support,
  contact: ROUTES.support,
  story: ROUTES.about,
  sustainability: ROUTES.about,
  journal: ROUTES.about,
  careers: ROUTES.about,
  terms: ROUTES.support,
  privacy: ROUTES.support,
  cookies: ROUTES.support,
};

const activeSocialLinks = SOCIAL_LINKS.filter(
  (social): social is typeof social & { href: string } =>
    isSocialPlatform(social.platform) &&
    typeof social.href === 'string' &&
    /^https?:\/\/\S+$/i.test(social.href.trim()),
);

export function Footer() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const currentYear = new Date().getFullYear();

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      showToast('Please enter a valid email address');
      return;
    }
    showToast('Subscribed!');
    setEmail('');
  };

  return (
    <footer id="footer" className="w-full border-t border-[#7E7C77]/20 bg-[#F0EBE2] text-[#2E2D2B]">
      <div className="mx-auto grid min-w-0 max-w-screen-2xl grid-cols-2 gap-x-5 gap-y-10 px-6 py-12 md:grid-cols-3 md:gap-x-8 md:px-[4.8vw] md:py-14 lg:grid-cols-[1.15fr_1.8fr_repeat(3,minmax(0,0.6fr))] lg:gap-x-12 lg:px-[4.8vw] lg:pb-9 lg:pt-14">
        <section
          aria-labelledby="footer-brand-heading"
          className="col-span-full min-w-0 lg:col-span-1"
        >
          <h2 id="footer-brand-heading" className="sr-only">
            About NEXTO
          </h2>

          <Link
            to={ROUTES.home}
            aria-label="NEXTO home"
            className={`inline-block w-max text-7xl font-extrabold leading-none tracking-[-0.08em] text-[#2E2D2B] no-underline hover:opacity-80 ${interactive}`}
          >
            NEXTO
          </Link>

          <p className="mb-5 mr-3 mt-3 max-w-xs text-sm leading-relaxed text-[#66645F]">
                Streetwear for what&apos;s next.
          </p>

          {activeSocialLinks.length > 0 && (
            <nav aria-label="NEXTO social media">
              <ul className="flex flex-wrap items-center gap-2">
                {activeSocialLinks.map(({ label, platform, href }) => (
                  <li key={platform}>
                    <a
                      href={href.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit NEXTO on ${label} (opens in a new tab)`}
                      className={`inline-flex size-12 items-center justify-center rounded-full text-[#66645F] transition-colors duration-200 hover:bg-[#6B7B6E]/10 hover:text-[#6B7B6E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E] motion-reduce:transition-none`}
                    >
                      <SocialIcon platform={platform} className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </section>

        <section
          aria-labelledby="footer-newsletter-heading"
          className="col-span-full min-w-0 lg:col-span-1"
        >
          <h2
            id="footer-newsletter-heading"
            className={headingStyles + ' mb-3'}
          >
            Join the Movement
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-[#66645F]">
            Get early access to new drops, exclusive offers, and more.
          </p>
          <form
            onSubmit={handleSubscribe}
            noValidate
            className="flex h-11 w-full max-w-[340px] overflow-hidden rounded-md border border-[#7E7C77]/25 bg-[#FFFCF7] transition-colors duration-200 hover:border-[#6B7B6E]/60 focus-within:border-[#6B7B6E] focus-within:ring-2 focus-within:ring-[#6B7B6E]/15 motion-reduce:transition-none"
          >
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-[#2E2D2B] outline-none placeholder:text-[#7E7C77] focus:outline-none sm:text-sm"
            />
            <button
              type="submit"
              className={`h-full shrink-0 border-0 bg-[#526457] px-4 text-[10px] font-extrabold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-[#445549] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-black motion-reduce:transition-none`}
            >
              Join
            </button>
          </form>
        </section>

        {FOOTER_GROUPS.map((group) => {
          const headingId = `footer-nav-${group.title
            .toLowerCase()
            .replace(/\s+/g, '-')}`;

          return (
            <nav
              key={group.title}
              aria-labelledby={headingId}
              className="min-w-0"
            >
              <h2 id={headingId} className={`${headingStyles} mb-3`}>
                {group.title}
              </h2>
              <ul className="flex flex-col items-start gap-1">
                {group.links.map(({ label, target }) => (
                  <li key={`${target}-${label}`}>
                    <Link
                      to={FOOTER_LINK_DESTINATIONS[target] ?? ROUTES.home}
                      className={linkStyles}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          );
        })}
      </div>

      <div className="border-t border-[#7E7C77]/20">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-start gap-3 px-6 py-6 md:min-h-[72px] md:flex-row md:items-center md:justify-between md:gap-6 lg:px-[4.8vw]">
          <p className="m-0 text-sm text-[#7E7C77]">
            © {currentYear} NEXTO. All rights reserved.
          </p>
          <nav aria-label="Legal information">
            <ul className="flex flex-wrap gap-x-9 gap-y-2 text-sm">
              {LEGAL_LINKS.map(({ label, target }) => (
                <li key={target}>
                  <Link
                    to={FOOTER_LINK_DESTINATIONS[target] ?? ROUTES.support}
                    className={legalLinkStyles}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
