import { createRouter, createWebHistory } from 'vue-router'
import UrlShortener from '../views/UrlShortener.vue'
import RedirectHandler from '../views/RedirectHandler.vue'



const routes = [
  {
    path: '/',
    name: 'home',
    component: UrlShortener
  },
  {
    path: '/:code',
    name: 'redirect',
    component: RedirectHandler
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
