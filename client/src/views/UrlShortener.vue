<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { urlService, transformUrlData, storeUrlsLocally } from '../helpers/api.js'

// Reactive form data
const formData = reactive({
  longUrl: '',
  customCode: '',
  expiryDays: 10,
  trackClicks: true,
})

const urls = ref([])
const isLoading = ref(false)
const error = ref('')
const successMessage = ref('')
const showSuccessAlert = ref(false)
const isLoadingAnalytics = ref(false)
const warnMessage = ref('')
const showWarningAlert = ref(false)

// Fetch all URLs on component mount
onMounted(() => {
  fetchUserUrls()

  // Set up periodic refresh of analytics (every 30 seconds)
  const analyticsInterval = setInterval(() => {
    if (urls.value.length > 0) {
      refreshAllUrlAnalytics()
    }
  }, 30000)

  // Clean up interval on component unmount
  onUnmounted(() => {
    clearInterval(analyticsInterval)
  })
})

const fetchUserUrls = async () => {
  try {
    isLoading.value = true;

    try {
      // Call backend API using our service
      const response = await urlService.getAllUrls();

      if (response.data && response.data.success) {
        // Transform the data using our utility function
        const dbUrls = response.data.data.map(url => transformUrlData(url));
        urls.value = dbUrls;

      } else {
        throw new Error('Failed to fetch URLs');
      }
    } catch (apiErr) {
      console.error('API error:', apiErr);

      // Fall back to localStorage if API fails
    }
  } catch (err) {
    console.error('Error in fetchUserUrls:', err);
    error.value = 'Failed to load your shortened URLs';
  } finally {
    isLoading.value = false;
  }
};

const shortenUrl = async () => {
  // Reset error and success states
  error.value = ''
  successMessage.value = ''
  showSuccessAlert.value = false

  // Validate URL
  if (!formData.longUrl) {
    error.value = 'Please enter a URL'
    return
  }

  // Validate URL format
  try {
    new URL(formData.longUrl)
  } catch (error) {
    error.value = 'Invalid URL format. Please include http:// or https://'
    return
  }

  isLoading.value = true

  try {
    // Check if URL already exists in local state
    const existingUrl = urls.value.find(url => url.longUrl === formData.longUrl)
    if (existingUrl) {
      warnMessage.value = `URL was already shortened: ${existingUrl.shortUrl}`
      setTimeout(() => {
        showWarningAlert.value = false
      }, 5000)

      formData.longUrl = ''
      return
    }

    // Prepare request data
    const requestData = {
      longUrl: formData.longUrl,
      trackClicks: formData.trackClicks,
    }

    // If custom code is used, add it to the request
    if (formData.useCustomUrl && formData.customCode) {
      requestData.customCode = formData.customCode
    }

    // Send API request to create short URL using our service
    const response = await urlService.shortenUrl(requestData)

    if (response.data && response.data.success) {
      // Transform the data using our utility function
      const newUrl = transformUrlData(response.data.data)

      // Add to local state
      urls.value.unshift(newUrl)

      // Save to localStorage as backup


      // Show success message
      successMessage.value = `URL successfully shortened: ${newUrl.shortUrl}`
      showSuccessAlert.value = true

      // Reset form
      formData.longUrl = ''
      // Hide success message after 5 seconds
      setTimeout(() => {
        showSuccessAlert.value = false
      }, 5000)
    } else {
      throw new Error(response.data.message || 'Failed to create short URL')
    }
  } catch (err) {
    console.error('Error creating short URL:', err)
    error.value =
      err.response?.data?.message || err.message || 'An error occurred while shortening the URL'
  } finally {
    isLoading.value = false
  }
}

