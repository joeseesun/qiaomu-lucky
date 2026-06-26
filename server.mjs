import { createServer } from 'node:http'
import { promises as fs, readFileSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const loadDotEnv = () => {
  const envFile = process.env.LUCKY_ENV_FILE || path.join(__dirname, '.env')

  let content = ''
  try {
    content = readFileSync(envFile, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to read env file: ${envFile}`, error)
    }
    return
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) continue

    const key = trimmed.slice(0, equalsIndex).trim()
    let value = trimmed.slice(equalsIndex + 1).trim()

    if (!key || key in process.env) continue

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[key] = value
  }
}

loadDotEnv()

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT || 3158)
const DATA_DIR = process.env.LUCKY_DATA_DIR || path.join(__dirname, 'data')
const DATA_FILE = process.env.LUCKY_DATA_FILE || path.join(DATA_DIR, 'lottery-data.json')
const STATIC_DIR = process.env.LUCKY_STATIC_DIR || path.join(__dirname, 'dist')
const SECRETS_FILE = process.env.LUCKY_SECRETS_FILE || path.join(DATA_DIR, 'runtime-secrets.json')
const loadRuntimeSecrets = () => {
  try {
    return JSON.parse(readFileSync(SECRETS_FILE, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to read runtime secrets file: ${SECRETS_FILE}`, error)
    }
    return {}
  }
}
const runtimeSecrets = loadRuntimeSecrets()
let adminPassword = String(runtimeSecrets.adminPassword || process.env.LUCKY_ADMIN_PASSWORD || '')
let sessionSecret = String(runtimeSecrets.sessionSecret || process.env.LUCKY_SESSION_SECRET || adminPassword)
const COOKIE_NAME = 'lucky_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000
const resetTokens = new Map()

if (!adminPassword) {
  console.error('Missing LUCKY_ADMIN_PASSWORD')
  process.exit(1)
}

if (!sessionSecret || sessionSecret.length < 16) {
  console.error('LUCKY_SESSION_SECRET must be at least 16 characters')
  process.exit(1)
}

const defaultDisplaySettings = {
  pageTitle: '乔木日常抽奖',
  pageDescription: '输入手机号参与抽奖，中奖后保存兑奖码',
  showWinRate: false,
  showRemainingCount: true,
  showParticipantCount: false,
  customFooterText: '每个手机号按活动规则限抽，中奖后请截图保存兑奖码',
  hideActivitySelector: false,
  customCss: ''
}

const defaultRestrictions = {
  phoneRestriction: {
    enabled: true,
    maxDrawsPerPhone: 1,
    resetPeriod: 'never'
  },
  ipRestriction: {
    enabled: false,
    maxDrawsPerIP: 3,
    resetPeriod: 'daily'
  },
  timeRestriction: {
    enabled: false,
    cooldownMinutes: 60
  },
  combinedRestriction: {
    enabled: false,
    maxDrawsPerPhonePerDay: 1,
    maxDrawsPerIPPerDay: 5
  }
}

const defaultPrizeTypes = () => [
  { id: crypto.randomUUID(), name: '一等奖', description: '最高奖项', weight: 5, color: '#ef4444', icon: 'Crown' },
  { id: crypto.randomUUID(), name: '二等奖', description: '次高奖项', weight: 15, color: '#f97316', icon: 'Trophy' },
  { id: crypto.randomUUID(), name: '三等奖', description: '日常奖励', weight: 30, color: '#eab308', icon: 'Award' },
  { id: crypto.randomUUID(), name: '参与奖', description: '参与鼓励', weight: 50, color: '#22c55e', icon: 'Gift' }
]

const createDefaultData = () => {
  const activityId = crypto.randomUUID()
  const prizeTypes = defaultPrizeTypes()
  const createdAt = new Date().toISOString()

  return {
    schemaVersion: 1,
    activities: [
      {
        id: activityId,
        name: '日常抽奖模板',
        description: '复制链接发给参与者，后台可随时调整奖品和中奖率',
        winRate: 30,
        isActive: false,
        isArchived: false,
        archivedAt: null,
        maxDrawsPerPhone: 1,
        createdAt,
        backgroundColor: 'from-stone-100 to-stone-200',
        icon: 'Gift',
        prizeTypes,
        exchangeInstructions: '请截图保存兑奖码，并按活动组织者说明领取奖品。',
        restrictions: defaultRestrictions,
        displaySettings: defaultDisplaySettings
      }
    ],
    codes: prizeTypes.slice(0, 3).map((type, index) => ({
      id: crypto.randomUUID(),
      code: `DEMO-${String(index + 1).padStart(3, '0')}`,
      status: 'unused',
      createdAt,
      lotteryId: activityId,
      prizeType: type.id,
      prizeName: `${type.name}示例奖品`,
      prizeValue: '',
      prizeDescription: '上线后可在后台替换为真实奖品',
      weight: type.weight
    })),
    records: []
  }
}

