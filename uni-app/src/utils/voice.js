/**
 * 语音识别封装：
 * 1) 优先尝试微信同声传译插件 WechatSI
 * 2) 不可用时回退提示，引导使用文字输入
 */

let recordManager = null
let usingPlugin = false

function tryInitPlugin() {
  try {
    // #ifdef MP-WEIXIN
    const plugin = requirePlugin('WechatSI')
    if (plugin && plugin.getRecordRecognitionManager) {
      recordManager = plugin.getRecordRecognitionManager()
      usingPlugin = true
      return true
    }
    // #endif
  } catch (e) {
    // ignore
  }
  return false
}

export function isVoiceAvailable() {
  if (recordManager) return usingPlugin
  return tryInitPlugin()
}

export function startVoiceRecognize({ onStart, onError } = {}) {
  if (!isVoiceAvailable()) {
    onError && onError(new Error('VOICE_UNAVAILABLE'))
    return false
  }

  recordManager.onStart = () => onStart && onStart()
  recordManager.onError = (err) => onError && onError(err)

  try {
    recordManager.start({ duration: 30000, lang: 'zh_CN' })
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
    const text = (res && res.result) || ''
    onResult && onResult(text.trim())
  }
  recordManager.onError = (err) => onError && onError(err)

  try {
    recordManager.stop()
  } catch (e) {
    onError && onError(e)
  }
}
