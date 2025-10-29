/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EBF2FF',
          100: '#D6E4FF',
          200: '#ADC9FF',
          300: '#85AFFF',
          400: '#5C94FF',
          500: '#0052FF',  // Official Base Blue from base.org
          600: '#3D6FFF',
          700: '#1A5AFF',
          800: '#0042CC',
          900: '#002E99',
        },
        neutral: {
          50: '#F7F8FA',     // Light grays
          100: '#EEF0F3',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#667085',
          600: '#3E4852',
          700: '#14171A',    // Near-black for text
          800: '#0A0A0A',    // Dark surfaces
          900: '#000000',    // Pure black background
        },
        success: '#00BFA6',
        warning: '#FFC801',
        danger: '#FF4D4D',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.625' }],
        xl: ['20px', { lineHeight: '1.625' }],
        '2xl': ['24px', { lineHeight: '1.375' }],
        '3xl': ['32px', { lineHeight: '1.2' }],
        '4xl': ['44px', { lineHeight: '1.2' }],
        '5xl': ['56px', { lineHeight: '1.2' }],
        '6xl': ['72px', { lineHeight: '1.2' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
        32: '128px',
        40: '160px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(16,24,40,0.04)',
        sm: '0 1px 2px rgba(16,24,40,0.06)',
        md: '0 4px 12px rgba(16,24,40,0.08)',
        lg: '0 8px 20px rgba(16,24,40,0.10)',
        xl: '0 12px 32px rgba(16,24,40,0.12)',
        '2xl': '0 20px 48px rgba(16,24,40,0.15)',
      },
      transitionTimingFunction: {
        base: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '350ms',
      },
    },
  },
  plugins: [],
};
