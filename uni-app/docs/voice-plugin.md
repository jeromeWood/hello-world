# 语音插件启用说明（WechatSI）

未在微信公众平台添加「同声传译」插件时，**不要**在 `manifest.json` 里声明 `plugins`，
否则小程序会白屏无法启动。

## 启用步骤

1. 打开 https://fuwu.weixin.qq.com/ 搜索「同声传译」并添加到你的小程序  
   （或公众平台：设置 → 第三方服务 → 插件管理）
2. 确认插件已显示在「已添加插件」列表
3. 把下面这段加回 `uni-app/src/manifest.json` 的 `mp-weixin` 中：

```json
"plugins": {
  "WechatSI": {
    "version": "0.3.5",
    "provider": "wx069ba97219f66d99"
  }
}
```

4. 重新执行 `npm run dev:mp-weixin`，开发者工具点编译
5. 首页长按说话，允许麦克风权限

版本号以公众平台插件详情页显示为准（可能是 0.3.5 / 0.3.6）。
