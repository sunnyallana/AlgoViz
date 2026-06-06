/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces (deep slate-blue dev-tool dark, never pure black)
        abyss: '#070A12',        // page background
        panel: '#0D1220',        // cards / sidebar
        raised: '#141B2D',       // elevated surfaces, inputs
        overlay: '#1A2336',      // hover states on raised
        line: '#1E2740',         // default borders
        'line-bright': '#2C3A5C',// emphasized borders
        // Text
        fg: '#E8ECF4',
        muted: '#94A0B8',
        faint: '#5C6880',
        // Brand (evolved from legacy #8963f4)
        brand: {
          DEFAULT: '#8B5CF6',
          bright: '#A78BFA',
          deep: '#6D45D9',
          ghost: 'rgba(139, 92, 246, 0.12)',
        },
        accent: '#22D3EE',       // cyan — pivots, pointers, special markers
        // Algorithm state colors
        compare: '#FBBF24',      // amber — elements being compared
        action: '#FB7185',       // rose — swaps / writes / rejections
        mint: '#34D399',         // emerald — sorted / found / best result
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(139, 92, 246, 0.35)',
        'glow-sm': '0 0 12px rgba(139, 92, 246, 0.25)',
        'glow-mint': '0 0 16px rgba(52, 211, 153, 0.45)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.4)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'found-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(52, 211, 153, 0.6)' },
          '50%': { boxShadow: '0 0 0 8px rgba(52, 211, 153, 0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'found-pulse': 'found-pulse 1.2s ease-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        blink: 'blink 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
