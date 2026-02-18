/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff3e0',
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',
          950: '#FF5722', // Using the specific orange requested as primary accent
        },
        secondary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
          950: '#1a1a1a',
        },
        accent: {
          50: '#fff8e1',
          100: '#ffecb3',
          200: '#ffe082',
          300: '#ffd54f',
          400: '#ffca28',
          500: '#ffc107',
          600: '#ffb300',
          700: '#ffa000',
          800: '#ff8f00',
          900: '#ff6f00',
          950: '#FF5722',
        },
        dark: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#323845',
          800: '#121212',
          900: '#0a0a0a',
          950: '#000000',
        },
        success: '#05c27b',
        warning: '#ffa500',
        error: '#ff455d',
        info: '#FF5722',
        ai: {
          blue: '#FF5722', // Replaced blue with orange
          purple: '#ff9800', // Replaced purple with lighter orange
          teal: '#ffcc80', // Replaced teal with pale orange
          pink: '#e65100', // Replaced pink with dark orange
          glow: 'rgba(255, 87, 34, 0.5)',
        },
        portfolio: {
          orange: '#FF5722',
          'orange-hover': '#F4511E',
          dark: '#0a0a0a',
          card: '#111111',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.primary.500), 0 0 20px theme(colors.primary.500)',
        'neon-lg': '0 0 10px theme(colors.primary.500), 0 0 30px theme(colors.primary.500)',
        'neon-accent': '0 0 5px theme(colors.accent.500), 0 0 20px theme(colors.accent.500)',
        'ai-glow': '0 0 15px rgba(255, 87, 34, 0.6)',
        'ai-glow-lg': '0 0 30px rgba(255, 87, 34, 0.5)',
        'ai-glow-xl': '0 0 50px rgba(255, 87, 34, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 1.5s infinite',
        'gradient-flow': 'gradient-flow 8s ease infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'typing': 'typing 3.5s steps(40, end), blink-caret .75s step-end infinite',
        'bounce-slow': 'bounce 5s ease-in-out infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'scan-line': 'scan-line 2s linear infinite',
        'rotate-slow': 'rotate 8s linear infinite',
        'vibrate': 'vibrate 0.3s linear infinite',
        'orbit': 'orbit 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 153, 255, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 153, 255, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'gradient-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: 'theme(colors.ai.blue)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' }
        },
        'scan-line': {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(10px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(10px) rotate(-360deg)' }
        },
        'vibrate': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' }
        }
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'ai-grid': 'linear-gradient(rgba(39, 55, 77, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(39, 55, 77, 0.05) 1px, transparent 1px)',
        'ai-dots': 'radial-gradient(circle, rgba(39, 55, 77, 0.1) 1px, transparent 1px)',
        'ai-gradient': 'linear-gradient(to right, #FF5722, #ff9800, #ffcc80)',
      },
      backgroundSize: {
        'ai-grid': '30px 30px',
        'ai-dots': '20px 20px',
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
} 