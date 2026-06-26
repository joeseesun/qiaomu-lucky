import React, { useState } from 'react'
import { Settings, Plus, Trash2, Download, Upload, BarChart3, Users, Gift, Eye, EyeOff, Edit3, LogOut, Sliders, Play, Pause, ArrowLeft, Palette, Calendar, Target, Star, Trophy, Award, Crown, Gem, Loader2, AlertCircle, CheckCircle, XCircle, Link, Copy, Check, Archive, RotateCcw } from 'lucide-react'
import { useLotteryApi } from '../hooks/useLotteryApi'
import PrizeModal from './PrizeModal'
import PrizeTypeModal from './PrizeTypeModal'
import ActivityModal from './ActivityModal'
import { LotteryActivity, LotteryCode, PrizeType } from '../types/lottery'

interface AdminPanelProps {
  onLogout: () => void
  onBackToLottery: () => void
}

interface ConfirmDialogState {
  title: string
  message: string
  confirmLabel: string
  tone?: 'danger' | 'default'
  onConfirm: () => Promise<void> | void
}

type AdminTab = 'overview' | 'activities' | 'prize-types' | 'codes' | 'records'
type ActivityView = 'active' | 'archived'

const prizeIcons = {
  'Gift': Gift,
  'Trophy': Trophy,
  'Star': Star,
  'Award': Award,
  'Crown': Crown,
  'Gem': Gem
}

interface MetricCardProps {
  label: string
  value: number | string
  helper: string
  icon: React.ElementType
  tone?: 'teal' | 'slate' | 'amber' | 'rose'
}

