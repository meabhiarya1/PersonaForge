/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#17201c',
        steel: '#44524c',
        mist: '#eef3ef',
        line: '#d7dfd9',
        teal: '#0f766e',
        coral: '#c2410c',
        gold: '#b45309'
      },
      boxShadow: {
        soft: '0 18px 55px rgba(23, 32, 28, 0.10)'
      }
    }
  },
  plugins: []
};
