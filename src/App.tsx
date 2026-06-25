import React, { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import LotteryDraw from './components/LotteryDraw'
import AdminPanel from './components/AdminPanel'
import AdminLogin from './components/AdminLogin'
import WinnerQuery from './components/WinnerQuery'
import SiteAffordances from './components/SiteAffordances'
import PasswordReset from './components/PasswordReset'
import { adminLogout, getAdminSession } from './lib/api'

const getInitialRouteState = () => {
  const pathname = window.location.pathname
  const urlParams = new URLSearchParams(window.location.search)

  return {
    showAdmin: pathname === '/admin',
    showWinnerQuery: pathname === '/query',
    showPasswordReset: pathname === '/reset-admin',
    resetToken: pathname === '/reset-admin' ? urlParams.get('token') || '' : '',
    urlActivityId: pathname === '/' ? urlParams.get('activity') : null
  }
}

function App() {
  const initialRoute = getInitialRouteState()
  const [showAdmin, setShowAdmin] = useState(initialRoute.showAdmin)
  const [showWinnerQuery, setShowWinnerQuery] = useState(initialRoute.showWinnerQuery)
  const [showPasswordReset, setShowPasswordReset] = useState(initialRoute.showPasswordReset)
  const [resetToken, setResetToken] = useState(initialRoute.resetToken)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [urlActivityId, setUrlActivityId] = useState<string | null>(initialRoute.urlActivityId)

  // 检查URL参数和路由
  useEffect(() => {
    const checkUrlParams = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const pathname = window.location.pathname
        const activityId = urlParams.get('activity')
        const token = urlParams.get('token') || ''

        // 检查是否是管理员密码重置路由
        if (pathname === '/reset-admin') {
          setShowPasswordReset(true)
          setResetToken(token)
          setShowAdmin(false)
          setShowWinnerQuery(false)
          setUrlActivityId(null)
          return
        }

        // 检查是否是管理后台路由
        if (pathname === '/admin') {
          setShowPasswordReset(false)
          setResetToken('')
          setShowAdmin(true)
          setShowWinnerQuery(false)
          setUrlActivityId(null)
          return
        }

        // 检查是否是中奖查询路由
        if (pathname === '/query') {
          setShowPasswordReset(false)
          setResetToken('')
          setShowWinnerQuery(true)
          setShowAdmin(false)
          setUrlActivityId(null)
          return
        }

        // 检查活动直达链接
        if (activityId) {
          setShowPasswordReset(false)
          setResetToken('')
          setUrlActivityId(activityId)
          setShowAdmin(false)
          setShowWinnerQuery(false)
          return
        }

        // 默认状态
        setShowPasswordReset(false)
        setResetToken('')
        setShowAdmin(false)
        setShowWinnerQuery(false)
        setUrlActivityId(null)
      } catch (error) {
        console.error('Error parsing URL:', error)
        // 如果URL解析失败，回到默认状态
        setShowPasswordReset(false)
        setResetToken('')
        setShowAdmin(false)
        setShowWinnerQuery(false)
        setUrlActivityId(null)
      }
    }

    checkUrlParams()

    // 监听URL变化
    const handlePopState = () => {
      checkUrlParams()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 检查管理员登录状态
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const session = await getAdminSession()
        setIsAdminLoggedIn(session.authenticated)
      } catch {
        setIsAdminLoggedIn(false)
      }
    }

    checkAdminSession()
  }, [])

  // 更新URL的函数
  const updateUrl = (path: string, params?: URLSearchParams) => {
    try {
      const url = params ? `${path}?${params.toString()}` : path
      window.history.pushState({}, '', url)
    } catch (error) {
      console.error('Error updating URL:', error)
    }
  }

  const handleAdminToggle = () => {
    if (showAdmin && isAdminLoggedIn) {
      // 如果当前在管理后台且已登录，返回首页
      updateUrl('/')
      setShowAdmin(false)
      setShowPasswordReset(false)
    } else if (!showAdmin) {
      // 如果当前在抽奖页面，跳转到管理后台
      updateUrl('/admin')
      setShowAdmin(true)
      setShowWinnerQuery(false)
      setShowPasswordReset(false)
    }
  }

  const handleWinnerQueryToggle = () => {
    if (showWinnerQuery) {
      // 返回首页
      updateUrl('/')
      setShowWinnerQuery(false)
      setShowPasswordReset(false)
    } else {
      // 跳转到中奖查询页面
      updateUrl('/query')
      setShowWinnerQuery(true)
      setShowAdmin(false)
      setShowPasswordReset(false)
    }
  }

  const handleAdminLogin = () => {
    setIsAdminLoggedIn(true)
  }

  const handleAdminLogout = async () => {
    try {
      await adminLogout()
    } catch (error) {
      console.error('Admin logout failed:', error)
    }
    setIsAdminLoggedIn(false)
    // 返回首页
    updateUrl('/')
    setShowAdmin(false)
    setShowPasswordReset(false)
  }

  const handleBackToLottery = () => {
    updateUrl('/')
    setShowAdmin(false)
    setShowPasswordReset(false)
  }

  const handleBackFromQuery = () => {
    updateUrl('/')
    setShowWinnerQuery(false)
    setShowPasswordReset(false)
  }

  const handleCloseAdminLogin = () => {
    updateUrl('/')
    setShowAdmin(false)
    setShowPasswordReset(false)
  }

  const handlePasswordResetBack = () => {
    updateUrl('/')
    setShowPasswordReset(false)
    setResetToken('')
  }

  const handlePasswordResetSuccess = () => {
    updateUrl('/admin')
    setShowPasswordReset(false)
    setResetToken('')
    setShowAdmin(true)
    setShowWinnerQuery(false)
    setIsAdminLoggedIn(false)
  }

  const renderContent = () => {
    try {
      if (showPasswordReset) {
        return (
          <PasswordReset
            token={resetToken}
            onBack={handlePasswordResetBack}
            onSuccess={handlePasswordResetSuccess}
          />
        )
      }

      if (showWinnerQuery) {
        return <WinnerQuery onBack={handleBackFromQuery} />
      }

      if (!showAdmin) {
        return <LotteryDraw urlActivityId={urlActivityId} />
      }

      if (!isAdminLoggedIn) {
        return <AdminLogin onLogin={handleAdminLogin} onClose={handleCloseAdminLogin} />
      }

      return <AdminPanel onLogout={handleAdminLogout} onBackToLottery={handleBackToLottery} />
    } catch (error) {
      console.error('Error rendering content:', error)
      // 如果渲染失败，显示错误页面
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f7f4ed] p-4">
          <div className="max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-950/10">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-600" />
            <h1 className="mb-4 text-2xl font-bold text-slate-950">页面加载失败</h1>
            <p className="mb-4 text-slate-600">抱歉，页面遇到了一些问题</p>
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
  }

  // 控制按钮显示逻辑
  const showSettingsMenu = !showPasswordReset && (!showAdmin || isAdminLoggedIn)
  const showAdminButton = !urlActivityId // 只有在非直达链接时才显示管理后台按钮
  const showQueryButton = !showAdmin // 在抽奖页面时显示中奖查询按钮

  return (
    <div className="relative min-h-screen">
      {renderContent()}

      {showSettingsMenu && (
        <SiteAffordances
          onAdmin={handleAdminToggle}
          onQuery={handleWinnerQueryToggle}
          showAdminEntry={showAdminButton}
          showQueryEntry={showQueryButton}
          adminLabel={showAdmin ? '返回抽奖' : '管理后台'}
          queryLabel={showWinnerQuery ? '返回抽奖' : '中奖查询'}
        />
      )}
    </div>
  )
}

export default App
