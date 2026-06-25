import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Award,
  Calendar,
  Clock,
  Crown,
  FileText,
  Gem,
  Gift,
  Globe,
  Heart,
  Palette,
  Save,
  Shield,
  Smartphone,
  Star,
  Target,
  Trophy,
  Type,
  Users,
  X
} from 'lucide-react'
import { LotteryActivity, LotteryRestrictions } from '../types/lottery'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Omit<LotteryActivity, 'id' | 'createdAt'>) => void
  editingActivity?: LotteryActivity | null
}

const backgroundOptions = [
  { value: 'from-stone-100 to-stone-200', label: '纸色', preview: 'bg-gradient-to-r from-stone-100 to-stone-200' },
  { value: 'from-teal-700 to-teal-800', label: '青绿', preview: 'bg-gradient-to-r from-teal-700 to-teal-800' },
  { value: 'from-slate-100 to-stone-200', label: '石色', preview: 'bg-gradient-to-r from-slate-100 to-stone-200' },
  { value: 'from-emerald-50 to-teal-100', label: '浅青', preview: 'bg-gradient-to-r from-emerald-50 to-teal-100' },
  { value: 'from-amber-50 to-stone-100', label: '暖纸', preview: 'bg-gradient-to-r from-amber-50 to-stone-100' },
  { value: 'from-zinc-800 to-stone-900', label: '深石', preview: 'bg-gradient-to-r from-zinc-800 to-stone-900' }
]

const iconOptions = [
  { value: 'Gift', label: '礼品盒' },
  { value: 'Star', label: '星星' },
  { value: 'Trophy', label: '奖杯' },
  { value: 'Crown', label: '皇冠' },
  { value: 'Diamond', label: '钻石' },
  { value: 'Heart', label: '爱心' }
]

const activityIconMap = {
  Award,
  Crown,
  Diamond: Gem,
  Gift,
  Heart,
  Star,
  Trophy
}

type ActivityModalTab = 'basic' | 'restrictions' | 'appearance'

