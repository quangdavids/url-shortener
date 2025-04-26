<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const code = route.params.code
    console.log('Redirecting with code:', code)

    const api = axios.create({
      baseURL: 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'  // Important: Tell backend this is an API request
      },
      withCredentials: true  // Send cookies if you're using authentication
    })

    const response = await api.get(`/${code}`)

    if (response.data && response.data.success && response.data.longUrl) {
      // Now we handle the redirect on the frontend
      window.location.href = response.data.longUrl
    } else {
      throw new Error('Invalid response from server')
    }
  } catch (error) {
    console.error('Redirect error:', error.response || error)
    isLoading.value = false

    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = 'URL not found or has expired'
    }

    // Navigate back to home after 5 seconds
    setTimeout(() => {
      router.push({
        path: '/',
        query: { error: errorMessage.value }
      })
    }, 5000)
  }
})
</script>
<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div v-if="isLoading">
        <h2 class="text-xl font-semibold text-gray-700">Redirecting...</h2>
        <div class="mt-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
      <div v-else>
        <h2 class="text-xl font-semibold text-red-600">Error</h2>
        <p class="mt-4 text-gray-700">{{ errorMessage }}</p>
        <p class="mt-4 text-gray-500">You will be redirected to the home page in 10 seconds.</p>
        <p class="mt-4 text-gray-500">If not, click <router-link to="/">here</router-link>.</p>
        <div class="mt-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          
        </div>
      </div>

    </div>
  </div>
</template>
