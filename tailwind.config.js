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
          50: '#eef9ff',
          100: '#dcf2ff',
          200: '#b3e7ff',
          300: '#85d8ff',
          400: '#41c2ff',
          500: '#0099ff',
          600: '#007fe0',
          700: '#0064b6',
          800: '#005495',
          900: '#00457b',
          950: '#002a4d',
        },
        secondary: {
          50: '#f4f7fb',
          100: '#e9eef8',
          200: '#d8e1f4',
          300: '#c0cee8',
          400: '#a3b5da',
          500: '#8093cc',
          600: '#6574bd',
          700: '#5662a7',
          800: '#475188',
          900: '#3c456f',
          950: '#252a45',
        },
        accent: {
          50: '#f0fdfc',
          100: '#ccf9f6',
          200: '#9df3ed',
          300: '#64e5e1',
          400: '#2dcfcd',
          500: '#19b3b1',
          600: '#138f90',
          700: '#137274',
          800: '#155b5c',
          900: '#164c4d',
          950: '#042f32',
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
          800: '#252a36',
          900: '#1a1f2c',
          950: '#0d1117',
        },
        success: '#05c27b',
        warning: '#ffa500',
        error: '#ff455d',
        info: '#0099ff',
        ai: {
          blue: '#1e90ff',
          purple: '#9d00ff',
          teal: '#00e2e2',
          pink: '#ff00e5',
          glow: 'rgba(0, 153, 255, 0.5)',
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
        'ai-glow': '0 0 15px rgba(0, 153, 255, 0.6)',
        'ai-glow-lg': '0 0 30px rgba(0, 153, 255, 0.5)',
        'ai-glow-xl': '0 0 50px rgba(0, 153, 255, 0.4)',
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
        'ai-gradient': 'linear-gradient(to right, #0099ff, #9d00ff, #00e2e2)',
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