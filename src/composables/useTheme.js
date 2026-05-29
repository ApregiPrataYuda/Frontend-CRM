// import { ref, watch } from 'vue'

// const isDark = ref(localStorage.getItem('theme') !== 'light')

// watch(isDark, (val) => {
//   document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
//   localStorage.setItem('theme', val ? 'dark' : 'light')
// })

// // Init saat pertama load
// document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')

// export function useTheme() {
//   function toggleTheme() {
//     isDark.value = !isDark.value
//   }
//   return { isDark, toggleTheme }
// }

import { ref, watch } from 'vue'

const savedTheme = localStorage.getItem('theme')

const isDark = ref(
  savedTheme ? savedTheme === 'dark' : true
)

function applyTheme() {
  document.documentElement.setAttribute(
    'data-theme',
    isDark.value ? 'dark' : 'light'
  )
}

applyTheme()

watch(isDark, () => {
  applyTheme()

  localStorage.setItem(
    'theme',
    isDark.value ? 'dark' : 'light'
  )
})

export function useTheme() {
  function toggleTheme() {
    isDark.value = !isDark.value
  }

  return {
    isDark,
    toggleTheme,
  }
}