let dataCache = null
let writeQueue = Promise.resolve()

const json = (res, status, payload, headers = {}) => {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
    ...headers
  })
  res.end(body)
}

const text = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  })
  res.end(body)
}

const clone = (value) => JSON.parse(JSON.stringify(value))

const mergeDisplaySettings = (settings = {}) => ({
  ...defaultDisplaySettings,
  ...settings
})

const mergeRestrictions = (restrictions = {}) => ({
  ...defaultRestrictions,
  ...restrictions,
  phoneRestriction: {
    ...defaultRestrictions.phoneRestriction,
    ...(restrictions.phoneRestriction || {})
  },
  ipRestriction: {
    ...defaultRestrictions.ipRestriction,
    ...(restrictions.ipRestriction || {})
  },
  timeRestriction: {
    ...defaultRestrictions.timeRestriction,
    ...(restrictions.timeRestriction || {})
  },
  combinedRestriction: {
    ...defaultRestrictions.combinedRestriction,
    ...(restrictions.combinedRestriction || {})
  }
})

const normalizeData = (data) => {
  const normalized = {
    schemaVersion: 1,
    activities: Array.isArray(data.activities) ? data.activities : [],
    codes: Array.isArray(data.codes) ? data.codes : [],
    records: Array.isArray(data.records) ? data.records : []
  }

  normalized.activities = normalized.activities.map((activity) => ({
    ...activity,
    id: activity.id || crypto.randomUUID(),
    createdAt: activity.createdAt || new Date().toISOString(),
    isArchived: activity.isArchived === true,
    archivedAt: activity.isArchived === true ? activity.archivedAt || new Date().toISOString() : null,
    maxDrawsPerPhone: Number(activity.maxDrawsPerPhone || 1),
    prizeTypes: Array.isArray(activity.prizeTypes) && activity.prizeTypes.length > 0
      ? activity.prizeTypes
      : defaultPrizeTypes(),
    restrictions: mergeRestrictions(activity.restrictions),
    displaySettings: mergeDisplaySettings(activity.displaySettings)
  }))

  normalized.codes = normalized.codes.map((code) => ({
    ...code,
    id: code.id || crypto.randomUUID(),
    status: code.status === 'won' ? 'won' : 'unused',
    createdAt: code.createdAt || new Date().toISOString(),
    weight: Number(code.weight || 10)
  }))

  normalized.records = normalized.records.map((record) => ({
    ...record,
    id: record.id || crypto.randomUUID(),
    drawnAt: record.drawnAt || new Date().toISOString()
  }))

  return normalized
}

const loadData = async () => {
  if (dataCache) return dataCache

  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    dataCache = normalizeData(JSON.parse(raw))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    dataCache = createDefaultData()
    await saveData(dataCache)
  }

  return dataCache
}

const saveData = async (data) => {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  const normalized = normalizeData(data)
  const tmpFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmpFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
  await fs.rename(tmpFile, DATA_FILE)
  dataCache = normalized
}

const withDataWrite = async (fn) => {
  const next = writeQueue.then(async () => {
    const data = await loadData()
    const result = await fn(data)
    await saveData(data)
    return result
  })

  writeQueue = next.catch(() => {})
  return next
}

const parseBody = async (req) => {
  const chunks = []
  let total = 0

  for await (const chunk of req) {
    total += chunk.length
    if (total > 1024 * 1024) {
      throw Object.assign(new Error('请求内容过大'), { status: 413 })
    }
    chunks.push(chunk)
  }

  if (chunks.length === 0) return {}

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('请求 JSON 格式错误'), { status: 400 })
  }
}

const constantTimeEqual = (value, expected) => {
  const valueText = String(value || '')
  const expectedText = String(expected || '')
  const valueBuffer = Buffer.from(valueText)
  const expectedBuffer = Buffer.from(expectedText)
  const length = Math.max(valueBuffer.length, expectedBuffer.length, 1)
  const paddedValue = Buffer.concat([valueBuffer, Buffer.alloc(length - valueBuffer.length)])
  const paddedExpected = Buffer.concat([expectedBuffer, Buffer.alloc(length - expectedBuffer.length)])

  return crypto.timingSafeEqual(paddedValue, paddedExpected) && valueText === expectedText
}

