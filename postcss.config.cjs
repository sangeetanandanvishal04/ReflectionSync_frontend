// postcss.config.cjs
module.exports = {
  plugins: [
    // use the Tailwind -> PostCSS adapter
    require('@tailwindcss/postcss')(),
    require('autoprefixer')(),
  ],
};