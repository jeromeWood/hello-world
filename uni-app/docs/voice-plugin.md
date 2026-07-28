# 语音插件启用说明（WechatSI）

## 当前状态

项目已在 `manifest.json` 声明同声传译插件。请确保公众平台「已添加插件」列表中有「同声传译」。

## 配置

```json
"plugins": {
  "WechatSI": {
    "version": "0.3.5",
    "provider": "wx069ba97219f66d99"
  }
}
```

版本号请与公众平台插件详情保持一致（当前推荐 `0.3.9`）。

## 隐私协议（必做，否则真机无法用麦克风）

公众平台 → **设置 → 服务内容声明 → 用户隐私保护指引**  
勾选并说明：**访问你的麦克风**（用途：语音记账识别）

注意：`app.json` 的 `permission` **不要**写 `scope.record`，新版本会报  
`invalid app.json permission["scope.record"]`。

## 使用

1. `npm run dev:mp-weixin`
2. 开发者工具编译
3. 首页长按「按住 说话」
4. 允许麦克风权限（真机更准确）

## 若再次白屏

说明插件未授权成功或 version 不匹配：临时删除 `plugins` 整段可恢复启动，修好后台后再加回。