const sign = (value) =>
  crypto.createHmac('sha256', sessionSecret).update(value).digest('base64url')

const createSessionToken = () => {
  const payload = Buffer.from(JSON.stringify({
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
    nonce: crypto.randomUUID()
  })).toString('base64url')

  return `${payload}.${sign(payload)}`
}

const verifySessionToken = (token) => {
  if (!token || !token.includes('.')) return false
  const [payload, signature] = token.split('.')
  const expected = sign(payload)

  if (!constantTimeEqual(signature, expected)) {
    return false
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return Number(data.exp) > Date.now()
  } catch {
    return false
  }
}

const parseCookies = (req) => {
  const header = req.headers.cookie || ''
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        if (index === -1) return [part, '']
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))]
      })
  )
}

const isAuthenticated = (req) => verifySessionToken(parseCookies(req)[COOKIE_NAME])

const cookieHeader = (req, token) => {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
  const secure = forwardedProto === 'https' ? '; Secure' : ''
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${secure}`
}

const clearCookieHeader = () => `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(String(token || '')).digest('hex')

const cleanupResetTokens = () => {
  const now = Date.now()
  for (const [tokenHash, tokenState] of resetTokens.entries()) {
    if (tokenState.expiresAt <= now) resetTokens.delete(tokenHash)
  }
}

const publicOrigin = (req) => {
  const configuredOrigin = String(process.env.LUCKY_PUBLIC_BASE_URL || '').replace(/\/+$/, '')
  if (configuredOrigin) return configuredOrigin

  const host = String(req.headers.host || `127.0.0.1:${PORT}`)
  const isLoopback = host.startsWith('127.0.0.1') || host.startsWith('localhost') || host.startsWith('[::1]')
  const defaultProto = isLoopback ? 'http' : 'https'
  const proto = String(req.headers['x-forwarded-proto'] || defaultProto).split(',')[0].trim() || defaultProto
  return `${proto}://${host}`
}

const createPasswordResetLink = (req) => {
  cleanupResetTokens()

  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS
  const path = `/reset-admin?token=${encodeURIComponent(token)}`

  resetTokens.set(hashResetToken(token), { expiresAt })

  return {
    path,
    url: `${publicOrigin(req)}${path}`,
    expiresAt: new Date(expiresAt).toISOString()
  }
}

const isLocalMaintenanceRequest = (req) => {
  const remoteAddress = req.socket.remoteAddress || ''
  const host = String(req.headers.host || '')
  const loopbackRemote = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remoteAddress)
  const loopbackHost = host.startsWith('127.0.0.1') || host.startsWith('localhost') || host.startsWith('[::1]')
  const cameThroughProxy = Boolean(
    req.headers['x-forwarded-for'] ||
    req.headers['x-forwarded-host'] ||
    req.headers['x-real-ip']
  )

  return loopbackRemote && loopbackHost && !cameThroughProxy
}

const updateRuntimeSecrets = async (values) => {
  await fs.mkdir(path.dirname(SECRETS_FILE), { recursive: true })

  const tmpFile = `${SECRETS_FILE}.${process.pid}.${Date.now()}.tmp`
  const payload = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    adminPassword: values.adminPassword,
    sessionSecret: values.sessionSecret
  }

  await fs.writeFile(tmpFile, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  await fs.chmod(tmpFile, 0o600)
  await fs.rename(tmpFile, SECRETS_FILE)
}

const resetAdminPassword = async (newPassword) => {
  const nextSessionSecret = crypto.randomBytes(32).toString('base64url')
  await updateRuntimeSecrets({
    adminPassword: newPassword,
    sessionSecret: nextSessionSecret
  })

  adminPassword = newPassword
  sessionSecret = nextSessionSecret
  resetTokens.clear()
}

const getClientIp = (req) => {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return forwardedFor || req.socket.remoteAddress || 'unknown'
}

const isValidPhone = (phone) => /^1[3-9]\d{9}$/.test(String(phone || ''))

