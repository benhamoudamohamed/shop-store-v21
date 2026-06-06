module.exports = {
  plugins: [
    require('@tailwindcss/postcss')({ config: './apps/client/tailwind.config.js' }),
    require('autoprefixer'),
  ],
}
