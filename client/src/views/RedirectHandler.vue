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
    window.location.href = `http://localhost:5000/${code}`
    // Create API instance with proper configuration
    const api = axios.create({
      baseURL: 'http://localhost:5000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // UPDATED: Use the correct endpoint path - note that we're removing "/api/url"
    const response = await api.get(`/${code}`)

    // Since the backend is doing a redirect, this code won't actually execute
    // The browser will follow the redirect automatically

    // But in case the backend returns JSON instead:
    if (response.data && response.data.longUrl) {
      window.location.replace(response.data.longUrl)
    }
  } catch (error) {
    console.error('Redirect error:', error.response || error)
    isLoading.value = false

    errorMessage.value = error.response?.status === 404
      ? 'URL not found or expired'
      : 'Error accessing URL. Please try again.'

    // Navigate back to home after 3 seconds
    setTimeout(() => {
      router.push({
        path: '/',
        query: { error: errorMessage.value }
      })
    }, 3000)
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
      <div v-else class="bg-red-50 border-l-4 border-red-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
            <p class="text-sm text-red-700 mt-2">Redirecting to homepage...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
