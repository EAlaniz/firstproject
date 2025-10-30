/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@coinbase/onchainkit/**/*.js',
  ],
  darkMode: 'class',
  corePlugins: {
    preflight: false, // Disable Tailwind's CSS reset - it conflicts with OnchainKit
  },
  theme: {
    extend: {
      colors: {
        // Base.dev Purple-Blue Primary
        brand: {
          50: 'rgba(117, 117, 255, 0.05)',
          100: 'rgba(117, 117, 255, 0.1)',
          200: 'rgba(117, 117, 255, 0.2)',
          300: 'rgba(117, 117, 255, 0.4)',
          400: 'rgba(117, 117, 255, 0.7)',
          500: '#7575FF',         // base.dev --color-fgPrimary
          600: 'rgb(87, 139, 250)', // base.dev --color-bgPrimary
          700: '#6060FF',
          800: '#4A4AFF',
          900: '#3535FF',
        },
        // Base.dev Semantic Colors
        success: '#7FD057',       // base.dev --color-fgPositive
        warning: 'rgb(248, 150, 86)', // base.dev --color-fgWarning
        danger: '#F0616D',        // base.dev --color-fgNegative
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', 'Source Code Pro', 'monospace'],
      },
      fontSize: {
        // Base.dev Typography Scale
        'caption': ['0.8125rem', '1rem'],      // 13px / 16px
        'label-1': ['0.875rem', '1.25rem'],    // 14px / 20px
        'label-2': ['0.875rem', '1.25rem'],    // 14px / 20px
        'body': ['1rem', '1.5rem'],            // 16px / 24px
        'headline': ['1rem', '1.5rem'],        // 16px / 24px
        'title-4': ['1.25rem', '1.75rem'],     // 20px / 28px
        'title-3': ['1.5rem', '1.75rem'],      // 24px / 28px
        'title-2': ['1.75rem', '2.25rem'],     // 28px / 36px
        'title-1': ['1.75rem', '2.25rem'],     // 28px / 36px
        'display-3': ['2.5rem', '3rem'],       // 40px / 48px
        'display-2': ['3rem', '3.5rem'],       // 48px / 56px
        'display-1': ['4rem', '4.5rem'],       // 64px / 72px
      },
      spacing: {
        // Base.dev 8px Grid System
        '0': '0px',
        '0.25': '2px',
        '0.5': '4px',
        '0.75': '6px',
        '1': '8px',
        '1.5': '12px',
        '2': '16px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '7': '56px',
        '8': '64px',
        '9': '72px',
        '10': '80px',
      },
      borderRadius: {
        // Base.dev Border Radius System
        'none': '0px',
        '100': '2px',
        '200': '4px',
        '300': '6px',
        '400': '8px',
        '500': '12px',
        '600': '16px',
        '700': '20px',
        '800': '24px',
        '900': '28px',
        '1000': '100000px',
        // Aliases for common names
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '100000px',
      },
      boxShadow: {
        // Base.dev Elevation Shadows
        'elevation-1': '0px 8px 12px rgba(0, 0, 0, 0.12)',
        'elevation-2': '0px 8px 24px rgba(0, 0, 0, 0.12)',
      },
      transitionTimingFunction: {
        'base': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '150ms',
        'base': '250ms',
        'slow': '350ms',
      },
      height: {
        'nav': '60px',
        'nav-mobile': '56px',
      },
    },
  },
  plugins: [],
};