const periodStart = (period, now = new Date()) => {
  const start = new Date(now)

  if (period === 'daily') {
    start.setHours(0, 0, 0, 0)
    return start
  }

  if (period === 'weekly') {
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
    start.setHours(0, 0, 0, 0)
    return start
  }

  if (period === 'monthly') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return start
  }

  return new Date(0)
}

const recordsInPeriod = (records, filter, period) => {
  const start = periodStart(period).getTime()
  return records.filter((record) =>
    filter(record) && new Date(record.drawnAt).getTime() >= start
  )
}

const enforceRestrictions = (activity, records, phone, ipAddress) => {
  const restrictions = mergeRestrictions(activity.restrictions)

  if (restrictions.phoneRestriction.enabled) {
    const maxDraws = Number(restrictions.phoneRestriction.maxDrawsPerPhone || activity.maxDrawsPerPhone || 1)
    const phoneRecords = recordsInPeriod(
      records,
      (record) => record.lotteryId === activity.id && record.phone === phone,
      restrictions.phoneRestriction.resetPeriod
    )

    if (phoneRecords.length >= maxDraws) {
      return `该手机号已达到本活动限抽次数（${maxDraws} 次）`
    }
  }

  if (restrictions.ipRestriction.enabled) {
    const maxDraws = Number(restrictions.ipRestriction.maxDrawsPerIP || 1)
    const ipRecords = recordsInPeriod(
      records,
      (record) => record.lotteryId === activity.id && record.ipAddress === ipAddress,
      restrictions.ipRestriction.resetPeriod
    )

    if (ipRecords.length >= maxDraws) {
      return `当前网络环境已达到本活动限抽次数（${maxDraws} 次）`
    }
  }

  if (restrictions.timeRestriction.enabled) {
    const cooldownMs = Number(restrictions.timeRestriction.cooldownMinutes || 0) * 60 * 1000
    const latestRecord = records
      .filter((record) =>
        record.lotteryId === activity.id &&
        (record.phone === phone || record.ipAddress === ipAddress)
      )
      .sort((a, b) => new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime())[0]

    if (latestRecord && Date.now() - new Date(latestRecord.drawnAt).getTime() < cooldownMs) {
      return `抽奖太频繁，请稍后再试`
    }
  }

  if (restrictions.combinedRestriction.enabled) {
    const phoneDaily = recordsInPeriod(
      records,
      (record) => record.lotteryId === activity.id && record.phone === phone,
      'daily'
    )
    const ipDaily = recordsInPeriod(
      records,
      (record) => record.lotteryId === activity.id && record.ipAddress === ipAddress,
      'daily'
    )

    if (phoneDaily.length >= Number(restrictions.combinedRestriction.maxDrawsPerPhonePerDay || 1)) {
      return '该手机号今日已达到本活动限抽次数'
    }

    if (ipDaily.length >= Number(restrictions.combinedRestriction.maxDrawsPerIPPerDay || 1)) {
      return '当前网络环境今日已达到本活动限抽次数'
    }
  }

  return null
}

const publicActivity = (activity, data) => {
  const activityCodes = data.codes.filter((code) => code.lotteryId === activity.id)
  const activityRecords = data.records.filter((record) => record.lotteryId === activity.id)

  return {
    ...clone(activity),
    availableCount: activityCodes.filter((code) => code.status === 'unused').length,
    participantCount: new Set(activityRecords.map((record) => record.phone)).size
  }
}

const adminState = (data) => clone(data)

const selectWeightedCode = (codes) => {
  const totalWeight = codes.reduce((sum, code) => sum + Number(code.weight || 1), 0)
  let random = Math.random() * totalWeight

  for (const code of codes) {
    random -= Number(code.weight || 1)
    if (random <= 0) return code
  }

  return codes[0]
}

const addDefaultPrizeTypes = (activity) => ({
  ...activity,
  prizeTypes: Array.isArray(activity.prizeTypes) && activity.prizeTypes.length > 0
    ? activity.prizeTypes.map((type) => ({ ...type, id: type.id || crypto.randomUUID() }))
    : defaultPrizeTypes()
})

