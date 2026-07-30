const USER_KEY = 'domoney_user_v1'

export function getUser() {
  try {
    const raw = uni.getStorageSync(USER_KEY)
    if (!raw) return null
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    return null
  }
}

export function isLoggedIn() {
  const u = getUser()
  return !!(u && u.loginAt)
}

export function saveUser(user) {
  const data = {
    nickName: user.nickName || '微信用户',
    avatarUrl: user.avatarUrl || '',
    openid: user.openid || '',
    code: user.code || '',
    loginAt: Date.now()
  }
  uni.setStorageSync(USER_KEY, JSON.stringify(data))
  return data
}

export function clearUser() {
  uni.removeStorageSync(USER_KEY)
}

export function wxLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (res.code) resolve(res)
        else reject(new Error('未获取到登录 code'))
      },
      fail: (err) => reject(err)
    })
  })
}
