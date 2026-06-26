import { useCallback, useEffect, useState } from 'react'
import { apiRequest, ApiError } from '../lib/api'
import { DrawRecord, LotteryActivity, LotteryCode, PrizeType } from '../types/lottery'

type ConnectionStatus = 'connecting' | 'connected' | 'error'

interface LotteryApiState {
  activities: LotteryActivity[]
  codes: LotteryCode[]
  records: DrawRecord[]
  schemaVersion?: number
}

interface ImportCodesResponse {
  state: LotteryApiState
  importResult: {
    success: boolean
    imported: number
    skipped: number
    total: number
  }
}

const CURRENT_ACTIVITY_KEY = 'lucky_current_activity'

const emptyState: LotteryApiState = {
  activities: [],
  codes: [],
  records: []
}

const getInitialActivityId = () => {
  try {
    return localStorage.getItem(CURRENT_ACTIVITY_KEY)
  } catch {
    return null
  }
}

export const useLotteryApi = () => {
  const [activities, setActivities] = useState<LotteryActivity[]>([])
  const [currentActivityId, setCurrentActivityIdState] = useState<string | null>(getInitialActivityId)
  const [codes, setCodes] = useState<LotteryCode[]>([])
  const [records, setRecords] = useState<DrawRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [adminMode, setAdminMode] = useState(false)

  const applyState = useCallback((state: LotteryApiState, isAdmin = adminMode) => {
    const nextActivities = state.activities || []
    setActivities(nextActivities)
    setCodes(isAdmin ? state.codes || [] : [])
    setRecords(isAdmin ? state.records || [] : [])
    setAdminMode(isAdmin)

    setCurrentActivityIdState((previous) => {
      if (previous && nextActivities.some((activity) => activity.id === previous)) {
        return previous
      }

      const nextId = nextActivities.find((activity) => activity.isArchived !== true)?.id || nextActivities[0]?.id || null
      try {
        if (nextId) {
          localStorage.setItem(CURRENT_ACTIVITY_KEY, nextId)
        } else {
          localStorage.removeItem(CURRENT_ACTIVITY_KEY)
        }
      } catch {
        // localStorage can be unavailable in hardened browsers.
      }
      return nextId
    })
  }, [adminMode])

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError(null)
      setConnectionStatus('connecting')

      const shouldLoadAdminState = window.location.pathname === '/admin'

      try {
        if (!shouldLoadAdminState) {
          throw new ApiError('Public route', 401)
        }

        const state = await apiRequest<LotteryApiState>('/api/admin/state')
        applyState(state, true)
      } catch (adminError) {
        if (shouldLoadAdminState || !(adminError instanceof ApiError) || adminError.status !== 401) {
          throw adminError
        }

        const publicState = await apiRequest<{ activities: LotteryActivity[] }>('/api/public/activities')
        applyState({ ...emptyState, activities: publicState.activities }, false)
      }

      setConnectionStatus('connected')
    } catch (err) {
      console.error('加载抽奖数据失败:', err)
      setConnectionStatus('error')
      setError(err instanceof Error ? err.message : '加载抽奖数据失败')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [applyState])

  useEffect(() => {
    loadData(true)
  }, [loadData])

  const setCurrentActivity = useCallback((id: string) => {
    setCurrentActivityIdState(id)
    try {
      localStorage.setItem(CURRENT_ACTIVITY_KEY, id)
    } catch {
      // Ignore localStorage failures.
    }
  }, [])

  const getCurrentActivity = useCallback(() => {
    return activities.find((activity) => activity.id === currentActivityId) || activities[0]
  }, [activities, currentActivityId])

  const hasDrawn = useCallback(async (phone: string, activityId?: string) => {
    const targetActivityId = activityId || currentActivityId
    if (!targetActivityId) return false

    try {
      const result = await apiRequest<{ drawn: boolean }>(
        `/api/public/has-drawn?phone=${encodeURIComponent(phone)}&activityId=${encodeURIComponent(targetActivityId)}`
      )
      return result.drawn
    } catch {
      return false
    }
  }, [currentActivityId])

  const getAvailableCodes = useCallback((activityId?: string) => {
    const targetActivityId = activityId || currentActivityId

    if (adminMode) {
      return codes.filter((code) => code.lotteryId === targetActivityId && code.status === 'unused')
    }

    const activity = activities.find((item) => item.id === targetActivityId)
    const count = activity?.availableCount || 0
    return Array.from({ length: count }, (_, index) => ({
      id: `public-${targetActivityId}-${index}`,
      code: '',
      status: 'unused' as const,
      createdAt: '',
      lotteryId: targetActivityId || '',
      prizeType: '',
      prizeName: '',
      weight: 1
    }))
  }, [activities, adminMode, codes, currentActivityId])

  const drawLottery = useCallback(async (phone: string, activityId?: string) => {
    const targetActivityId = activityId || currentActivityId
    if (!targetActivityId) {
      return { success: false, message: '请先选择抽奖活动', won: false }
    }

    try {
      const result = await apiRequest<{
        success: boolean
        won: boolean
        message: string
        lotteryCode?: string
        prizeType?: string
        prizeName?: string
      }>('/api/public/draw', {
        method: 'POST',
        body: JSON.stringify({ phone, activityId: targetActivityId })
      })

      await loadData(false)
      return result
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : '抽奖过程中发生错误，请重试',
        won: false
      }
    }
  }, [currentActivityId, loadData])

  const createActivity = useCallback(async (activity: Omit<LotteryActivity, 'id' | 'createdAt'>) => {
    const state = await apiRequest<LotteryApiState>('/api/admin/activity', {
      method: 'POST',
      body: JSON.stringify(activity)
    })
    applyState(state, true)
    return state.activities[0]?.id
  }, [applyState])

  const updateActivity = useCallback(async (id: string, updates: Partial<LotteryActivity>) => {
    const state = await apiRequest<LotteryApiState>(`/api/admin/activity/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    applyState(state, true)
  }, [applyState])

  const deleteActivity = useCallback(async (id: string) => {
    const state = await apiRequest<LotteryApiState>(`/api/admin/activity/${id}`, {
      method: 'DELETE'
    })
    applyState(state, true)
  }, [applyState])

  const createPrizeType = useCallback(async (prizeType: Omit<PrizeType, 'id'>, activityId?: string) => {
    const targetActivityId = activityId || currentActivityId
    if (!targetActivityId) return undefined

    const state = await apiRequest<LotteryApiState>(`/api/admin/activity/${targetActivityId}/prize-type`, {
      method: 'POST',
      body: JSON.stringify(prizeType)
    })
    applyState(state, true)
    const activity = state.activities.find((item) => item.id === targetActivityId)
    return activity?.prizeTypes[activity.prizeTypes.length - 1]?.id
  }, [applyState, currentActivityId])

  const updatePrizeType = useCallback(async (id: string, updates: Omit<PrizeType, 'id'>) => {
    const state = await apiRequest<LotteryApiState>(`/api/admin/prize-type/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    applyState(state, true)
  }, [applyState])

  const deletePrizeType = useCallback(async (id: string) => {
    const state = await apiRequest<LotteryApiState>(`/api/admin/prize-type/${id}`, {
      method: 'DELETE'
    })
    applyState(state, true)
  }, [applyState])

  const addCode = useCallback(async (
    code: string,
    prizeType: string,
    prizeName: string,
    prizeValue?: string,
    prizeDescription?: string,
    activityId?: string
  ) => {
    const targetActivityId = activityId || currentActivityId
    if (!targetActivityId) return

    const state = await apiRequest<LotteryApiState>('/api/admin/code', {
      method: 'POST',
      body: JSON.stringify({
        activityId: targetActivityId,
        code,
        prizeType,
        prizeName,
        prizeValue,
        prizeDescription
      })
    })
    applyState(state, true)
  }, [applyState, currentActivityId])

  const updateCode = useCallback(async (
    id: string,
    code: string,
    prizeType: string,
    prizeName: string,
    prizeValue?: string,
    prizeDescription?: string
  ) => {
    const state = await apiRequest<LotteryApiState>(`/api/admin/code/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        code,
        prizeType,
        prizeName,
        prizeValue,
        prizeDescription
      })
    })
    applyState(state, true)
  }, [applyState])

  const removeCode = useCallback(async (id: string) => {
    const state = await apiRequest<LotteryApiState>(`/api/admin/code/${id}`, {
      method: 'DELETE'
    })
    applyState(state, true)
  }, [applyState])

  const importCodes = useCallback(async (codeList: string[], activityId?: string) => {
    const targetActivityId = activityId || currentActivityId
    if (!targetActivityId) {
      throw new Error('请先选择抽奖活动')
    }

    const result = await apiRequest<ImportCodesResponse>(`/api/admin/activity/${targetActivityId}/import-codes`, {
      method: 'POST',
      body: JSON.stringify({ codes: codeList })
    })
    applyState(result.state, true)
    return result.importResult
  }, [applyState, currentActivityId])

  const resetLottery = useCallback(async (activityId?: string) => {
    const targetActivityId = activityId || currentActivityId
    if (!targetActivityId) return

    const state = await apiRequest<LotteryApiState>(`/api/admin/activity/${targetActivityId}/reset`, {
      method: 'POST',
      body: JSON.stringify({})
    })
    applyState(state, true)
  }, [applyState, currentActivityId])

  return {
    activities,
    codes,
    records,
    currentActivityId,
    loading,
    error,
    connectionStatus,
    getCurrentActivity,
    hasDrawn,
    getAvailableCodes,
    drawLottery,
    createActivity,
    updateActivity,
    deleteActivity,
    setCurrentActivity,
    createPrizeType,
    updatePrizeType,
    deletePrizeType,
    addCode,
    updateCode,
    removeCode,
    importCodes,
    resetLottery,
    refetch: () => loadData(true)
  }
}
