/**
 * 语音识别：微信同声传译插件 WechatSI
 * 需在微信公众平台添加插件，并在 manifest 声明（见 docs/voice-plugin.md）。
 */

let recordManager = null
let usingPlugin = false
let initTried = false

function tryInitPlugin() {
  if (initTried) return usingPlugin
  initTried = true
  try {
    // #ifdef MP-WEIXIN
    const plugin = requirePlugin('WechatSI')
    if (plugin && typeof plugin.getRecordRecognitionManager === 'function') {
      recordManager = plugin.getRecordRecognitionManager()
      usingPlugin = true
      return true
    }
    // #endif
  } catch (e) {
    console.warn('WechatSI init failed', e)
    usingPlugin = false
  }
  return false
}

export function isVoiceAvailable() {
  return tryInitPlugin()
}

/**
 * 申请录音权限。
 * 注意：开发者工具模拟器经常不弹系统授权框，真机才会出现。
 */
export function ensureRecordPermission() {
  return new Promise((resolve) => {
    uni.getSetting({
      success: (setting) => {
        const authed = !!(setting.authSetting && setting.authSetting['scope.record'])
        if (authed) {
          resolve(true)
          return
        }

        // 尚未授权：发起授权（模拟器可能静默成功/失败且无弹窗）
        uni.authorize({
          scope: 'scope.record',
          success: () => resolve(true),
          fail: () => {
            // 模拟器或用户拒绝时，给出可操作提示
            uni.showModal({
              title: '需要麦克风权限',
              content:
                '语音记账需要麦克风。若在模拟器中未出现授权框，请用「真机调试/预览」；也可到右上角详情查看权限。',
              confirmText: '去设置',
              cancelText: '知道了',
              success: (res) => {
                if (res.confirm) uni.openSetting({})
              },
              complete: () => resolve(false)
            })
          }
        })
      },
      fail: () => resolve(false)
    })
  })
}

export async function startVoiceRecognize({ onStart, onError } = {}) {
  // 先申请麦克风，再判断插件（便于用户感知权限流程）
  const allowed = await ensureRecordPermission()
  if (!allowed) {
    onError && onError(new Error('RECORD_DENIED'))
    return false
  }

  if (!isVoiceAvailable()) {
    onError && onError(new Error('VOICE_UNAVAILABLE'))
    return false
  }

  recordManager.onStart = () => onStart && onStart()
  recordManager.onError = (err) => {
    console.warn('voice error', err)
    onError && onError(err)
  }

  try {
    recordManager.start({ duration: 60000, lang: 'zh_CN' })
    return true
  } catch (e) {
    onError && onError(e)
    return false
  }
}

export function stopVoiceRecognize({ onResult, onError } = {}) {
  if (!recordManager || !usingPlugin) {
    onError && onError(new Error('VOICE_UNAVAILABLE'))
    return
  }

  recordManager.onStop = (res) => {
    const text = ((res && res.result) || '').trim()
    onResult && onResult(text)
  }
  recordManager.onError = (err) => onError && onError(err)

  try {
    recordManager.stop()
  } catch (e) {
    onError && onError(e)
  }
}