const routeApi = async (req, res, url) => {
  const method = req.method || 'GET'
  const pathname = url.pathname

  if (method === 'GET' && pathname === '/api/health') {
    const data = await loadData()
    return json(res, 200, {
      ok: true,
      activities: data.activities.length,
      codes: data.codes.length,
      records: data.records.length
    })
  }

  if (method === 'POST' && pathname === '/api/local/password-reset-link') {
    if (!isLocalMaintenanceRequest(req)) {
      return json(res, 403, { error: '该维护接口仅允许服务器本机直连访问' })
    }

    return json(res, 200, createPasswordResetLink(req))
  }

  if (method === 'POST' && pathname === '/api/reset-password') {
    const body = await parseBody(req)
    const token = String(body.token || '')
    const newPassword = String(body.newPassword || '')
    const tokenState = resetTokens.get(hashResetToken(token))

    cleanupResetTokens()

    if (!token || !tokenState || tokenState.expiresAt <= Date.now()) {
      return json(res, 400, { error: '重置链接已失效，请重新生成' })
    }

    if (newPassword.length < 10 || newPassword.length > 128) {
      return json(res, 400, { error: '管理员密码长度需为 10-128 个字符' })
    }

    try {
      await resetAdminPassword(newPassword)
      resetTokens.delete(hashResetToken(token))
    } catch (error) {
      console.error('Password reset persistence failed:', error)
      return json(res, 500, { error: '无法保存新密码，请稍后重试或重新生成链接' })
    }

    return json(res, 200, { ok: true }, {
      'Set-Cookie': clearCookieHeader()
    })
  }

  if (method === 'GET' && pathname === '/api/public/activities') {
    const data = await loadData()
    return json(res, 200, {
      activities: data.activities
        .filter((activity) => activity.isArchived !== true)
        .map((activity) => publicActivity(activity, data))
    })
  }

  if (method === 'GET' && pathname === '/api/public/has-drawn') {
    const data = await loadData()
    const phone = url.searchParams.get('phone') || ''
    const activityId = url.searchParams.get('activityId') || ''
    const drawn = data.records.some((record) => record.phone === phone && record.lotteryId === activityId)
    return json(res, 200, { drawn })
  }

  if (method === 'GET' && pathname === '/api/public/winners') {
    const data = await loadData()
    const phone = url.searchParams.get('phone') || ''

    if (!isValidPhone(phone)) {
      return json(res, 400, { error: '请输入正确的手机号码' })
    }

    const records = data.records
      .filter((record) => record.phone === phone && record.won)
      .sort((a, b) => new Date(b.drawnAt).getTime() - new Date(a.drawnAt).getTime())
      .map((record) => {
        const activity = data.activities.find((item) => item.id === record.lotteryId)
        const prizeType = activity?.prizeTypes?.find((item) => item.id === record.prizeType)

        return {
          id: record.id,
          drawn_at: record.drawnAt,
          won: record.won,
          lottery_code: record.lotteryCode,
          prize_name: record.prizeName,
          lottery_activities: activity
            ? {
                name: activity.name,
                background_color: activity.backgroundColor,
                icon: activity.icon
              }
            : null,
          prize_types: prizeType
            ? {
                name: prizeType.name,
                color: prizeType.color,
                icon: prizeType.icon
              }
            : null
        }
      })

    return json(res, 200, { records })
  }

  if (method === 'POST' && pathname === '/api/public/draw') {
    const body = await parseBody(req)
    const phone = String(body.phone || '')
    const activityId = String(body.activityId || '')
    const ipAddress = getClientIp(req)

    if (!isValidPhone(phone)) {
      return json(res, 400, { success: false, won: false, message: '请输入正确的手机号码' })
    }

    const result = await withDataWrite(async (data) => {
      const activity = data.activities.find((item) => item.id === activityId)

      if (!activity) {
        return { success: false, won: false, message: '抽奖活动不存在' }
      }

      if (activity.isArchived) {
        return { success: false, won: false, message: '抽奖活动已归档' }
      }

      if (!activity.isActive) {
        return { success: false, won: false, message: '抽奖活动已下线' }
      }

      const now = new Date()
      if (activity.startTime && now < new Date(activity.startTime)) {
        return { success: false, won: false, message: '抽奖活动尚未开始' }
      }

      if (activity.endTime && now > new Date(activity.endTime)) {
        return { success: false, won: false, message: '抽奖活动已结束' }
      }

      const restrictionMessage = enforceRestrictions(activity, data.records, phone, ipAddress)
      if (restrictionMessage) {
        return { success: false, won: false, message: restrictionMessage }
      }

      const availableCodes = data.codes.filter(
        (code) => code.lotteryId === activity.id && code.status === 'unused'
      )

      if (availableCodes.length === 0) {
        return { success: false, won: false, message: '抽奖已结束，奖品已全部发放完毕' }
      }

      const won = Math.random() < Number(activity.winRate || 0) / 100
      const record = {
        id: crypto.randomUUID(),
        phone,
        drawnAt: new Date().toISOString(),
        won,
        lotteryId: activity.id,
        lotteryName: activity.name,
        ipAddress
      }

      if (won) {
        const selectedCode = selectWeightedCode(availableCodes)
        selectedCode.status = 'won'
        selectedCode.wonAt = record.drawnAt
        selectedCode.winnerPhone = phone
        record.lotteryCode = selectedCode.code
        record.prizeType = selectedCode.prizeType
        record.prizeName = selectedCode.prizeName
      }

      data.records.unshift(record)

      return {
        success: true,
        won: record.won,
        lotteryCode: record.lotteryCode,
        prizeType: record.prizeType,
        prizeName: record.prizeName,
        message: record.won ? '恭喜中奖！' : '很遗憾，未中奖'
      }
    })

    return json(res, 200, result)
  }

  if (method === 'GET' && pathname === '/api/admin/session') {
    return json(res, 200, { authenticated: isAuthenticated(req) })
  }

  if (method === 'POST' && pathname === '/api/admin/login') {
    const body = await parseBody(req)
    const submitted = String(body.password || '')
    const valid = constantTimeEqual(submitted, adminPassword)

    if (!valid) {
      return json(res, 401, { error: '密码错误，请重新输入' })
    }

    return json(res, 200, { ok: true }, {
      'Set-Cookie': cookieHeader(req, createSessionToken())
    })
  }

  if (method === 'POST' && pathname === '/api/admin/logout') {
    return json(res, 200, { ok: true }, {
      'Set-Cookie': clearCookieHeader()
    })
  }

  if (pathname.startsWith('/api/admin/') && !isAuthenticated(req)) {
    return json(res, 401, { error: '请先登录管理后台' })
  }

  if (method === 'POST' && pathname === '/api/admin/password-reset-link') {
    return json(res, 200, createPasswordResetLink(req))
  }

  if (method === 'GET' && pathname === '/api/admin/state') {
    const data = await loadData()
    return json(res, 200, adminState(data))
  }

  if (method === 'POST' && pathname === '/api/admin/activity') {
    const body = await parseBody(req)
    const activity = addDefaultPrizeTypes({
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      name: String(body.name || '').trim(),
      description: String(body.description || ''),
      winRate: Number(body.winRate || 0),
      isActive: body.isActive === true,
      isArchived: body.isArchived === true,
      archivedAt: body.isArchived === true ? body.archivedAt || new Date().toISOString() : null,
      maxDrawsPerPhone: Number(body.maxDrawsPerPhone || 1),
      backgroundColor: body.backgroundColor || 'from-stone-100 to-stone-200',
      icon: body.icon || 'Gift',
      restrictions: mergeRestrictions(body.restrictions),
      displaySettings: mergeDisplaySettings(body.displaySettings)
    })

    if (!activity.name) return json(res, 400, { error: '活动名称不能为空' })

    const state = await withDataWrite(async (data) => {
      data.activities.unshift(activity)
      return adminState(data)
    })

    return json(res, 200, state)
  }

  const activityMatch = pathname.match(/^\/api\/admin\/activity\/([^/]+)$/)
  if (activityMatch && method === 'PATCH') {
    const activityId = activityMatch[1]
    const body = await parseBody(req)
    const state = await withDataWrite(async (data) => {
      const activity = data.activities.find((item) => item.id === activityId)
      if (!activity) throw Object.assign(new Error('活动不存在'), { status: 404 })

      Object.assign(activity, {
        ...body,
        winRate: body.winRate === undefined ? activity.winRate : Number(body.winRate),
        maxDrawsPerPhone: body.maxDrawsPerPhone === undefined
          ? activity.maxDrawsPerPhone
          : Number(body.maxDrawsPerPhone),
        restrictions: body.restrictions ? mergeRestrictions(body.restrictions) : activity.restrictions,
        displaySettings: body.displaySettings ? mergeDisplaySettings(body.displaySettings) : activity.displaySettings,
        prizeTypes: Array.isArray(body.prizeTypes) ? body.prizeTypes : activity.prizeTypes
      })

      activity.isArchived = activity.isArchived === true
      if (activity.isArchived) {
        activity.isActive = false
        activity.archivedAt = activity.archivedAt || new Date().toISOString()
      } else {
        activity.archivedAt = null
      }

      return adminState(data)
    })

    return json(res, 200, state)
  }

  if (activityMatch && method === 'DELETE') {
    const activityId = activityMatch[1]
    const state = await withDataWrite(async (data) => {
      data.activities = data.activities.filter((activity) => activity.id !== activityId)
      data.codes = data.codes.filter((code) => code.lotteryId !== activityId)
      data.records = data.records.filter((record) => record.lotteryId !== activityId)
      return adminState(data)
    })

    return json(res, 200, state)
  }

  const activityPrizeTypeMatch = pathname.match(/^\/api\/admin\/activity\/([^/]+)\/prize-type$/)
  if (activityPrizeTypeMatch && method === 'POST') {
    const activityId = activityPrizeTypeMatch[1]
    const body = await parseBody(req)
    const state = await withDataWrite(async (data) => {
      const activity = data.activities.find((item) => item.id === activityId)
      if (!activity) throw Object.assign(new Error('活动不存在'), { status: 404 })

      activity.prizeTypes.push({
        id: crypto.randomUUID(),
        name: String(body.name || '').trim(),
        description: String(body.description || ''),
        weight: Number(body.weight || 10),
        color: body.color || '#ef4444',
        icon: body.icon || 'Gift'
      })

      return adminState(data)
    })

    return json(res, 200, state)
  }

  const prizeTypeMatch = pathname.match(/^\/api\/admin\/prize-type\/([^/]+)$/)
  if (prizeTypeMatch && method === 'PATCH') {
    const prizeTypeId = prizeTypeMatch[1]
    const body = await parseBody(req)
    const state = await withDataWrite(async (data) => {
      const activity = data.activities.find((item) =>
        item.prizeTypes.some((type) => type.id === prizeTypeId)
      )
      const prizeType = activity?.prizeTypes.find((type) => type.id === prizeTypeId)

      if (!prizeType) throw Object.assign(new Error('奖品类型不存在'), { status: 404 })

      Object.assign(prizeType, {
        name: String(body.name || prizeType.name).trim(),
        description: String(body.description || ''),
        weight: Number(body.weight || prizeType.weight),
        color: body.color || prizeType.color,
        icon: body.icon || prizeType.icon
      })

      data.codes = data.codes.map((code) =>
        code.prizeType === prizeTypeId ? { ...code, weight: prizeType.weight } : code
      )

      return adminState(data)
    })

    return json(res, 200, state)
  }

  if (prizeTypeMatch && method === 'DELETE') {
    const prizeTypeId = prizeTypeMatch[1]
    const state = await withDataWrite(async (data) => {
      data.activities = data.activities.map((activity) => ({
        ...activity,
        prizeTypes: activity.prizeTypes.filter((type) => type.id !== prizeTypeId)
      }))
      data.codes = data.codes.filter((code) => code.prizeType !== prizeTypeId)
      return adminState(data)
    })

    return json(res, 200, state)
  }

  if (method === 'POST' && pathname === '/api/admin/code') {
    const body = await parseBody(req)
    const state = await withDataWrite(async (data) => {
      const activity = data.activities.find((item) => item.id === body.activityId)
      const prizeType = activity?.prizeTypes.find((type) => type.id === body.prizeType)

      if (!activity || !prizeType) throw Object.assign(new Error('活动或奖品类型不存在'), { status: 400 })
      if (data.codes.some((code) => code.lotteryId === activity.id && code.code === body.code)) {
        throw Object.assign(new Error('奖品码已存在'), { status: 409 })
      }

      data.codes.unshift({
        id: crypto.randomUUID(),
        code: String(body.code || '').trim(),
        status: 'unused',
        createdAt: new Date().toISOString(),
        lotteryId: activity.id,
        prizeType: prizeType.id,
        prizeName: String(body.prizeName || '').trim(),
        prizeValue: body.prizeValue || undefined,
        prizeDescription: body.prizeDescription || undefined,
        weight: prizeType.weight
      })

      return adminState(data)
    })

    return json(res, 200, state)
  }

  const codeMatch = pathname.match(/^\/api\/admin\/code\/([^/]+)$/)
  if (codeMatch && method === 'PATCH') {
    const codeId = codeMatch[1]
    const body = await parseBody(req)
    const state = await withDataWrite(async (data) => {
      const code = data.codes.find((item) => item.id === codeId)
      if (!code) throw Object.assign(new Error('奖品码不存在'), { status: 404 })

      const activity = data.activities.find((item) => item.id === code.lotteryId)
      const prizeType = activity?.prizeTypes.find((type) => type.id === body.prizeType)
      if (!prizeType) throw Object.assign(new Error('奖品类型不存在'), { status: 400 })

      Object.assign(code, {
        code: String(body.code || code.code).trim(),
        prizeType: prizeType.id,
        prizeName: String(body.prizeName || code.prizeName).trim(),
        prizeValue: body.prizeValue || undefined,
        prizeDescription: body.prizeDescription || undefined,
        weight: prizeType.weight
      })

      return adminState(data)
    })

    return json(res, 200, state)
  }

  if (codeMatch && method === 'DELETE') {
    const codeId = codeMatch[1]
    const state = await withDataWrite(async (data) => {
      data.codes = data.codes.filter((code) => code.id !== codeId)
      return adminState(data)
    })

    return json(res, 200, state)
  }

  const importMatch = pathname.match(/^\/api\/admin\/activity\/([^/]+)\/import-codes$/)
  if (importMatch && method === 'POST') {
    const activityId = importMatch[1]
    const body = await parseBody(req)
    const incomingCodes = Array.isArray(body.codes) ? body.codes.map((code) => String(code).trim()).filter(Boolean) : []
    const result = await withDataWrite(async (data) => {
      const activity = data.activities.find((item) => item.id === activityId)
      if (!activity) throw Object.assign(new Error('活动不存在'), { status: 404 })

      const prizeType = [...activity.prizeTypes].sort((a, b) => Number(b.weight) - Number(a.weight))[0]
      if (!prizeType) throw Object.assign(new Error('请先创建奖品类型'), { status: 400 })

      const existing = new Set(data.codes.filter((code) => code.lotteryId === activityId).map((code) => code.code))
      const uniqueIncoming = [...new Set(incomingCodes)]
      const toImport = uniqueIncoming.filter((code) => !existing.has(code))

      data.codes.push(...toImport.map((code) => ({
        id: crypto.randomUUID(),
        code,
        status: 'unused',
        createdAt: new Date().toISOString(),
        lotteryId: activity.id,
        prizeType: prizeType.id,
        prizeName: `${prizeType.name}奖品`,
        prizeDescription: `批量导入的${prizeType.name}`,
        weight: prizeType.weight
      })))

      return {
        state: adminState(data),
        importResult: {
          success: true,
          imported: toImport.length,
          skipped: incomingCodes.length - toImport.length,
          total: incomingCodes.length
        }
      }
    })

    return json(res, 200, result)
  }

  const resetMatch = pathname.match(/^\/api\/admin\/activity\/([^/]+)\/reset$/)
  if (resetMatch && method === 'POST') {
    const activityId = resetMatch[1]
    const state = await withDataWrite(async (data) => {
      data.codes = data.codes.map((code) =>
        code.lotteryId === activityId
          ? { ...code, status: 'unused', wonAt: undefined, winnerPhone: undefined }
          : code
      )
      data.records = data.records.filter((record) => record.lotteryId !== activityId)
      return adminState(data)
    })

    return json(res, 200, state)
  }

  return json(res, 404, { error: 'API 不存在' })
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

const serveStatic = async (req, res, url) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return text(res, 405, 'Method Not Allowed')
  }

  const decodedPath = decodeURIComponent(url.pathname)
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath
  let filePath = path.resolve(STATIC_DIR, `.${requestedPath}`)
  const staticRoot = path.resolve(STATIC_DIR)

  if (!filePath.startsWith(staticRoot)) {
    return text(res, 403, 'Forbidden')
  }

  try {
    const stat = await fs.stat(filePath)
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }
  } catch {
    filePath = path.join(STATIC_DIR, 'index.html')
  }

  try {
    const file = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const isHtml = ext === '.html'

    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Content-Length': file.length
    })

    if (req.method === 'HEAD') return res.end()
    return res.end(file)
  } catch {
    return text(res, 404, 'Not Found')
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

    if (url.pathname.startsWith('/api/')) {
      return await routeApi(req, res, url)
    }

    return await serveStatic(req, res, url)
  } catch (error) {
    const status = Number(error.status || 500)
    const message = status >= 500 ? '服务器内部错误' : error.message
    console.error(error)
    return json(res, status, { error: message })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Lucky lottery server listening on http://${HOST}:${PORT}`)
  console.log(`Data file: ${DATA_FILE}`)
  console.log(`Static dir: ${STATIC_DIR}`)
})
