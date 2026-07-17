/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14182B',
          light: '#1E2338',
          lighter: '#2A3049',
        },
        paper: '#F4F5F7',
        surface: '#FFFFFF',
        border: '#E2E4EA',
        ink2: '#6B7080',
        gold: {
          DEFAULT: '#E8A73B',
          dark: '#C98F2B',
          light: '#F6D9A3',
        },
        steel: {
          DEFAULT: '#3E6FA6',
          dark: '#2E5580',
          light: '#DCE7F2',
        },
        status: {
          new: '#8B93A7',
          assigned: '#3E6FA6',
          progress: '#E8A73B',
          hold: '#C1622C',
          completed: '#2E9E7C',
          closed: '#2B2F45',
          cancelled: '#B94A48',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 24, 43, 0.06), 0 1px 8px rgba(20, 24, 43, 0.04)',
        pop: '0 8px 24px rgba(20, 24, 43, 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
    },
  },
  plugins: [],
}
