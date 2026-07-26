import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { UnifiedViteWeappTailwindcssPlugin as uvtw } from 'weapp-tailwindcss/vite'

export default defineConfig({
  plugins: [
    uni(),
    uvtw({
      rem2rpx: true
    })
  ]
})
