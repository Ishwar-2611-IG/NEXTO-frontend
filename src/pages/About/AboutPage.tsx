import { StoreImage } from '../../components/common/StoreImage';

import { useCallback, useRef } from "react";

import { Button } from "../../components/common/Button";
import { Container } from "../../components/common/Container";
import {
  HeroAside,
  HeroBanner,
} from "../../components/common/HeroBanner";
import { IMG, unsplash } from "../../constants/images";
import {
  ABOUT_PILLARS,
  ABOUT_STATS,
  ABOUT_TIMELINE,
} from "../../data/about";
import { usePageTitle } from "../../hooks/usePageTitle";

export function AboutPage() {
  usePageTitle("About");

  const journeyRef = useRef<HTMLElement>(null);

  const scrollToJourney = useCallback(() => {
    journeyRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F9F6F0] text-[#2E2D2B]">
      {/* Hero */}
      <section aria-label="Introduction to NEXTO">
        <HeroBanner
          image={unsplash(IMG.editorialStreetwear, 1800)}
          alt="NEXTO streetwear collection"
          eyebrow="OUR STORY"
          titleLines={["MORE", "THAN JUST", "CLOTHES."]}
          description="NEXTO is a streetwear brand built for dreamers, creators and the next generation. We believe style is a way to express who you are, where you come from, and where you're going."
          descriptionClassName="max-w-lg leading-relaxed"
          aside={
            <HeroAside
              lines={["SAME PEOPLE", "NEW HEIGHTS", "FALL 2025"]}
            />
          }
          heightClassName="min-h-[520px] h-[520px] sm:h-[620px]"
        >
          <Button
            size="lg"
            arrow
            className="mt-4"
            onClick={scrollToJourney}
          >
            Explore Our Journey
          </Button>
        </HeroBanner>
      </section>

      <Container className="space-y-16 py-12 pb-20 sm:space-y-20 sm:py-16">
        {/* Brand introduction and statistics */}
        <section
          aria-labelledby="brand-intro-heading"
          className="grid grid-cols-1 items-start gap-10 border-b border-[#7E7C77]/20 pb-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12"
        >
          <div className="max-w-2xl space-y-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7E7C77]">
              OUR BRAND
            </p>

            <h2
              id="brand-intro-heading"
              className="text-3xl font-semibold uppercase leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Born from
              <br />
              the streets.
            </h2>

            <p className="max-w-xl text-sm leading-7 text-[#66645F] sm:text-base">
              NEXTO started with a simple idea — to create streetwear
              that feels real. Pieces that fit into everyday life,
              yet stand out. We draw inspiration from urban culture,
              music, art and the people who move differently.
            </p>

            <Button
              arrow
              onClick={scrollToJourney}
            >
              Discover Our Story
            </Button>
          </div>

          {ABOUT_STATS.length > 0 && (
            <dl
              aria-label="NEXTO brand statistics"
              className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
            >
              {ABOUT_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex min-w-0 flex-col justify-center rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7] p-4 sm:p-6"
                >
                  <dd className="break-words text-2xl font-semibold tabular-nums sm:text-3xl">
                    {stat.value}
                  </dd>

                  <dt className="mt-2 text-[10px] uppercase tracking-wider text-[#7E7C77] sm:text-xs">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* Brand pillars */}
        {ABOUT_PILLARS.length > 0 && (
          <section aria-labelledby="brand-pillars-heading">
            <div className="mb-8 max-w-2xl space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7E7C77]">
                WHAT WE STAND FOR
              </p>

              <h2
                id="brand-pillars-heading"
                className="text-2xl font-semibold uppercase tracking-tight sm:text-4xl"
              >
                More than a look.
                <br />
                It's a mindset.
              </h2>

              <p className="max-w-xl text-sm leading-6 text-[#7E7C77]">
                The ideas behind what we create, the people we
                create it for, and the culture that inspires us.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ABOUT_PILLARS.map((pillar) => {
                const Icon = pillar.icon;

                return (
                  <article
                    key={pillar.title}
                    className="group rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7] p-6 transition-colors duration-200 hover:border-[#6B7B6E]/50 sm:p-8"
                  >
                    <div className="mb-6 flex size-12 items-center justify-center border border-[#7E7C77]/20 bg-[#6B7B6E]/[0.04] text-[#6B7B6E] transition-colors group-hover:border-[#6B7B6E]/30">
                      {Icon ? (
                        <Icon
                          className="size-6"
                          aria-hidden="true"
                          focusable="false"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="text-xl"
                        >
                          ✳
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold uppercase tracking-wider">
                      {pillar.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#7E7C77]">
                      {pillar.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Editorial image feature */}
        <section
          aria-label="NEXTO brand philosophy"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <article className="group relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden border border-[#7E7C77]/20 bg-[#F0EBE2] p-6 sm:p-8">
            <StoreImage
              src={unsplash(IMG.streetwearModel, 1000)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/10"
            />

            <div className="max-w-lg space-y-3">
              <span
                aria-hidden="true"
                className="block font-serif text-4xl leading-none text-white/85"
              >
                “
              </span>

              <h3 className="text-xl font-semibold uppercase leading-snug text-white sm:text-2xl">
                Clothes don’t change the world. People do.
              </h3>

              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
                The NEXTO philosophy
              </p>
            </div>
          </article>

          <article className="group relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden border border-[#7E7C77]/20 bg-[#F0EBE2] p-6 sm:p-8">
            <StoreImage
              src={unsplash(IMG.womensStyle, 1000)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/10"
            />

            <div className="max-w-lg space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
                MADE FOR THE NEXT
              </p>

              <h3 className="text-2xl font-semibold uppercase leading-tight text-white sm:text-3xl">
                A culture built by people.
              </h3>

              <p className="text-sm leading-6 text-white/85">
                Real stories. Real style. A community that makes
                streetwear its own.
              </p>
            </div>
          </article>
        </section>

        {/* Brand timeline */}
        <section
          ref={journeyRef}
          id="our-journey"
          aria-labelledby="journey-heading"
          tabIndex={-1}
          className="scroll-mt-28 border border-[#7E7C77]/20 bg-[#FFFCF7] p-6 outline-none focus-visible:ring-2 focus-visible:ring-[#6B7B6E] sm:p-10 lg:p-12"
        >
          <div className="flex flex-col gap-5 border-b border-[#7E7C77]/20 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#7E7C77]">
                OUR JOURNEY
              </p>

              <h2
                id="journey-heading"
                className="text-2xl font-semibold uppercase leading-tight tracking-tight sm:text-4xl"
              >
                From an idea
                <br className="hidden sm:block" /> to a movement.
              </h2>
            </div>

            <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-[#7E7C77]">
              Our story, in moments
            </span>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-6 text-[#7E7C77]">
            Every brand has a beginning. These milestones capture
            the story NEXTO wants to tell as it grows.
          </p>

          {ABOUT_TIMELINE.length > 0 ? (
            <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ABOUT_TIMELINE.map((step) => (
                <li
                  key={`${step.year}-${step.title}`}
                  className="flex min-h-[180px] flex-col border border-[#7E7C77]/20 bg-[#F0EBE2] p-5 sm:p-6"
                >
                  <p className="font-mono text-xl font-semibold tabular-nums text-[#6B7B6E]">
                    {step.year}
                  </p>

                  <h3 className="mt-4 text-sm font-bold uppercase leading-relaxed tracking-wide">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#7E7C77]">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-8 text-sm text-[#7E7C77]">
              Our journey is still being written. Check back for
              future milestones.
            </p>
          )}
        </section>
      </Container>
    </div>
  );
}
