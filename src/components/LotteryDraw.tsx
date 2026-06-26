import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Award,
  Check,
  Copy,
  Crown,
  Gem,
  Gift,
  Heart,
  Info,
  Loader2,
  Phone,
  Sparkles,
  Star,
  Trophy,
  Users
} from 'lucide-react'
import { useLotteryApi } from '../hooks/useLotteryApi'
import Confetti from './Confetti'

interface LotteryDrawProps {
  urlActivityId?: string | null
}

interface DrawResult {
  success: boolean
  won: boolean
  message: string
  lotteryCode?: string
  prizeType?: string
  prizeName?: string
}

const LotteryDraw: React.FC<LotteryDrawProps> = ({ urlActivityId }) => {
  const [phone, setPhone] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [result, setResult] = useState<DrawResult | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showActivitySelector, setShowActivitySelector] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    activities,
    getCurrentActivity,
    hasDrawn,
    drawLottery,
    getAvailableCodes,
    setCurrentActivity,
    loading,
    error,
    connectionStatus
  } = useLotteryApi()

  // 如果URL中指定了活动ID，自动设置当前活动
  useEffect(() => {
    if (urlActivityId && activities.length > 0) {
      const targetActivity = activities.find(activity => activity.id === urlActivityId)
      if (targetActivity) {
        setCurrentActivity(urlActivityId)
      }
    }
  }, [urlActivityId, activities, setCurrentActivity])

  const currentActivity = getCurrentActivity()
  const availableCodes = getAvailableCodes(currentActivity?.id)
  const participantCount = currentActivity?.participantCount || 0

  // 动态设置页面标题
  useEffect(() => {
    if (currentActivity?.displaySettings?.pageTitle) {
      document.title = currentActivity.displaySettings.pageTitle
    }
  }, [currentActivity])

  // 注入自定义CSS
  useEffect(() => {
    if (currentActivity?.displaySettings?.customCss) {
      const styleId = 'custom-activity-styles'
      let styleElement = document.getElementById(styleId) as HTMLStyleElement

      if (!styleElement) {
        styleElement = document.createElement('style')
        styleElement.id = styleId
        document.head.appendChild(styleElement)
      }

      styleElement.textContent = currentActivity.displaySettings.customCss
    }

    return () => {
      const styleElement = document.getElementById('custom-activity-styles')
      if (styleElement) {
        styleElement.remove()
      }
    }
  }, [currentActivity])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 11) {
      setPhone(value)
    }
  }

  const validatePhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  const handleDraw = async () => {
    if (!currentActivity) {
      setResult({ success: false, message: '请先选择抽奖活动', won: false })
      return
    }

    if (!currentActivity.isActive) {
      setResult({ success: false, message: '抽奖活动暂未开启', won: false })
      return
    }

    if (!validatePhone(phone)) {
      setResult({ success: false, message: '请输入正确的手机号码', won: false })
      return
    }

    // 检查是否已抽奖
    const alreadyDrawn = await hasDrawn(phone, currentActivity.id)
    if (alreadyDrawn) {
      setResult({ success: false, message: '该手机号已经参与过此抽奖', won: false })
      return
    }

    if (availableCodes.length === 0) {
      setResult({ success: false, message: '抽奖已结束，奖品已全部发放完毕', won: false })
      return
    }

    setIsDrawing(true)
    setResult(null)

    // 模拟抽奖过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    const drawResult = await drawLottery(phone, currentActivity.id)
    setResult(drawResult)
    setIsDrawing(false)

    if (drawResult.won) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }
  }

  const resetForm = () => {
    setPhone('')
    setResult(null)
    setCopied(false)
  }

  const handleActivityChange = (activityId: string) => {
    setCurrentActivity(activityId)
    setShowActivitySelector(false)
    resetForm()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isLotteryDisabled = !currentActivity?.isActive || availableCodes.length === 0

  const getActivityIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Award': return Award
      case 'Crown': return Crown
      case 'Diamond': return Gem
      case 'Gem': return Gem
      case 'Heart': return Heart
      case 'Star': return Star
      case 'Trophy': return Trophy
      case 'Gift':
      default: return Gift
    }
  }

  // 显示连接错误
  if (connectionStatus === 'error' || error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ed] p-4">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-950/10">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-600" />
          <h1 className="mb-4 text-2xl font-bold text-slate-950">连接失败</h1>
          <p className="mb-4 text-slate-600">{error || '无法连接到服务器'}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-teal-700 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-800"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  if (loading || connectionStatus === 'connecting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ed] p-4">
        <div className="text-center text-slate-700">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-teal-700" />
          <h1 className="mb-2 text-2xl font-bold text-slate-950">加载中...</h1>
          <p>正在连接抽奖系统</p>
        </div>
      </div>
    )
  }

  if (!currentActivity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f4ed] p-4">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-950/10">
          <Gift className="mx-auto mb-4 h-12 w-12 text-teal-700" />
          <h1 className="mb-4 text-2xl font-bold text-slate-950">
            {urlActivityId ? '抽奖活动不存在或已删除' : '暂无可用的抽奖活动'}
          </h1>
          <p className="text-slate-600">
            {urlActivityId ? '请检查链接是否正确' : '请联系管理员创建抽奖活动'}
          </p>
        </div>
      </div>
    )
  }

  const displaySettings = currentActivity.displaySettings || {
    pageTitle: '抽奖活动',
    pageDescription: '参与抽奖，赢取精美奖品',
    showWinRate: true,
    showRemainingCount: true,
    showParticipantCount: false,
    customFooterText: '',
    hideActivitySelector: false,
    customCss: ''
  }
  const activityDescription = (currentActivity.description || '').trim()
  const exchangeInstructions = (currentActivity.exchangeInstructions || '').trim()
  const headerDescription = activityDescription || displaySettings.pageDescription || '参与抽奖，赢取精美奖品'
  const CurrentActivityIcon = getActivityIconComponent(currentActivity.icon)

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f7f4ed] p-4 text-slate-950 lottery-container">
      {/* 活动选择器按钮 - 只在非URL直达模式且未隐藏时显示 */}
      {!urlActivityId && !displaySettings.hideActivitySelector && activities.length > 1 && (
        <button
          onClick={() => setShowActivitySelector(!showActivitySelector)}
          className="fixed left-4 top-4 z-50 rounded-full border border-stone-200 bg-white p-3 text-slate-700 shadow-lg shadow-stone-950/10 transition hover:bg-stone-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
          aria-label="切换抽奖活动"
        >
          <Gift className="w-5 h-5" />
        </button>
      )}

      {/* 活动选择器 - 只在非URL直达模式且未隐藏时显示 */}
      {!urlActivityId && !displaySettings.hideActivitySelector && showActivitySelector && (
        <div className="fixed left-4 top-20 z-50 max-w-sm rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-950/15">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">选择抽奖活动</h3>
            <button
              onClick={() => setShowActivitySelector(false)}
              className="rounded-lg px-2 py-1 text-gray-500 hover:bg-stone-100 hover:text-gray-700"
              aria-label="关闭活动选择器"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            {activities.map((activity) => {
              const ActivityOptionIcon = getActivityIconComponent(activity.icon)

              return (
                <button
                  key={activity.id}
                  onClick={() => handleActivityChange(activity.id)}
                  className={`w-full rounded-xl p-3 text-left transition-colors ${
                    currentActivity.id === activity.id
                      ? 'border border-teal-200 bg-teal-50 text-teal-950'
                      : 'bg-stone-50 text-gray-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ActivityOptionIcon className="h-5 w-5 text-teal-700" />
                    <div>
                      <div className="font-medium">{activity.name}</div>
                      <div className="text-xs text-gray-500">
                        {activity.isActive ? '进行中' : '已暂停'}
                        {activity.displaySettings?.showWinRate && ` • 中奖率 ${activity.winRate}%`}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showConfetti && <Confetti />}

      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-950/20">
            <CurrentActivityIcon className="h-9 w-9" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-950">
            {currentActivity.name}
          </h1>
          <p className="mb-4 whitespace-pre-line text-lg text-slate-600">{headerDescription}</p>

          {/* 抽奖状态提示 - 增加间距 */}
          <div className="space-y-3">
            {displaySettings.showRemainingCount && (
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
                <Gift className="h-4 w-4 text-teal-700" />
                <span className="font-medium text-slate-700">剩余奖品：{availableCodes.length} 个</span>
              </div>
            )}

            {/* 只有在 showWinRate 为 true 时才显示中奖率 */}
            {displaySettings.showWinRate && (
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
                <Sparkles className="h-4 w-4 text-teal-700" />
                <span className="font-medium text-slate-700">中奖率：{currentActivity.winRate}%</span>
              </div>
            )}

            {/* 显示参与人数 */}
            {displaySettings.showParticipantCount && (
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm">
                <Users className="h-4 w-4 text-teal-700" />
                <span className="font-medium text-slate-700">参与人数：{participantCount} 人</span>
              </div>
            )}

            {!currentActivity.isActive && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <span className="font-medium text-amber-800">抽奖活动暂未开启</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-950/10">
          {!result && (
            <div className="relative z-10">
              <div className="mb-8">
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  手机号码
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="请输入手机号码"
                    className="w-full rounded-xl border border-stone-300 bg-stone-50 py-4 pl-12 pr-4 text-lg text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 placeholder:text-slate-400"
                    disabled={isLotteryDisabled}
                  />
                </div>
              </div>

              <button
                onClick={handleDraw}
                disabled={isDrawing || !validatePhone(phone) || isLotteryDisabled}
                className={`flex w-full items-center justify-center gap-3 rounded-xl bg-teal-700 py-5 text-xl font-bold text-white shadow-lg shadow-teal-950/20 transition ${
                  isDrawing || !validatePhone(phone) || isLotteryDisabled
                    ? 'cursor-not-allowed bg-stone-300 text-stone-600 shadow-none'
                    : 'hover:bg-teal-800 hover:shadow-xl'
                }`}
              >
                {isDrawing ? (
                  <>
                    <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
                    抽奖中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    {isLotteryDisabled ? '抽奖暂停' : '开始抽奖'}
                  </>
                )}
              </button>

              {exchangeInstructions && (
                <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-left">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Info className="h-4 w-4 text-teal-700" />
                    兑奖说明
                  </div>
                  <div className="whitespace-pre-line text-sm leading-6 text-slate-600">
                    {exchangeInstructions}
                  </div>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="text-center relative z-10">
              <div className={`mb-6 rounded-2xl border p-6 ${
                result.won
                  ? 'border-teal-200 bg-teal-50'
                  : 'border-rose-200 bg-rose-50'
              }`}>
                <div className={`mb-3 text-3xl font-bold ${
                  result.won ? 'text-teal-800' : 'text-rose-700'
                }`}>
                  {result.message}
                </div>
                {result.won && (
                  <div className="space-y-4">
                    {/* 奖品信息 */}
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                      <div className="mb-2 text-sm text-slate-600">恭喜您获得</div>
                      <div className="mb-2 text-xl font-bold text-slate-950">{result.prizeName}</div>
                      {result.prizeType && currentActivity.prizeTypes?.find(pt => pt.id === result.prizeType) && (
                        <div className="text-sm text-slate-500">
                          {currentActivity.prizeTypes.find(pt => pt.id === result.prizeType)?.name}
                        </div>
                      )}
                    </div>

                    {/* 兑奖码 */}
                    {result.lotteryCode && (
                      <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <div className="mb-2 text-sm text-slate-600">您的兑奖码</div>
                        <div className="relative">
                          <div className="mb-3 rounded-lg bg-stone-100 px-4 py-3 font-mono text-2xl font-bold tracking-wider text-teal-800">
                            {result.lotteryCode}
                          </div>
                          <button
                            onClick={() => copyToClipboard(result.lotteryCode)}
                            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                              copied
                                ? 'border border-teal-200 bg-teal-50 text-teal-800'
                                : 'border border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
                            }`}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                复制兑奖码
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 兑换码使用说明 */}
                    <div className="rounded-xl border border-stone-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm text-slate-700">
                        <Info className="w-4 h-4" />
                        兑换码使用说明
                      </div>
                      <div className="space-y-2 text-left text-sm text-slate-600">
                        {exchangeInstructions ? (
                          <div className="whitespace-pre-line">{exchangeInstructions}</div>
                        ) : (
                          <>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-teal-700">1.</span>
                              <span>请截图保存此兑奖码，或点击复制按钮保存到剪贴板</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-teal-700">2.</span>
                              <span>凭此兑奖码到指定地点领取奖品</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-teal-700">3.</span>
                              <span>兑奖码仅限一次使用，请妥善保管</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-teal-700">4.</span>
                              <span>如有疑问请联系微信：vista8</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={resetForm}
                className="w-full rounded-xl border border-stone-300 bg-white py-4 text-lg font-medium text-slate-700 transition-colors hover:bg-stone-100"
              >
                重新抽奖
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {displaySettings.customFooterText || '每个手机号和 IP 仅可参与一次抽奖'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LotteryDraw
