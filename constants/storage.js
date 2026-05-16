// 本地存储Key常量 — 统一管理所有wx.setStorageSync/getStorageSync的key
const STORAGE_KEYS = {
  MEDICATIONS: 'medications',
  REMINDERS: 'reminders',
  TODAY_RECORDS: 'todayRecords',
  TODAY_REMINDERS: 'todayReminders',
  USER_INFO: 'userInfo',
  LAST_SYNC_TIME: 'lastSyncTime',
  SYNC_QUEUE: 'syncQueue',
  GUIDE_DONE: 'guideDone',
  SUBSCRIBED: 'subscribedReminders',
  MEDICATION_STREAK: 'medicationStreak',
  LAST_SUBSCRIBE_REQUEST: 'lastSubscribeRequest'
}

module.exports = { STORAGE_KEYS }
