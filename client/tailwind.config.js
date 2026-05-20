export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        body: ['var(--font-body)', 'sans-serif']
      },
      colors: {
        accent: 'var(--color-accent)',
        ink: 'var(--color-ink)',
        paper: 'var(--color-paper)'
      }
    }
  },
  plugins: []
};
