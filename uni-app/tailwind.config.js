/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9f4',
          100: '#d6f1e4',
          500: '#1aad19',
          600: '#179b16',
          700: '#128012'
        },
        ink: {
          500: '#576b95',
          700: '#353535',
          900: '#1a1a1a'
        },
        soft: {
          bg: '#f7f8fa',
          line: '#e5e5e5',
          mute: '#b2b2b2'
        }
      },
      borderRadius: {
        voice: '12rpx'
      },
      boxShadow: {
        soft: '0 8rpx 32rpx rgba(26, 173, 25, 0.12)'
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
}
