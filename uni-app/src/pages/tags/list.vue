<template>
  <view class="page">
    <view v-if="items.length" class="list">
      <view v-for="item in items" :key="item.id" class="row">
        <view class="left">
          <view class="dot">{{ item.name.slice(0, 1) }}</view>
          <text class="name">{{ item.name }}</text>
        </view>
        <text v-if="item.custom" class="del" @click="onRemove(item)">删除</text>
      </view>
    </view>
    <view v-else class="empty">
      <text>暂无数据，可点击下方新增</text>
    </view>

    <view v-if="canAdd" class="add-btn" @click="onAdd">+ 新增{{ title }}</view>
    <view v-else class="hint">{{ hint }}</view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories.js'

const CUSTOM_KEY = 'domoney_custom_tags_v1'
const type = ref('expense')
const customList = ref([])

const meta = {
  expense: { title: '支出分类', canAdd: true },
  income: { title: '收入分类', canAdd: true },
  account: { title: '账户', canAdd: true, hint: '可新增常用账户，如现金、微信、银行卡' },
  merchant: { title: '商家', canAdd: true, hint: '可新增常去商家' },
  project: { title: '项目', canAdd: true, hint: '可新增记账项目' }
}

const title = computed(() => meta[type.value]?.title || '标签')
const canAdd = computed(() => !!meta[type.value]?.canAdd)
const hint = computed(() => meta[type.value]?.hint || '')

const builtins = computed(() => {
  if (type.value === 'expense') return EXPENSE_CATEGORIES.map((c) => ({ ...c, custom: false }))
  if (type.value === 'income') return INCOME_CATEGORIES.map((c) => ({ ...c, custom: false }))
  return []
})

const items = computed(() => [...builtins.value, ...customList.value])

function readCustom() {
  try {
    const raw = uni.getStorageSync(CUSTOM_KEY)
    const all = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {}
    customList.value = Array.isArray(all[type.value]) ? all[type.value] : []
  } catch (e) {
    customList.value = []
  }
}

function writeCustom() {
  try {
    const raw = uni.getStorageSync(CUSTOM_KEY)
    const all = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {}
    all[type.value] = customList.value
    uni.setStorageSync(CUSTOM_KEY, JSON.stringify(all))
  } catch (e) {}
}

function onAdd() {
  uni.showModal({
    title: `新增${title.value}`,
    editable: true,
    placeholderText: '请输入名称',
    success: (res) => {
      if (!res.confirm) return
      const name = String(res.content || '').trim()
      if (!name) {
        uni.showToast({ title: '名称不能为空', icon: 'none' })
        return
      }
      customList.value.push({
        id: `c_${Date.now()}`,
        name,
        custom: true
      })
      writeCustom()
      uni.showToast({ title: '已添加', icon: 'success' })
    }
  })
}

function onRemove(item) {
  uni.showModal({
    title: '删除确认',
    content: `确定删除「${item.name}」吗？`,
    success: (res) => {
      if (!res.confirm) return
      customList.value = customList.value.filter((x) => x.id !== item.id)
      writeCustom()
    }
  })
}

onLoad((query) => {
  type.value = query?.type || 'expense'
  uni.setNavigationBarTitle({ title: title.value })
  readCustom()
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
  padding-bottom: 160rpx;
}
.list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.row:last-child {
  border-bottom: none;
}
.left {
  display: flex;
  align-items: center;
}
.dot {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: #eef9f4;
  color: #1aad19;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-weight: 600;
}
.name {
  font-size: 30rpx;
  color: #1a1a1a;
}
.del {
  font-size: 24rpx;
  color: #fa5151;
}
.empty {
  padding: 80rpx 0;
  text-align: center;
  color: #8a8a8a;
  font-size: 28rpx;
}
.add-btn {
  position: fixed;
  left: 48rpx;
  right: 48rpx;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  height: 88rpx;
  border-radius: 16rpx;
  background: #1aad19;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.hint {
  margin-top: 24rpx;
  text-align: center;
  color: #b2b2b2;
  font-size: 24rpx;
}
</style>
