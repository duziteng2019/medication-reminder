/**
 * 数据服务层
 * 支持云端优先、本地缓存的降级策略。
 * 在线时从云端拉取并缓存，离线时直接读本地。
 */
class DataService {

  /** 清理云端同步后的本地缓存（下次加载时重新拉取云端数据） */
  clearAllCache() {
    try {
      wx.setStorageSync('todayReminders', [])
      wx.setStorageSync('allReminders', [])
    } catch (e) {
      // 存储空间不足时静默失败
    }
  }

  /**
   * 获取数据：云端优先 → 本地降级
   * @param {string} collection - 云数据库集合名
   * @param {string} storageKey - 本地缓存key
   * @param {object} where - 查询条件
   * @param {object} [options] - { orderBy: { field, direction } }
   * @returns {Promise<Array>} 数据数组
   */
  async getWithFallback(collection, storageKey, where = {}, options = {}) {
    try {
      const db = wx.cloud.database()
      let query = db.collection(collection).where(where)

      if (options.orderBy) {
        query = query.orderBy(
          options.orderBy.field,
          options.orderBy.direction || 'desc'
        )
      }

      const res = await query.get()
      const data = res.data || []

      // 更新本地缓存
      this._setCache(storageKey, data)

      return data
    } catch (err) {
      console.log(`[DataService] 云端 ${collection} 失败，使用本地缓存:`, err.message)
      return this._getCache(storageKey)
    }
  }

  /** 写缓存 */
  _setCache(key, data) {
    try {
      wx.setStorageSync(key, data)
    } catch (e) {
      // 存储满时忽略
    }
  }

  /** 读缓存 */
  _getCache(key) {
    try {
      return wx.getStorageSync(key) || []
    } catch (e) {
      return []
    }
  }
}

module.exports = new DataService()
