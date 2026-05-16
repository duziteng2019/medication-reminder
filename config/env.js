// 云环境配置
// 使用前请在微信开发者工具中设置实际云环境ID
const CLOUD_ENV = 'medication-reminder-dev' // ← 请改为你的云环境ID

module.exports = {
  // 云开发环境ID
  cloudEnv: CLOUD_ENV,

  // 是否追踪用户（用于云开发数据分析）
  traceUser: true,

  // 云函数调用超时时间（毫秒）
  timeout: 10000
}