const defaultRestrictions: LotteryRestrictions = {
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

const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingActivity
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    winRate: 30,
    isActive: true,
    maxDrawsPerPhone: 1,
    backgroundColor: 'from-stone-100 to-stone-200',
    icon: 'Gift',
    exchangeInstructions: '',
    restrictions: defaultRestrictions
  })
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ActivityModalTab>('basic')
  const [submitError, setSubmitError] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // 重置表单数据的函数
  const resetFormData = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      winRate: 30,
      isActive: true,
      maxDrawsPerPhone: 1,
      backgroundColor: 'from-stone-100 to-stone-200',
      icon: 'Gift',
      exchangeInstructions: '',
      restrictions: defaultRestrictions
    })
    setActiveTab('basic')
    setSubmitError('')
  }, [])

  const handleClose = useCallback(() => {
    resetFormData()
    onClose()
  }, [onClose, resetFormData])

  // 当编辑活动变化时更新表单数据
  useEffect(() => {
    if (editingActivity) {
      console.log('设置编辑活动数据:', editingActivity)
      setFormData({
        name: editingActivity.name || '',
        description: editingActivity.description || '',
        winRate: editingActivity.winRate || 30,
        isActive: editingActivity.isActive !== undefined ? editingActivity.isActive : true,
        maxDrawsPerPhone: editingActivity.maxDrawsPerPhone || 1,
        backgroundColor: editingActivity.backgroundColor || 'from-stone-100 to-stone-200',
        icon: editingActivity.icon || 'Gift',
        exchangeInstructions: editingActivity.exchangeInstructions || '',
        restrictions: editingActivity.restrictions || defaultRestrictions
      })
    } else {
      resetFormData()
    }
  }, [editingActivity, isOpen, resetFormData])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => nameInputRef.current?.focus(), 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose, isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setSubmitError('请输入活动名称')
      setActiveTab('basic')
      window.setTimeout(() => nameInputRef.current?.focus(), 0)
      return
    }

    setIsLoading(true)
    setSubmitError('')

    try {
      // 模拟保存延迟
      await new Promise(resolve => setTimeout(resolve, 500))

      // 构建保存数据，包含奖品类型和默认显示设置
      const saveData = {
        ...formData,
        prizeTypes: editingActivity?.prizeTypes || [],
        displaySettings: editingActivity?.displaySettings || {
          pageTitle: '抽奖活动',
          pageDescription: '参与抽奖，赢取精美奖品',
          showWinRate: true,
          showRemainingCount: true,
          showParticipantCount: false,
          customFooterText: '',
          hideActivitySelector: false,
          customCss: ''
        }
      }

      console.log('保存活动数据:', saveData)
      onSave(saveData)

      // 保存成功后重置表单
      resetFormData()
      onClose()
    } catch (err) {
      console.error('保存活动失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const PreviewIcon = activityIconMap[formData.icon as keyof typeof activityIconMap] || Gift
  const previewIsDark = formData.backgroundColor.includes('teal-700') ||
    formData.backgroundColor.includes('zinc-800')

  const updateRestrictions = (path: string, value: boolean | number | string) => {
    setFormData(prev => {
      const newRestrictions = structuredClone(prev.restrictions) as unknown as Record<string, unknown>
      const keys = path.split('.')
      let current = newRestrictions

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>
      }
      current[keys[keys.length - 1]] = value

      return { ...prev, restrictions: newRestrictions as unknown as LotteryRestrictions }
    })
  }

  // 阻止事件冒泡，防止点击模态框内容时关闭
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // 点击背景关闭模态框
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
        className="grid max-h-[calc(100dvh-2rem)] w-full max-w-5xl grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-slate-950/20"
        onClick={handleModalContentClick}
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700 ring-1 ring-teal-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="activity-modal-title" className="text-xl font-semibold tracking-tight text-slate-950">
                {editingActivity ? '编辑抽奖活动' : '创建抽奖活动'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">配置活动信息、限制规则和公开页外观</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-stone-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="flex gap-2 overflow-x-auto border-b border-stone-200 px-4 py-2 sm:px-6" role="tablist" aria-label="活动配置分组">
          {[
            { key: 'basic', label: '基本设置', icon: Type },
            { key: 'restrictions', label: '抽奖限制', icon: Shield },
            { key: 'appearance', label: '外观设置', icon: Palette }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setActiveTab(tab.key as ActivityModalTab)
              }}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-200 bg-teal-50 text-teal-800'
                  : 'border-transparent text-slate-600 hover:bg-stone-100 hover:text-slate-950'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          <form id="activity-modal-form" onSubmit={handleSubmit}>
            {submitError && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                {submitError}
              </div>
            )}

            {/* 基本设置 */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    基本信息
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        活动名称 *
                      </label>
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, name: e.target.value }))
                          if (submitError) setSubmitError('')
                        }}
                        placeholder="请输入活动名称"
                        className={`w-full rounded-xl border bg-white p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 ${
                          submitError ? 'border-amber-300' : 'border-stone-300'
                        }`}
                        aria-invalid={Boolean(submitError)}
                        aria-describedby={submitError ? 'activity-name-error' : undefined}
                      />
                      {submitError && (
                        <p id="activity-name-error" className="mt-2 text-sm text-amber-800">{submitError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        活动状态
                      </label>
                      <select
                        value={formData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                        className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                      >
                        <option value="active">开启</option>
                        <option value="inactive">暂停</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      活动描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="请输入活动描述"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                    />
                  </div>
                </div>

                {/* 抽奖设置 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    抽奖设置
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        中奖率 ({formData.winRate}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.winRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, winRate: Number(e.target.value) }))}
                        className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        每人限抽次数（兼容旧版）
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.maxDrawsPerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxDrawsPerPhone: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        注：建议使用"抽奖限制"标签页的详细配置
                      </div>
                    </div>
                  </div>
                </div>

                {/* 兑换码使用说明 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    兑换码使用说明（可选）
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      自定义兑换说明
                    </label>
                    <textarea
                      value={formData.exchangeInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, exchangeInstructions: e.target.value }))}
                      placeholder="请输入兑换码使用说明，如兑换地点、联系方式等（留空则使用默认说明）"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-stone-300 bg-white p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      提示：如果不填写，系统将显示默认的兑换说明
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 抽奖限制设置 */}
            {activeTab === 'restrictions' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-teal-900">
                    <Shield className="w-5 h-5" />
                    <span className="font-medium">抽奖限制说明</span>
                  </div>
                  <p className="text-sm leading-6 text-teal-800">
                    通过配置抽奖限制，可以有效防止刷奖行为，确保抽奖活动的公平性。您可以根据需要启用不同的限制策略。
                  </p>
                </div>

                {/* 手机号限制 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-teal-700" />
                      <h4 className="font-medium text-gray-900">手机号限制</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.restrictions.phoneRestriction.enabled}
                        onChange={(e) => updateRestrictions('phoneRestriction.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-700 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-200"></div>
                    </label>
                  </div>

                  {formData.restrictions.phoneRestriction.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            每个手机号最大抽奖次数
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.restrictions.phoneRestriction.maxDrawsPerPhone}
                            onChange={(e) => updateRestrictions('phoneRestriction.maxDrawsPerPhone', Number(e.target.value))}
                            className="w-full rounded-lg border border-stone-300 p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            重置周期
                          </label>
                          <select
                            value={formData.restrictions.phoneRestriction.resetPeriod}
                            onChange={(e) => updateRestrictions('phoneRestriction.resetPeriod', e.target.value)}
                            className="w-full rounded-lg border border-stone-300 p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                          >
                            <option value="never">永不重置</option>
                            <option value="daily">每日重置</option>
                            <option value="weekly">每周重置</option>
                            <option value="monthly">每月重置</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* IP限制 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-teal-700" />
                      <h4 className="font-medium text-gray-900">IP地址限制</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.restrictions.ipRestriction.enabled}
                        onChange={(e) => updateRestrictions('ipRestriction.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-700 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-200"></div>
                    </label>
                  </div>

                  {formData.restrictions.ipRestriction.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            每个IP最大抽奖次数
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.restrictions.ipRestriction.maxDrawsPerIP}
                            onChange={(e) => updateRestrictions('ipRestriction.maxDrawsPerIP', Number(e.target.value))}
                            className="w-full rounded-lg border border-stone-300 p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            重置周期
                          </label>
                          <select
                            value={formData.restrictions.ipRestriction.resetPeriod}
                            onChange={(e) => updateRestrictions('ipRestriction.resetPeriod', e.target.value)}
                            className="w-full rounded-lg border border-stone-300 p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                          >
                            <option value="never">永不重置</option>
                            <option value="daily">每日重置</option>
                            <option value="weekly">每周重置</option>
                            <option value="monthly">每月重置</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 时间限制 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-teal-700" />
                      <h4 className="font-medium text-gray-900">抽奖冷却时间</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.restrictions.timeRestriction.enabled}
                        onChange={(e) => updateRestrictions('timeRestriction.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-700 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-200"></div>
                    </label>
                  </div>

                  {formData.restrictions.timeRestriction.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        冷却时间（分钟）
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={formData.restrictions.timeRestriction.cooldownMinutes}
                        onChange={(e) => updateRestrictions('timeRestriction.cooldownMinutes', Number(e.target.value))}
                        className="w-full rounded-lg border border-stone-300 p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                        placeholder="设置两次抽奖之间的最小间隔时间"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        用户在抽奖后需要等待指定时间才能再次抽奖
                      </div>
                    </div>
                  )}
                </div>

                {/* 组合限制 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-teal-700" />
                      <h4 className="font-medium text-gray-900">组合限制（每日）</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.restrictions.combinedRestriction.enabled}
                        onChange={(e) => updateRestrictions('combinedRestriction.enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-stone-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-stone-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-700 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-200"></div>
                    </label>
                  </div>

                  {formData.restrictions.combinedRestriction.enabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            每个手机号每日最大抽奖次数
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.restrictions.combinedRestriction.maxDrawsPerPhonePerDay}
                            onChange={(e) => updateRestrictions('combinedRestriction.maxDrawsPerPhonePerDay', Number(e.target.value))}
                            className="w-full rounded-lg border border-stone-300 p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            每个IP每日最大抽奖次数
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.restrictions.combinedRestriction.maxDrawsPerIPPerDay}
                            onChange={(e) => updateRestrictions('combinedRestriction.maxDrawsPerIPPerDay', Number(e.target.value))}
                            className="w-full rounded-lg border border-stone-300 p-3 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        组合限制会同时检查手机号和IP的每日抽奖次数，任一条件达到限制都会阻止抽奖
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 外观设置 */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    背景主题
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {backgroundOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, backgroundColor: option.value }))}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.backgroundColor === option.value
                            ? 'border-teal-600 ring-2 ring-teal-100'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg mb-2 ${option.preview}`}></div>
                        <div className="text-xs text-gray-600">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    活动图标
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {iconOptions.map((option) => {
                      const IconComponent = activityIconMap[option.value as keyof typeof activityIconMap] || Gift

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            formData.icon === option.value
                              ? 'border-teal-600 ring-2 ring-teal-100 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className="mx-auto mb-1 h-6 w-6 text-teal-700" />
                          <div className="text-xs text-gray-600">{option.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 预览 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    预览效果
                  </h3>

                  <div className={`p-6 rounded-xl bg-gradient-to-r ${formData.backgroundColor} ${previewIsDark ? 'text-white' : 'text-slate-950'} text-center border border-stone-200`}>
                    <PreviewIcon className="mx-auto mb-2 h-10 w-10" />
                    <h4 className="text-xl font-bold mb-2">{formData.name || '活动名称'}</h4>
                    <p className={`${previewIsDark ? 'text-white/80' : 'text-slate-600'} mb-4`}>{formData.description || '活动描述'}</p>
                    <div className="flex justify-center gap-4 text-sm">
                      <span className={`${previewIsDark ? 'bg-white/20' : 'bg-white/70'} px-3 py-1 rounded-full`}>
                        剩余奖品：10 个
                      </span>
                      <span className={`${previewIsDark ? 'bg-white/20' : 'bg-white/70'} px-3 py-1 rounded-full`}>
                        中奖率：{formData.winRate}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="border-t border-stone-200 bg-stone-50/95 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {activeTab === 'basic' ? '填写名称后即可创建，限制和外观可稍后继续调整。' : '修改会随保存一起生效。'}
            </p>
            <div className="flex flex-col-reverse gap-3 sm:w-auto sm:min-w-[420px] sm:flex-row">
          <button
            type="button"
            onClick={handleClose}
                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-stone-100"
          >
            取消
          </button>
          <button
            type="submit"
            form="activity-modal-form"
            disabled={isLoading || !formData.name.trim()}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 font-medium text-white transition-all duration-200 ${
              isLoading || !formData.name.trim()
                ? 'cursor-not-allowed bg-stone-300 text-stone-600'
                : 'hover:-translate-y-px hover:bg-teal-800 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editingActivity ? '更新活动' : '创建活动'}
              </>
            )}
          </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityModal
