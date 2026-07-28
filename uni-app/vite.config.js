import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 先去掉 weapp-tailwindcss，避免未编译的 @tailwind/@apply 进入小程序导致白屏
export default defineConfig({
  plugins: [uni()]
})
