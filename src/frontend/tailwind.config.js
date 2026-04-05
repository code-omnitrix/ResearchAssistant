export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                canvas: '#3C3B39',
                surface1: '#464543',
                surface2: '#53514E',
                // Phase colors – Soft Stone
                'phase-hook': '#E08A78',
                'phase-foundation': '#7A9BBC',
                'phase-mechanism': '#9DB396',
                'phase-evidence': '#B89BD0',
                'phase-implications': '#E08A78',
                'phase-synthesis': '#E08A78',
                'phase-comparison': '#D4976B',
                'phase-query': '#9DB396',
                // Phase color aliases
                'phase-amber': '#E08A78',
                'phase-blue': '#7A9BBC',
                'phase-teal': '#9DB396',
                'phase-violet': '#B89BD0',
                'phase-rose': '#E08A78',
                'phase-orange': '#D4976B',
                'phase-green': '#9DB396',
                // Soft Stone accents
                'accent-clay': '#E08A78',
                'accent-blue': '#7A9BBC',
                'accent-matcha': '#9DB396',
                // Text
                text1: '#F2EFE9',
                text2: '#B8B5B0',
                text3: '#858380',
            },
            boxShadow: {
                glass: '0 24px 48px rgba(0, 0, 0, 0.25)',
            },
            fontFamily: {
                display: ['Instrument Serif', 'Georgia', 'serif'],
                body: ['Geist', 'system-ui', 'sans-serif'],
                mono: ['Berkeley Mono', 'JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
};