const metricToneClass = {
  teal: 'bg-teal-50 text-teal-700 ring-teal-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100'
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, helper, icon: Icon, tone = 'teal' }) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-px hover:shadow-md">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      </div>
      <div className={`rounded-xl p-2.5 ring-1 ${metricToneClass[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="mt-4 text-sm text-slate-500">{helper}</div>
  </div>
)

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm ring-1 ring-stone-200">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-teal-800"
      >
        {actionLabel}
      </button>
    )}
  </div>
)

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onBackToLottery }) => {
  const {
    activities,
    codes,
    records,
    currentActivityId,
    loading,
    error,
    getCurrentActivity,
    getAvailableCodes,
    addCode,
    removeCode,
    updateCode,
    resetLottery,
    importCodes,
    createActivity,
    updateActivity,
    deleteActivity,
    setCurrentActivity,
    createPrizeType,
    updatePrizeType,
    deletePrizeType
  } = useLotteryApi()

  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showPhones, setShowPhones] = useState(false)
  const [showPrizeModal, setShowPrizeModal] = useState(false)
  const [showPrizeTypeModal, setShowPrizeTypeModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [editingPrize, setEditingPrize] = useState<LotteryCode | null>(null)
  const [editingPrizeType, setEditingPrizeType] = useState<PrizeType | null>(null)
  const [editingActivity, setEditingActivity] = useState<LotteryActivity | null>(null)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [activityView, setActivityView] = useState<ActivityView>('active')
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    imported?: number
    skipped?: number
    total?: number
  } | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)

  const currentActivity = getCurrentActivity()
  const currentCodes = codes.filter(code => code.lotteryId === currentActivity?.id)
  const currentRecords = records.filter(record => record.lotteryId === currentActivity?.id)
  const availableCodes = getAvailableCodes(currentActivity?.id)
  const activeActivities = activities.filter(activity => activity.isArchived !== true)
  const archivedActivities = activities.filter(activity => activity.isArchived === true)
  const visibleActivities = activityView === 'archived' ? archivedActivities : activeActivities
  const currentActivityIsArchived = currentActivity?.isArchived === true

  const getActivityStatus = (activity: LotteryActivity) => {
    if (activity.isArchived) {
      return {
        label: '已归档',
        textClass: 'text-slate-500',
        badgeClass: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
        iconWrapClass: 'bg-slate-100',
        iconClass: 'text-slate-500'
      }
    }

    if (activity.isActive) {
      return {
        label: '已上线',
        textClass: 'text-teal-700',
        badgeClass: 'bg-teal-50 text-teal-800 ring-1 ring-teal-100',
        iconWrapClass: 'bg-teal-50',
        iconClass: 'text-teal-700'
      }
    }

    return {
      label: '已下线',
      textClass: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
      iconWrapClass: 'bg-amber-50',
      iconClass: 'text-amber-700'
    }
  }

  const handleAddPrize = () => {
    setEditingPrize(null)
    setShowPrizeModal(true)
  }

  const handleEditPrize = (prize: LotteryCode) => {
    setEditingPrize(prize)
    setShowPrizeModal(true)
  }

  const handleSavePrize = async (code: string, prizeType: string, prizeName: string, prizeValue?: string, prizeDescription?: string) => {
    try {
      await addCode(code, prizeType, prizeName, prizeValue, prizeDescription, currentActivity?.id)
    } catch (err) {
      console.error('Error saving prize:', err)
    }
  }

  const handleUpdatePrize = async (id: string, code: string, prizeType: string, prizeName: string, prizeValue?: string, prizeDescription?: string) => {
    try {
      await updateCode(id, code, prizeType, prizeName, prizeValue, prizeDescription)
    } catch (err) {
      console.error('Error updating prize:', err)
    }
  }

  const handleDeletePrize = async (id: string, code: string) => {
    setConfirmDialog({
      title: '删除奖品码',
      message: `确定要删除奖品码 "${code}" 吗？`,
      confirmLabel: '删除',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await removeCode(id)
        } catch (err) {
          console.error('Error deleting prize:', err)
        }
      }
    })
  }

  const handleAddPrizeType = () => {
    setEditingPrizeType(null)
    setShowPrizeTypeModal(true)
  }

  const handleEditPrizeType = (prizeType: PrizeType) => {
    setEditingPrizeType(prizeType)
    setShowPrizeTypeModal(true)
  }

  const handleSavePrizeType = async (prizeTypeData: Omit<PrizeType, 'id'>) => {
    try {
      if (editingPrizeType) {
        await updatePrizeType(editingPrizeType.id, prizeTypeData)
      } else {
        await createPrizeType(prizeTypeData, currentActivity?.id)
      }
    } catch (err) {
      console.error('Error saving prize type:', err)
    }
  }

  const handleDeletePrizeType = async (id: string, name: string) => {
    const relatedCodes = currentCodes.filter(code => code.prizeType === id)
    setConfirmDialog({
      title: '删除奖品类型',
      message: relatedCodes.length > 0
        ? `删除奖品类型 "${name}" 将同时删除 ${relatedCodes.length} 个相关奖品码，确定要继续吗？`
        : `确定要删除奖品类型 "${name}" 吗？`,
      confirmLabel: '删除',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await deletePrizeType(id)
        } catch (err) {
          console.error('Error deleting prize type:', err)
        }
      }
    })
  }

  const handleCreateActivity = () => {
    setEditingActivity(null)
    setShowActivityModal(true)
  }

  const handleEditActivity = (activity: LotteryActivity) => {
    setEditingActivity(activity)
    setShowActivityModal(true)
  }

  const handleSaveActivity = async (activityData: Omit<LotteryActivity, 'id' | 'createdAt'>) => {
    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, activityData)
      } else {
        const newId = await createActivity(activityData)
        if (newId) {
          setCurrentActivity(newId)
        }
      }
    } catch (err) {
      console.error('Error saving activity:', err)
    }
  }

  const handleDeleteActivity = async (id: string, name: string) => {
    setConfirmDialog({
      title: '删除抽奖活动',
      message: `确定要删除抽奖活动 "${name}" 吗？此操作将删除所有相关数据。`,
      confirmLabel: '删除',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await deleteActivity(id)
        } catch (err) {
          console.error('Error deleting activity:', err)
        }
      }
    })
  }

  const handleImport = async () => {
    if (!importText.trim()) {
      setImportResult({
        success: false,
        message: '请输入要导入的奖品码'
      })
      return
    }

    if (!currentActivity) {
      setImportResult({
        success: false,
        message: '请先选择抽奖活动'
      })
      return
    }

    setImportLoading(true)
    setImportResult(null)

    try {
      const codes = importText.split('\n').filter(code => code.trim())
      console.log('准备导入的奖品码:', codes)

      const result = await importCodes(codes, currentActivity.id)

      setImportResult({
        success: true,
        message: `成功导入 ${result.imported} 个奖品码${result.skipped > 0 ? `，跳过 ${result.skipped} 个重复的奖品码` : ''}`,
        imported: result.imported,
        skipped: result.skipped,
        total: result.total
      })

      setImportText('')

      // 3秒后自动关闭导入界面
      setTimeout(() => {
        setShowImport(false)
        setImportResult(null)
      }, 3000)

    } catch (err) {
      console.error('导入失败:', err)
      setImportResult({
        success: false,
        message: err instanceof Error ? err.message : '导入失败，请重试'
      })
    } finally {
      setImportLoading(false)
    }
  }

  const exportData = () => {
    const data = {
      activities,
      codes,
      records,
      exportTime: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lottery_data_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = async () => {
    setConfirmDialog({
      title: '重置当前活动',
      message: '确定要重置当前抽奖记录和已发放奖品吗？此操作不可恢复。',
      confirmLabel: '重置',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await resetLottery(currentActivity?.id)
        } catch (err) {
          console.error('Error resetting lottery:', err)
        }
      }
    })
  }

  const handleSetActivityActive = async (activity: LotteryActivity, isActive: boolean) => {
    if (activity.isArchived) return

    try {
      await updateActivity(activity.id, { isActive })
    } catch (err) {
      console.error('Error updating activity online state:', err)
    }
  }

  const handleToggleActive = async () => {
    if (!currentActivity || currentActivity.isArchived) return
    await handleSetActivityActive(currentActivity, !currentActivity.isActive)
  }

  const handleArchiveActivity = (activity: LotteryActivity) => {
    setConfirmDialog({
      title: '归档抽奖活动',
      message: `归档 "${activity.name}" 后，公开抽奖页将不再展示该活动，也不能继续抽奖；后台会保留活动、奖品码和中奖记录。确定归档吗？`,
      confirmLabel: '归档',
      tone: 'danger',
      onConfirm: async () => {
        try {
          await updateActivity(activity.id, {
            isActive: false,
            isArchived: true,
            archivedAt: new Date().toISOString()
          })
          setActivityView('archived')
          setCurrentActivity(activity.id)
        } catch (err) {
          console.error('Error archiving activity:', err)
        }
      }
    })
  }

  const handleRestoreActivity = async (activity: LotteryActivity) => {
    try {
      await updateActivity(activity.id, {
        isArchived: false,
        archivedAt: null
      })
      setActivityView('active')
      setCurrentActivity(activity.id)
    } catch (err) {
      console.error('Error restoring activity:', err)
    }
  }

  const handleWinRateChange = async (winRate: number) => {
    if (currentActivity) {
      try {
        await updateActivity(currentActivity.id, { winRate })
      } catch (err) {
        console.error('Error updating win rate:', err)
      }
    }
  }

  const handleLogout = () => {
    setConfirmDialog({
      title: '退出管理后台',
      message: '确定要退出当前管理会话吗？',
      confirmLabel: '退出',
      onConfirm: onLogout
    })
  }

  const handleConfirm = async () => {
    const action = confirmDialog?.onConfirm
    setConfirmDialog(null)
    await action?.()
  }

  // 生成活动直达链接
  const generateActivityLink = (activityId: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}?activity=${activityId}`
  }

  // 复制活动链接
  const copyActivityLink = async (activityId: string) => {
    const link = generateActivityLink(activityId)
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(activityId)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedLink(activityId)
      setTimeout(() => setCopiedLink(null), 2000)
    }
  }

  // 修复统计数据：只计算可用的奖品数量
  const stats = {
    totalActivities: activeActivities.length,
    activeActivities: activeActivities.filter(a => a.isActive).length,
    archivedActivities: archivedActivities.length,
    totalCodes: availableCodes.length, // 修改：只计算可用的奖品数量
    usedCodes: currentCodes.filter(code => code.status === 'won').length,
    totalParticipants: currentRecords.length,
    winners: currentRecords.filter(record => record.won).length
  }
  const currentActivityStatus = currentActivity ? getActivityStatus(currentActivity) : null

  const maskPhone = (phone: string) => {
    if (!showPhones) {
      return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3')
    }
    return phone
  }

  const getPrizeTypeStats = () => {
    if (!currentActivity || !currentActivity.prizeTypes) return []

    return (currentActivity.prizeTypes || []).map(prizeType => {
      const typeCodes = currentCodes.filter(code => code.prizeType === prizeType.id)
      const usedCodes = typeCodes.filter(code => code.status === 'won')
      return {
        ...prizeType,
        totalCount: typeCodes.length,
        usedCount: usedCodes.length,
        remainingCount: typeCodes.length - usedCodes.length
      }
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f4ed]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-teal-700" />
          <h2 className="mb-2 text-xl font-semibold text-slate-950">加载管理后台...</h2>
          <p className="text-slate-500">正在连接抽奖数据</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f4ed] p-4">
        <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-950/10">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-600" />
          <h2 className="mb-2 text-xl font-semibold text-slate-950">连接失败</h2>
          <p className="mb-4 text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-teal-700 px-4 py-2 text-white transition-colors hover:bg-teal-800"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#f7f4ed] p-4 text-slate-950 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* 头部 */}
        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-700 p-3 text-white shadow-lg shadow-teal-950/20">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">抽奖管理后台</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>当前活动：{currentActivity?.name || '未选择'}</span>
                  {currentActivityStatus && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${currentActivityStatus.badgeClass}`}>
                      {currentActivityStatus.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onBackToLottery}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-100"
              >
                <ArrowLeft className="w-4 h-4" />
                返回抽奖
              </button>
              <button
                onClick={() => setShowPhones(!showPhones)}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-100"
              >
                {showPhones ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPhones ? '隐藏' : '显示'}手机号
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>

          {/* 活动选择器 */}
          <div className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal-700" />
                  <span className="font-medium text-slate-900">选择抽奖活动</span>
                </div>
                <select
                  value={currentActivityId || ''}
                  onChange={(e) => setCurrentActivity(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 sm:min-w-[280px]"
                >
                  {activeActivities.length > 0 && (
                    <optgroup label="未归档活动">
                      {activeActivities.map(activity => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name} ({getActivityStatus(activity).label})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {archivedActivities.length > 0 && (
                    <optgroup label="归档活动">
                      {archivedActivities.map(activity => (
                        <option key={activity.id} value={activity.id}>
                          {activity.name} (已归档)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <button
                onClick={handleCreateActivity}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-teal-800"
              >
                <Plus className="w-4 h-4" />
                新建活动
              </button>
            </div>
          </div>

          {/* 标签页导航 */}
          <div className="mb-1 flex gap-1 overflow-x-auto rounded-2xl bg-stone-100 p-1">
            {([
              { key: 'overview', label: '概览', icon: BarChart3 },
              { key: 'activities', label: '活动管理', icon: Calendar },
              { key: 'prize-types', label: '奖品类型', icon: Palette },
              { key: 'codes', label: '奖品管理', icon: Gift },
              { key: 'records', label: '中奖记录', icon: Users }
            ] satisfies Array<{ key: AdminTab; label: string; icon: React.ElementType }>).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 概览页面 */}
        {activeTab === 'overview' && (
          <>
            {/* 统计卡片 */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <MetricCard
                icon={Calendar}
                label="活动"
                value={`${stats.activeActivities}/${stats.totalActivities}`}
                helper={`上线 / 未归档，归档 ${stats.archivedActivities} 个`}
                tone="teal"
              />
              <MetricCard
                icon={Gift}
                label="剩余奖品"
                value={stats.totalCodes}
                helper={`已发放 ${stats.usedCodes} 个`}
                tone="slate"
              />
              <MetricCard
                icon={Users}
                label="参与"
                value={stats.totalParticipants}
                helper="当前活动记录数"
                tone="amber"
              />
              <MetricCard
                icon={BarChart3}
                label="中奖"
                value={stats.winners}
                helper="当前活动中奖人数"
                tone="rose"
              />
            </div>

            {/* 奖品类型统计 */}
            {currentActivity && (
              <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-950">奖品类型统计</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {getPrizeTypeStats().map((prizeType) => {
                    const IconComponent = prizeIcons[prizeType.icon as keyof typeof prizeIcons] || Gift
                    return (
                      <div key={prizeType.id} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg`} style={{ backgroundColor: prizeType.color + '20' }}>
                            <IconComponent className="w-5 h-5" style={{ color: prizeType.color }} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-950">{prizeType.name}</div>
                            <div className="text-xs text-slate-500">权重: {prizeType.weight}</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">总数:</span>
                            <span className="font-medium">{prizeType.totalCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">已发放:</span>
                            <span className="font-medium text-rose-600">{prizeType.usedCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">剩余:</span>
                            <span className="font-medium text-teal-700">{prizeType.remainingCount}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 当前活动控制 */}
            {currentActivity && (
              <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-950">当前活动控制</h2>

                <div className="mb-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-xl p-3 ${currentActivity.isArchived ? 'bg-slate-500' : currentActivity.isActive ? 'bg-teal-700' : 'bg-amber-500'}`}>
                        {currentActivity.isArchived ? (
                          <Archive className="w-6 h-6 text-white" />
                        ) : currentActivity.isActive ? (
                          <Play className="w-6 h-6 text-white" />
                        ) : (
                          <Pause className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{currentActivity.name}</h3>
                        <p className="text-sm text-slate-500">
                          状态：
                          <span className={`ml-1 font-medium ${currentActivityStatus?.textClass || 'text-slate-600'}`}>
                            {currentActivityStatus?.label}
                          </span>
                          ｜中奖率：{currentActivity.winRate}%
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {!currentActivityIsArchived && (
                        <button
                          onClick={() => copyActivityLink(currentActivity.id)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                            copiedLink === currentActivity.id
                              ? 'border-teal-200 bg-teal-50 text-teal-800'
                              : 'border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
                          }`}
                          aria-label="复制活动直达链接"
                        >
                          {copiedLink === currentActivity.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Link className="w-4 h-4" />
                              复制链接
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleEditActivity(currentActivity)}
                        className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-stone-100"
                      >
                        <Edit3 className="w-4 h-4" />
                        编辑活动
                      </button>
                      {currentActivityIsArchived ? (
                        <button
                          onClick={() => handleRestoreActivity(currentActivity)}
                          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
                        >
                          <RotateCcw className="w-4 h-4" />
                          恢复归档
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleToggleActive}
                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                              currentActivity.isActive
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'bg-teal-700 text-white hover:bg-teal-800'
                            }`}
                          >
                            {currentActivity.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {currentActivity.isActive ? '下线活动' : '重新上线'}
                          </button>
                          <button
                            onClick={() => handleArchiveActivity(currentActivity)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            <Archive className="w-4 h-4" />
                            归档活动
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 中奖率调节 */}
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-6">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-950">
                    <Sliders className="w-5 h-5" />
                    中奖率设置
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        调节中奖率
                      </label>
                      <div className="space-y-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={currentActivity.winRate}
                          onChange={(e) => handleWinRateChange(Number(e.target.value))}
                          disabled={currentActivityIsArchived}
                          className={`slider h-2 w-full appearance-none rounded-lg bg-stone-200 ${currentActivityIsArchived ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        />
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>0%</span>
                          <span className="text-lg font-semibold text-teal-700">{currentActivity.winRate}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        活动统计
                      </label>
                      <div className="bg-white p-4 rounded-lg border space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">剩余奖品：</span>
                          <span className="font-medium text-teal-700">{availableCodes.length} 个</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">已发放：</span>
                          <span className="font-medium text-slate-700">{stats.usedCodes} 个</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">参与人数：</span>
                          <span className="font-medium">{stats.totalParticipants} 人</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 活动管理页面 */}
        {activeTab === 'activities' && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">抽奖活动管理</h2>
                <p className="mt-1 text-sm text-slate-500">下线会保留公开页但停止抽奖；归档会从公开列表隐藏并保留数据。</p>
              </div>
              <button
                onClick={handleCreateActivity}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-teal-800"
              >
                <Plus className="w-4 h-4" />
                新建活动
              </button>
            </div>

            <div className="mb-5 inline-flex rounded-2xl bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setActivityView('active')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activityView === 'active'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'
                }`}
              >
                未归档 {activeActivities.length}
              </button>
              <button
                type="button"
                onClick={() => setActivityView('archived')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activityView === 'archived'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-950'
                }`}
              >
                已归档 {archivedActivities.length}
              </button>
            </div>

            {visibleActivities.length === 0 ? (
              <EmptyState
                icon={activityView === 'archived' ? Archive : Calendar}
                title={activityView === 'archived' ? '还没有归档活动' : '还没有未归档活动'}
                description={activityView === 'archived'
                  ? '归档后的活动会保留数据，并集中出现在这里。'
                  : '先创建一个活动，再添加奖品类型和奖品码。'}
                actionLabel={activityView === 'active' ? '创建活动' : undefined}
                onAction={activityView === 'active' ? handleCreateActivity : undefined}
              />
            ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleActivities.map((activity) => {
                const activityCodes = codes.filter(c => c.lotteryId === activity.id)
                const activityAvailableCodes = activityCodes.filter(c => c.status === 'unused')
                const activityRecords = records.filter(r => r.lotteryId === activity.id)
                const activityStatus = getActivityStatus(activity)

                return (
                  <div key={activity.id} className={`rounded-xl border p-6 transition-shadow hover:shadow-md ${activity.isArchived ? 'border-slate-200 bg-slate-50/60' : 'bg-white'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${activityStatus.iconWrapClass}`}>
                          {activity.isArchived ? (
                            <Archive className={`h-5 w-5 ${activityStatus.iconClass}`} />
                          ) : (
                            <Calendar className={`h-5 w-5 ${activityStatus.iconClass}`} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${activityStatus.badgeClass}`}>
                        {activityStatus.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">中奖率：</span>
                        <span className="font-medium">{activity.winRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">剩余奖品：</span>
                        <span className="font-medium text-teal-700">{activityAvailableCodes.length} 个</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">已发放：</span>
                        <span className="font-medium text-rose-600">{activityCodes.length - activityAvailableCodes.length} 个</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">参与人数：</span>
                        <span className="font-medium">{activityRecords.length} 人</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">奖品类型：</span>
                        <span className="font-medium">{(activity.prizeTypes || []).length} 种</span>
                      </div>
                    </div>

                    {!activity.isArchived && (
                      <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
                        <div className="text-xs text-gray-600 mb-2">活动直达链接：</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 text-xs text-gray-800 font-mono bg-white px-2 py-1 rounded border truncate">
                            {generateActivityLink(activity.id)}
                          </div>
                          <button
                            onClick={() => copyActivityLink(activity.id)}
                            className={`p-1 rounded transition-colors ${
                              copiedLink === activity.id
                                ? 'text-teal-700 bg-teal-50'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                            }`}
                            aria-label="复制链接"
                          >
                            {copiedLink === activity.id ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCurrentActivity(activity.id)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          currentActivityId === activity.id
                            ? 'bg-teal-700 text-white'
                            : 'bg-stone-100 text-slate-700 hover:bg-stone-200'
                        }`}
                      >
                        {currentActivityId === activity.id ? '当前活动' : '切换到此活动'}
                      </button>
                      <button
                        onClick={() => handleEditActivity(activity)}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-800"
                        aria-label="编辑活动"
                        title="编辑活动"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!activity.isArchived && (
                        <button
                          onClick={() => handleSetActivityActive(activity, !activity.isActive)}
                          className={`rounded-lg p-2 transition-colors ${
                            activity.isActive
                              ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                              : 'text-teal-700 hover:bg-teal-50 hover:text-teal-800'
                          }`}
                          aria-label={activity.isActive ? '下线活动' : '重新上线'}
                          title={activity.isActive ? '下线活动' : '重新上线'}
                        >
                          {activity.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      )}
                      {activity.isArchived ? (
                        <button
                          onClick={() => handleRestoreActivity(activity)}
                          className="rounded-lg p-2 text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
                          aria-label="恢复归档"
                          title="恢复归档"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleArchiveActivity(activity)}
                          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800"
                          aria-label="归档活动"
                          title="归档活动"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      {activities.length > 1 && (
                        <button
                          onClick={() => handleDeleteActivity(activity.id, activity.name)}
                          className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-800"
                          aria-label="永久删除活动"
                          title="永久删除活动"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}

        {/* 奖品类型管理页面 */}
        {activeTab === 'prize-types' && currentActivity && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">奖品类型管理</h2>
                <p className="mt-1 text-sm text-slate-500">用权重控制奖品池里不同奖项的相对概率。</p>
              </div>
              <button
                onClick={handleAddPrizeType}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-teal-800"
              >
                <Plus className="w-4 h-4" />
                添加奖品类型
              </button>
            </div>

            {(currentActivity.prizeTypes || []).length === 0 ? (
              <EmptyState
                icon={Palette}
                title="还没有奖品类型"
                description="至少添加一种奖品类型，奖品码才能归属到具体奖项。"
                actionLabel="添加奖品类型"
                onAction={handleAddPrizeType}
              />
            ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(currentActivity.prizeTypes || []).map((prizeType) => {
                const IconComponent = prizeIcons[prizeType.icon as keyof typeof prizeIcons] || Gift
                const typeCodes = currentCodes.filter(code => code.prizeType === prizeType.id)
                const usedCodes = typeCodes.filter(code => code.status === 'won')

                return (
                  <div key={prizeType.id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg`} style={{ backgroundColor: prizeType.color + '20' }}>
                          <IconComponent className="w-6 h-6" style={{ color: prizeType.color }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-950">{prizeType.name}</h3>
                          <p className="text-sm text-slate-500">{prizeType.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">权重：</span>
                        <span className="font-medium">{prizeType.weight}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">奖品总数：</span>
                        <span className="font-medium">{typeCodes.length} 个</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">已发放：</span>
                        <span className="font-medium text-rose-600">{usedCodes.length} 个</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">剩余：</span>
                        <span className="font-medium text-teal-700">{typeCodes.length - usedCodes.length} 个</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPrizeType(prizeType)}
                        className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-stone-100"
                      >
                        编辑类型
                      </button>
                      {(currentActivity.prizeTypes || []).length > 1 && (
                        <button
                          onClick={() => handleDeletePrizeType(prizeType.id, prizeType.name)}
                          className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )}

        {/* 奖品管理页面 */}
        {activeTab === 'codes' && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">奖品码管理</h2>
                <p className="mt-1 text-sm text-slate-500">奖品码未发放前可以编辑；中奖后会自动锁定。</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAddPrize}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-teal-800"
                >
                  <Plus className="w-4 h-4" />
                  添加奖品
                </button>
                <button
                  onClick={() => setShowImport(!showImport)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-100"
                >
                  <Upload className="w-4 h-4" />
                  批量导入
                </button>
              </div>
            </div>

            {/* 批量导入 */}
            {showImport && (
              <div className="mb-6 rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <h3 className="mb-3 font-medium text-slate-950">批量导入奖品码</h3>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="每行一个奖品码&#10;例如：&#10;WINNER001&#10;WINNER002&#10;WINNER003"
                  className="h-32 w-full resize-none rounded-xl border border-stone-300 bg-white p-4 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  disabled={importLoading}
                />

                {/* 导入结果显示 */}
                {importResult && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    importResult.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {importResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        importResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {importResult.message}
                      </span>
                    </div>
                    {importResult.success && importResult.imported !== undefined && (
                      <div className="mt-2 text-sm text-green-700">
                        导入详情：成功 {importResult.imported} 个，跳过 {importResult.skipped || 0} 个，总计 {importResult.total} 个
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleImport}
                    disabled={!importText.trim() || importLoading}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      !importText.trim() || importLoading
                        ? 'cursor-not-allowed bg-stone-300 text-stone-500'
                        : 'bg-teal-700 text-white hover:bg-teal-800'
                    }`}
                  >
                    {importLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        导入 ({importText.split('\n').filter(code => code.trim()).length} 个)
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowImport(false)
                      setImportText('')
                      setImportResult(null)
                    }}
                    disabled={importLoading}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-stone-100 disabled:opacity-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {currentCodes.length === 0 ? (
              <EmptyState
                icon={Gift}
                title="当前活动还没有奖品码"
                description="添加单个奖品或批量导入奖品码后，参与者中奖时会自动发放未使用的奖品码。"
                actionLabel="添加奖品"
                onAction={handleAddPrize}
              />
            ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">奖品信息</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">奖品码</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">中奖时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCodes.map((code) => {
                    const prizeType = currentActivity?.prizeTypes?.find(pt => pt.id === code.prizeType)
                    const IconComponent = prizeType ? prizeIcons[prizeType.icon as keyof typeof prizeIcons] || Gift : Gift

                    return (
                      <tr key={code.id} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {prizeType && (
                              <div className={`p-2 rounded-lg`} style={{ backgroundColor: prizeType.color + '20' }}>
                                <IconComponent className="w-4 h-4" style={{ color: prizeType.color }} />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{code.prizeName}</div>
                              {prizeType && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium`}
                                      style={{ backgroundColor: prizeType.color + '20', color: prizeType.color }}>
                                  {prizeType.name}
                                </span>
                              )}
                              {code.prizeValue && (
                                <div className="text-sm text-green-600 font-medium">{code.prizeValue}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{code.code}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            code.status === 'won'
                              ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-100'
                              : 'bg-teal-50 text-teal-800 ring-1 ring-teal-100'
                          }`}>
                            {code.status === 'won' ? '已中奖' : '未使用'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {code.wonAt ? new Date(code.wonAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {code.status === 'unused' && (
                              <>
                                <button
                                  onClick={() => handleEditPrize(code)}
                                  className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-800"
                                  aria-label="编辑奖品"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePrize(code.id, code.code)}
                                  className="rounded-lg p-1 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-800"
                                  aria-label="删除奖品"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* 中奖记录页面 */}
        {activeTab === 'records' && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">中奖记录</h2>
                <p className="mt-1 text-sm text-slate-500">手机号默认脱敏，必要时可在顶部临时显示。</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportData}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-stone-100"
                >
                  <Download className="w-4 h-4" />
                  导出数据
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                  重置当前活动
                </button>
              </div>
            </div>

            {currentRecords.length === 0 ? (
              <EmptyState
                icon={Users}
                title="还没有抽奖记录"
                description="活动开启并有人参与后，中奖与未中奖记录会出现在这里。"
              />
            ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">手机号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">抽奖时间</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">结果</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">奖品信息</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">奖品码</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record) => {
                    const prizeType = record.prizeType ? currentActivity?.prizeTypes?.find(pt => pt.id === record.prizeType) : null
                    const IconComponent = prizeType ? prizeIcons[prizeType.icon as keyof typeof prizeIcons] || Gift : Gift

                    return (
                      <tr key={record.id} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm">
                          {maskPhone(record.phone)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {new Date(record.drawnAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.won
                              ? 'bg-green-100 text-green-800'
                              : 'bg-stone-100 text-slate-700 ring-1 ring-stone-200'
                          }`}>
                            {record.won ? '中奖' : '未中奖'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {record.won && prizeType ? (
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded`} style={{ backgroundColor: prizeType.color + '20' }}>
                                <IconComponent className="w-3 h-3" style={{ color: prizeType.color }} />
                              </div>
                              <div>
                                <div className="text-sm font-medium">{record.prizeName}</div>
                                <span className={`px-1 py-0.5 rounded text-xs`}
                                      style={{ backgroundColor: prizeType.color + '20', color: prizeType.color }}>
                                  {prizeType.name}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">
                          {record.lotteryCode || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}
      </div>

      {/* 奖品模态框 */}
      <PrizeModal
        isOpen={showPrizeModal}
        onClose={() => setShowPrizeModal(false)}
        onSave={handleSavePrize}
        onUpdate={handleUpdatePrize}
        editingPrize={editingPrize}
        prizeTypes={currentActivity?.prizeTypes || []}
      />

      {/* 奖品类型模态框 */}
      <PrizeTypeModal
        isOpen={showPrizeTypeModal}
        onClose={() => setShowPrizeTypeModal(false)}
        onSave={handleSavePrizeType}
        onUpdate={handleSavePrizeType}
        editingPrizeType={editingPrizeType}
      />

      {/* 活动模态框 */}
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSave={handleSaveActivity}
        editingActivity={editingActivity}
      />

      {confirmDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start gap-3">
              <div className={`rounded-xl p-2 ${
                confirmDialog.tone === 'danger'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-teal-50 text-teal-700'
              }`}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{confirmDialog.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-stone-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`flex-1 rounded-xl px-4 py-3 font-medium text-white transition-colors ${
                  confirmDialog.tone === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
