// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/style/theme.scss'],

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/test-utils',
  ],
  
  app: {
    baseURL: '/BTSE-test',
    buildAssetsDir: "/nuxt/"
  }
})