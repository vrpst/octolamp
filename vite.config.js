import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'home/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        explanation: resolve(__dirname, 'explanation/index.html'),
        history: resolve(__dirname, 'history/index.html'),
        changelog: resolve(__dirname, 'changelog/index.html'),
      },
    },
  sourcemap: true,
  },
  server: "192.168.1.65"
}
