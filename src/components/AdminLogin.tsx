import React, { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, X } from 'lucide-react'
import { adminLogin, getAdminSession } from '../lib/api'

interface AdminLoginProps {
  onLogin: () => void
  onClose?: () => void
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose }) => {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 检查是否有有效的登录会话
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const session = await getAdminSession()
        if (session.authenticated) onLogin()
      } catch {
        // 未登录时保持登录表单即可。
      }
    }

    checkExistingSession()
  }, [onLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await adminLogin(password)
      const session = await getAdminSession()
      if (!session.authenticated) {
        throw new Error('登录状态确认失败，请重试')
      }
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码错误，请重新输入')
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f4ed] p-4">
      <div className="w-full max-w-md">
        <div className="relative rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-950/10">
          {/* 关闭按钮 */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
              aria-label="返回抽奖"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-slate-950">管理后台登录</h1>
            <p className="text-slate-600">请输入管理员密码</p>
            <p className="mt-2 text-xs text-slate-500">登录状态由服务器安全保存 7 天</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                管理员密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入管理员密码"
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 py-4 pl-12 pr-12 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition-colors hover:bg-stone-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className={`flex w-full items-center justify-center gap-3 rounded-xl bg-teal-700 py-4 text-lg font-bold text-white shadow-lg shadow-teal-950/20 transition ${
                isLoading || !password
                  ? 'cursor-not-allowed bg-stone-300 text-stone-600 shadow-none'
                  : 'hover:bg-teal-800 hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  验证中...
                </>
              ) : (
                '登录管理后台'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              安全提示：请妥善保管管理员密码
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
