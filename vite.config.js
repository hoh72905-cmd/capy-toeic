import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  // Shown in Settings so you can see the app picked up the newest version
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) },
})
