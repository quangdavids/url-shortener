<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { redirectService } from '../helpers/api.js'

const route = useRoute()
const router = useRouter()
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const code = route.params.code
    console.log('Redirecting with code:', code)

    // For debugging - log the full request details
    console.log('Making request to:', `${redirectService.baseURL}/${code}`)

    const response = await redirectService.getRedirectUrl(code)
    console.log('Response received:', response)

    // Check both possible response structures
    if (response.data && response.data.longUrl) {
      // Direct structure from API
      window.location.href = response.data.longUrl
    } else if (response.data && response.data.success && response.data.longUrl) {
      // Success wrapper structure
      window.location.href = response.data.longUrl
    } else {
      console.error('Unexpected response structure:', response.data)
      throw new Error('Invalid response format from server')
    }
  } catch (error) {
    console.error('Redirect error:', error)
    // Log more detailed error information
    if (error.response) {
      console.error('Error response:', error.response.data)
      console.error('Error status:', error.response.status)
    }

    isLoading.value = false

    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = 'URL not found or has expired'
    }

    // Navigate back to home after 10 seconds
    setTimeout(() => {
      router.push({
        path: '/',
        query: { error: errorMessage.value }
      })
    }, 10000)
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
