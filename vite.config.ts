import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite 설정 — https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 등 하위 경로에 배포할 때는 base를 '/저장소이름/'으로 바꾼다
  base: '/',
  plugins: [react(), tailwindcss()],
  // three.js(3D 배경)가 커서 경고 기준을 올린다
  build: { chunkSizeWarningLimit: 1500 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
