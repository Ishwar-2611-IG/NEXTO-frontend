
import type { IconType } from "react-icons";
import {
  FiAward,
  FiGlobe,
  FiUsers,
} from "react-icons/fi";

// ============================================================
// ABOUT PAGE — BRAND STATISTICS
// ============================================================

export const ABOUT_STATS = [
  { value: "2020", label: "Year Founded" },
  { value: "50K+", label: "Customers Reached" },
  { value: "10+", label: "Countries Reached" },
  { value: "100+", label: "Original Designs" },
] as const;

// ============================================================
// ABOUT PAGE — BRAND PILLARS
// ============================================================

export type AboutPillar = {
  readonly id: string;
  readonly icon: IconType;
  readonly title: string;
  readonly description: string;
};

export const ABOUT_PILLARS = [
  {
    id: "quality",
    icon: FiAward,
    title: "Made to Stand Out",
    description:
      "Considered details, quality materials, and distinctive designs made for everyday self-expression.",
  },
  {
    id: "responsibility",
    icon: FiGlobe,
    title: "Progress with Purpose",
    description:
      "We believe better choices matter. We aim to make more responsible decisions as we grow.",
  },
  {
    id: "community",
    icon: FiUsers,
    title: "Built Around Community",
    description:
      "Streetwear is more than what you wear. It is culture, individuality, and the people who shape it.",
  },
] as const satisfies readonly AboutPillar[];

// ============================================================
// ABOUT PAGE — BRAND JOURNEY
// ============================================================

export type AboutTimelineItem = {
  readonly year: string;
  readonly title: string;
  readonly description: string;
};

export const ABOUT_TIMELINE = [
  {
    year: "2020",
    title: "The Beginning",
    description:
      "NEXTO began with a vision to bring a distinctive perspective to contemporary streetwear.",
  },
  {
    year: "2021",
    title: "The First Drop",
    description:
      "Our first collection introduced the brand's identity and laid the foundation for what came next.",
  },
  {
    year: "2022",
    title: "Growing Together",
    description:
      "We expanded our presence across India and continued building a community around our designs.",
  },
  {
    year: "2023",
    title: "A More Conscious Direction",
    description:
      "We began exploring more responsible material choices and packaging alternatives.",
  },
  {
    year: "2024",
    title: "Reaching Further",
    description:
      "Our community grew to more than 50,000 customers, alongside our expansion into international shipping.",
  },
  {
    year: "2025",
    title: "The Next Chapter",
    description:
      "We continued evolving our collections while staying true to the individuality and culture that define NEXTO.",
  },
] as const satisfies readonly AboutTimelineItem[];
