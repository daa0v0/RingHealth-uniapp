<script>
import ringSdk from './utils/ring-sdk.js'

export default {
  onLaunch() {
    console.log('Starbase app launch')
    ringSdk.init()
    const theme = uni.getStorageSync('starbase_theme') || 'light'
    uni.$emit('theme-change', theme)
  }
}
</script>

<style>
page {
  min-height: 100%;
  background: #f6f6f8;
  color: #222222;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

view,
text,
image,
scroll-view,
switch {
  box-sizing: border-box;
}

.safe-page {
  min-height: 100vh;
  padding-top: var(--status-bar-height);
}

.glass-bg {
  background:
    radial-gradient(circle at 20% 0%, rgba(239, 205, 170, 0.72), transparent 32%),
    radial-gradient(circle at 78% 18%, rgba(244, 220, 195, 0.58), transparent 32%),
    linear-gradient(180deg, #f3dfcd 0%, #fafafa 64%, #ffffff 100%);
}

.page-title {
  font-size: 24px;
  line-height: 34px;
  font-weight: 800;
  color: #171717;
}

.nav-spacer {
  height: 118px;
}
</style>
