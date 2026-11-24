const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: token('bg'),
        surface: token('surface'),
        subtle: token('subtle'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        brand: { DEFAULT: token('brand'), text: token('brand-text'), fg: token('brand-fg') },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 6px 20px rgb(15 23 42 / 0.05)',
        pop: '0 12px 40px rgb(15 23 42 / 0.18)',
      },
    },
  },
  plugins: [],
};
