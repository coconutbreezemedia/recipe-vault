import type { Config } from 'tailwindcss';

// Recipe Vault — "Dark Market" tokens (Direction B layout + Direction C dark skin)
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1A1613',        // warm near-black page
        surface: '#241E19',   // raised card
        surface2: '#2B241D',  // elevated
        ink: '#F4EEE4',       // cream text
        sub: '#C9BCA9',       // secondary text
        muted: '#9A8E7C',     // tertiary text
        brand: '#634023',     // logo brown
        green: '#A6D24F',     // fresh action green
        'green-dim': '#7FA53A',
        gold: '#C9A24B',      // section-label brass
        line: 'rgba(244,238,228,0.09)',
        line2: 'rgba(244,238,228,0.14)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: '0 10px 26px -8px rgba(166,210,79,0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
