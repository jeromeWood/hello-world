/**
 * 语音识别：微信同声传译插件 WechatSI
 * 需在微信公众平台添加插件，并在 manifest 声明。
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

export function ensureRecordPermission() {
  return new Promise((resolve) => {
    uni.getSetting({
      success: (setting) => {
        if (setting.authSetting && setting.authSetting['scope.record']) {
          resolve(true)
          return
        }
        uni.authorize({
          scope: 'scope.record',
          success: () => resolve(true),
          fail: () => {
            uni.showModal({
              title: '需要麦克风权限',
              content: '语音记账需要使用麦克风，请在设置中开启',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) uni.openSetting({})
              }
            })
            resolve(false)
          }
        })
      },
      fail: () => resolve(false)
    })
  })
}

export async function startVoiceRecognize({ onStart, onError } = {}) {
  if (!isVoiceAvailable()) {
    onError && onError(new Error('VOICE_UNAVAILABLE'))
    return false
  }

  const allowed = await ensureRecordPermission()
  if (!allowed) {
    onError && onError(new Error('RECORD_DENIED'))
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
