/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        cosmos: {
          void: '#050811',
          deep: '#090f1e',
          nebula: '#0d1a35',
          star: '#1a2d54',
          glow: '#2563eb',
          pulse: '#3b82f6',
          aurora: '#06b6d4',
          nova: '#818cf8',
          comet: '#e2e8f0',
          dust: '#94a3b8',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'orbit': 'orbit 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s ease-in-out infinite',
      },
      keyframes: {
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(20px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(20px) rotate(-360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        scan: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        }
      }
    }
  },
  plugins: []
}