const copyToClipboard = async (url) => {
  try {
    // Use the Clipboard API
    await navigator.clipboard.writeText(url.shortUrl)

    // Find the URL object and mark as copied for visual feedback
    const urlObject = urls.value.find((u) => u.id === url.id)
    if (urlObject) {
      urlObject.copied = true

      // Reset copied status after 2 seconds
      setTimeout(() => {
        urlObject.copied = false
        storeUrlsLocally(urls.value)
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

const deleteUrl = async (id, urlCode) => {
  try {
    // Call API to delete URL using our service
    const response = await urlService.deleteUrl(urlCode)

    if (response.data && response.data.success) {
      // Simple filter approach - use urlCode for reliable comparison
      urls.value = urls.value.filter((url) => url.urlCode !== urlCode);

      // Update localStorage
      storeUrlsLocally(urls.value);

      // Show success message
      Message.value = 'URL successfully deleted';
      showSuccessAlert.value = true;

      // Hide success message after 5 seconds
      setTimeout(() => {
        showSuccessAlert.value = false;
      }, 5000);
    } else {
      throw new Error(response.data.message || 'Failed to delete URL');
    }
  } catch (err) {
    console.error('Error deleting URL:', err);
    error.value =
      err.response?.data?.message || err.message || 'An error occurred while deleting the URL';

    // Show error for 5 seconds
    setTimeout(() => {
      error.value = '';
    }, 5000);
  }
}

const getUrlAnalytics = async (urlCode) => {
  try {
    isLoadingAnalytics.value = true

    // Call API to get URL analytics using our service
    const response = await urlService.getUrlAnalytics(urlCode)

    if (response.data && response.data.success) {
      // Find and update the URL with analytics data
      const urlIndex = urls.value.findIndex((url) => url.urlCode === urlCode)
      if (urlIndex !== -1) {
        // Update clicks and other analytics
        urls.value[urlIndex].clicks = response.data.data.clicks

        // Update localStorage
        storeUrlsLocally(urls.value)
      }
    } else {
      throw new Error(response.data.message || 'Failed to get URL analytics')
    }
  } catch (err) {
    console.error('Error getting URL analytics:', err)
  } finally {
    isLoadingAnalytics.value = false
  }
}

const refreshUrlAnalytics = async (url) => {
  await getUrlAnalytics(url.urlCode)
}

const refreshAllUrlAnalytics = async () => {
  if (urls.value.length === 0) return

  try {
    // Refresh analytics for each URL
    for (const url of urls.value) {
      await getUrlAnalytics(url.urlCode)
    }
  } catch (err) {
    console.error('Error refreshing all URL analytics:', err)
  }
}

const truncateUrl = (url) => {
  if (url && url.length > 40) {
    return url.substring(0, 40) + '...'
  }
  return url
}

const formatDate = (date) => {
  if (!date) return 'No Expiry'
  return new Date(date).toLocaleDateString()
}
</script>
<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-indigo-600">URL Shortener</h1>
      <p class="text-gray-600 mt-2">Shorten your long URLs into compact, easy-to-share links</p>
    </div>

    <!-- Success Alert -->
    <div v-if="showSuccessAlert" class="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-green-700">{{ successMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Warning Alert -->
    <div v-if="showWarningAlert" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-yellow-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-7a1 1 0 11-2 0V7a1 1 0 112 0v4zm-1.293-.293a1 1 0 101.414-1.414L9.586 10l.707-.707a1 1 0 00-1.414-1.414l-2 2a1 1 0 000 1.414l2 .293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">{{ warnMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg
            class="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- URL Input Form -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
      <div class="p-6">
        <form @submit.prevent="shortenUrl" class="space-y-4">
          <div>
            <label for="longUrl" class="block text-sm font-medium text-gray-700 mb-1"
              >Enter your long URL</label
            >
            <div class="flex flex-col sm:flex-row sm:items-center">
              <input
                type="url"
                id="longUrl"
                v-model="formData.longUrl"
                placeholder="https://example.com/very/long/url/that/needs/shortening"
                class="flex-1 block w-full px-4 py-3 border border-gray-300 rounded-t-lg sm:rounded-t-none sm:rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
              <button
                type="submit"
                class="inline-flex items-center cursor-pointer justify-center px-6 py-3 border border-transparent text-base font-medium rounded-b-lg sm:rounded-b-none sm:rounded-r-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                :disabled="isLoading"
              >
                <span v-if="!isLoading">Shorten</span>
                <span v-else class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing
                </span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">



            <!-- Expiry & Tracking Options -->
            <div>

              <div v-if="formData.useExpiry" class="flex items-center space-x-2 mb-4">
                <input
                  type="number"
                  id="expiryDays"
                  v-model="formData.expiryDays"
                  min="1"
                  max="365"
                  class="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  :required="formData.useExpiry"
                />
                <label for="expiryDays" class="text-sm text-gray-700">days</label>
              </div>

              <div class="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="track-clicks"
                  v-model="formData.trackClicks"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label for="track-clicks" class="text-sm font-medium text-gray-700"
                  >Track clicks</label
                >
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Results Table -->
    <div v-if="urls.length > 0" class="bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="p-4 sm:p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900">Your shortened URLs</h2>
          <button
            @click="refreshAllUrlAnalytics"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isLoadingAnalytics"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              :class="{ 'animate-spin': isLoadingAnalytics }"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh All
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Original URL
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Short URL
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Clicks
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Created
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Expires
                </th>
                <th
                  scope="col"
                  class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="url in urls" :key="url.id">
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 truncate hover:text-indigo-600 max-w-xs"  :title="url.longUrl">
                    {{ truncateUrl(url.longUrl) }}
                  </div>
                </td>

                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                    <a :href="url.shortUrl" target="_blank">{{ url.shortUrl }}</a>
                  </div>
                </td>

                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-sm text-gray-900 mr-2">{{ url.clicks }}</span>
                    <button
                      @click="refreshUrlAnalytics(url)"
                      class="text-gray-400 hover:text-gray-600 cursor-pointer"
                      :class="{ 'animate-spin': isLoadingAnalytics }"
                      :disabled="isLoadingAnalytics"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ formatDate(url.createdAt) }}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">{{ formatDate(url.expiresAt) }}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    @click="copyToClipboard(url)"
                    class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    :class="{ 'bg-green-100 text-green-700 hover:bg-green-200': url.copied }"
                  >
                    {{ url.copied ? 'Copied!' : 'Copy' }}
                  </button>
                  <button
                    @click="deleteUrl(url.id, url.urlCode)"
                    class="inline-flex items-center px-2.5 cursor-pointer py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-xl shadow-lg overflow-hidden p-6 text-center">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        ></path>
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No shortened URLs</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by creating a new shortened URL.</p>
    </div>

  </div>

</template>
