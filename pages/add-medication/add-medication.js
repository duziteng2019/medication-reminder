Page({
  data: {
    isEdit: false,
    editId: null,
    form: {
      name: '',
      dosage: '',
      frequency: '',
      frequencyIndex: null,
      instruction: '',
      startDate: '',
      endDate: '',
      totalQuantity: '',
      remainingQuantity: '',
      lowStockWarning: '3',
      notes: '',
      barcode: ''
    },
    frequencyOptions: [
      { label: '每日一次', value: 'once_daily' },
      { label: '每日两次', value: 'twice_daily' },
      { label: '每日三次', value: 'three_times_daily' },
      { label: '隔日一次', value: 'every_other_day' },
      { label: '每周一次', value: 'once_weekly' },
      { label: '需要时服用', value: 'as_needed' }
    ],
    instructionOptions: [
      '不限',
      '饭前服用',
      '饭后服用',
      '随餐服用',
      '空腹服用',
      '睡前服用',
      '痛时服用'
    ]
  },

  onLoad(options) {
    console.log('[AddMedication] onLoad:', options)
    if (options && options.id) {
      this.setData({
        isEdit: true,
        editId: options.id
      })
      this.loadMedication(options.id)
    }
  },

  async loadMedication(id) {
    console.log('[AddMedication] loadMedication:', id)
    wx.showLoading({ title: '加载中...' })
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('medications').doc(id).get()
      
      if (!data) {
        throw new Error('数据为空')
      }

      const frequencyIndex = data.frequencyIndex != null
        ? data.frequencyIndex
        : this.data.frequencyOptions.findIndex(option => option.label === data.frequency)

      const formData = {
        name: String(data.name || ''),
        dosage: String(data.dosage || ''),
        frequency: String(data.frequency || ''),
        frequencyIndex: frequencyIndex >= 0 ? frequencyIndex : null,
        instruction: data.instruction || '',
        startDate: String(data.startDate || ''),
        endDate: String(data.endDate || ''),
        totalQuantity: data.totalQuantity ? String(data.totalQuantity) : '',
        remainingQuantity: data.remainingQuantity ? String(data.remainingQuantity) : '',
        lowStockWarning: data.lowStockWarning ? String(data.lowStockWarning) : '3',
        notes: String(data.notes || ''),
        barcode: String(data.barcode || '')
      }

      console.log('[AddMedication] Loaded form data:', formData)
      this.setData({ form: formData })
      wx.hideLoading()
    } catch (err) {
      console.error('[AddMedication] loadMedication error:', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    console.log('[AddMedication] onInputChange:', field, value)
    
    if (['totalQuantity', 'remainingQuantity', 'lowStockWarning'].includes(field)) {
      const numValue = parseInt(value)
      if (!isNaN(numValue) && numValue >= 0) {
        this.setData({
          [`form.${field}`]: String(numValue)
        })
      } else if (value === '') {
        this.setData({
          [`form.${field}`]: ''
        })
      }
    } else {
      this.setData({
        [`form.${field}`]: String(value)
      })
    }
  },

  onFrequencyChange(e) {
    const index = parseInt(e.detail.value)
    const option = this.data.frequencyOptions[index]
    console.log('[AddMedication] onFrequencyChange:', index, option)
    
    if (option) {
      this.setData({
        'form.frequencyIndex': index,
        'form.frequency': option.label
      })
    }
  },

  onInstructionChange(e) {
    const index = parseInt(e.detail.value)
    const value = this.data.instructionOptions[index] || ''
    this.setData({ 'form.instruction': value })
  },

  onStartDateChange(e) {
    console.log('[AddMedication] onStartDateChange:', e.detail.value)
    this.setData({
      'form.startDate': String(e.detail.value || '')
    })
  },

  onEndDateChange(e) {
    console.log('[AddMedication] onEndDateChange:', e.detail.value)
    this.setData({
      'form.endDate': String(e.detail.value || '')
    })
  },

  scanBarcode() {
    wx.scanCode({
      success: (res) => {
        const code = res.result
        console.log('[AddMedication] scan result:', code)

        wx.showLoading({ title: '查询药品信息...' })
        this.lookupDrug(code)
      },
      fail: () => {
        wx.showToast({ title: '扫码失败', icon: 'none' })
      }
    })
  },

  lookupDrug(barcode) {
    const db = wx.cloud.database()
    db.collection('medications').where({ barcode }).get().then(res => {
      wx.hideLoading()
      if (res.data && res.data.length > 0) {
        const drug = res.data[0]
        this.setData({
          'form.name': drug.name,
          'form.dosage': drug.dosage || '',
          'form.barcode': barcode
        })
        wx.showToast({ title: '已从本地匹配', icon: 'success' })
      } else {
        this.setData({
          'form.name': barcode,
          'form.barcode': barcode
        })
        wx.showToast({ title: '未查到该药品，保存后将记录条码', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      this.setData({
        'form.name': barcode,
        'form.barcode': barcode
      })
      wx.showToast({ title: '网络异常，请手动填写', icon: 'none' })
    })
  },

  handleCancel() {
    console.log('[AddMedication] handleCancel')
    wx.navigateBack()
  },

  async handleSave() {
    const form = this.data.form
    console.log('[AddMedication] handleSave:', form)

    if (!form.name || !form.name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!form.dosage || !form.dosage.trim()) {
      wx.showToast({ title: '请输入剂量', icon: 'none' })
      return
    }
    if (!form.frequency) {
      wx.showToast({ title: '请选择服用频率', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      const medicationData = {
        _id: this.data.isEdit ? this.data.editId : 'med_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        frequencyIndex: form.frequencyIndex,
        instruction: form.instruction || '',
        startDate: form.startDate || '',
        endDate: form.endDate || '',
        totalQuantity: form.totalQuantity ? parseInt(form.totalQuantity) : null,
        remainingQuantity: form.remainingQuantity ? parseInt(form.remainingQuantity) : null,
        lowStockWarning: parseInt(form.lowStockWarning) || 3,
        notes: form.notes || '',
        barcode: form.barcode || '',
        createTime: this.data.isEdit ? undefined : new Date().toISOString(),
        updateTime: new Date().toISOString()
      }

      // 自动填充库存
      if (!this.data.isEdit && !medicationData.remainingQuantity && medicationData.totalQuantity) {
        medicationData.remainingQuantity = medicationData.totalQuantity
      }

      // 1. 先保存到本地
      const app = getApp()
      const medications = wx.getStorageSync('medications') || []

      if (this.data.isEdit) {
        const idx = medications.findIndex(m => m._id === this.data.editId || m.id === this.data.editId)
        if (idx >= 0) {
          medications[idx] = { ...medications[idx], ...medicationData }
        }
      } else {
        medications.unshift(medicationData)
      }
      wx.setStorageSync('medications', medications)

      // 2. 异步同步到云端
      if (app.globalData && app.globalData.cloudReady) {
        if (this.data.isEdit) {
          app.pushToCloud({ type: 'update', collection: 'medications', docId: this.data.editId, data: medicationData }).catch(() => {})
        } else {
          app.pushToCloud({ type: 'add', collection: 'medications', data: medicationData }).catch(() => {})
        }
      }

      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => { wx.navigateBack() }, 1500)
    } catch (err) {
      console.error('[AddMedication] handleSave error:', err)
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})