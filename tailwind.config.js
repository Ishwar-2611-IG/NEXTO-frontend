/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // The original design used brightness-40/60/85, which are not in Tailwind's default scale
      // (so they silently rendered unfiltered). Defining them keeps the intended look.
      brightness: { 40: '.4', 60: '.6', 85: '.85' },
    },
  },
  plugins: [],
};
