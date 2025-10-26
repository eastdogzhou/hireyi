/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Orange theme colors - Tailwind Orange (as per task plan)
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',  // Primary Light
          500: '#f97316',  // Primary (Main)
          600: '#ea580c',  // Primary Dark
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Status colors
        success: {
          500: '#10b981',  // Green
        },
        warning: {
          500: '#f59e0b',  // Yellow
        },
        error: {
          500: '#ef4444',   // Red
        },
        info: {
          500: '#3b82f6',   // Blue
        },
        // Gray scale
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'orange': '0 10px 30px rgba(255, 107, 53, 0.15)',
        'orange-lg': '0 20px 60px rgba(255, 107, 53, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        pulseOrange: {
          '0%, 100%': {
            backgroundColor: 'rgba(255, 107, 53, 0.1)'
          },
          '50%': {
            backgroundColor: 'rgba(255, 107, 53, 0.2)'
          },
        },
      },
    },
  },
  plugins: [],
}