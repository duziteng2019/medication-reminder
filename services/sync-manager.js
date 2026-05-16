const { STORAGE_KEYS } = require('../constants/storage')

/**
 * 离线同步管理器
 * 当云端操作失败时自动将操作加入离线队列，
 * 网络恢复后自动重放队列中的操作。
 */
class SyncManager {

  /** 同步所有离线队列中的操作 */
  async syncAll() {
    const queue = this._getQueue()
    if (queue.length === 0) {
      return { offlineQueue: 0 }
    }

    let synced = 0
    const failed = []

    for (const op of queue) {
      try {
        await this._processOperation(op)
        synced++
      } catch (e) {
        console.log('[SyncManager] 操作同步失败:', op.type, e.message)
        failed.push(op)
      }
    }

    // 重写队列：只保留失败的
    this._setQueue(failed)

    return { offlineQueue: synced }
  }

  /** 获取离线队列长度 */
  getOfflineQueueSize() {
    return this._getQueue().length
  }

  /** 将操作推入云端（失败时自动加入离线队列） */
  async pushToCloud(operation) {
    try {
      await this._processOperation(operation)
    } catch (e) {
      console.log('[SyncManager] 操作失败，加入离线队列:', operation.type, e.message)
      this._addToQueue(operation)
      throw e
    }
  }

  /** 处理单个操作 */
  async _processOperation(op) {
    const db = wx.cloud.database()

    switch (op.type) {
      case 'add':
        return db.collection(op.collection).add({ data: op.data })

      case 'update':
        return db.collection(op.collection).doc(op.docId).update({ data: op.data })

      case 'delete':
        return db.collection(op.collection).doc(op.docId).remove()

      case 'markTaken':
        return db.collection(op.collection).add({ data: op.data })

      default:
        console.warn('[SyncManager] 未知操作类型:', op.type)
    }
  }

  /** 获取离线队列 */
  _getQueue() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.SYNC_QUEUE) || []
    } catch (e) {
      return []
    }
  }

  /** 覆写离线队列 */
  _setQueue(queue) {
    try {
      wx.setStorageSync(STORAGE_KEYS.SYNC_QUEUE, queue)
    } catch (e) {
      console.log('[SyncManager] 保存队列失败:', e.message)
    }
  }

  /** 追加操作到离线队列 */
  _addToQueue(operation) {
    const queue = this._getQueue()
    queue.push({ ...operation, _queueTime: Date.now() })
    this._setQueue(queue)
  }
}

module.exports = new SyncManager()
