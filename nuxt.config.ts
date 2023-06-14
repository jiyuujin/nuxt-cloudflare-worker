import svgLoader from 'vite-svg-loader'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  srcDir: 'app/',
  css: ['~/assets/main.css'],
  vite: {
    plugins: [
      svgLoader({
        svgo: false,
      }),
    ],
  },
})
