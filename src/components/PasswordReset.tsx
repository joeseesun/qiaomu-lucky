import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { resetAdminPassword } from '../lib/api'

interface PasswordResetProps {
  token: string
  onBack: () => void
  onSuccess: () => void
}

const PasswordReset: React.FC<PasswordResetProps> = ({ token, onBack, onSuccess }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [succeeded, setSucceeded] = useState(false)

  const validationMessage = useMemo(() => {
    if (!token) return '重置链接缺少有效 token'
    if (password && password.length < 10) return '新密码至少 10 个字符'
    if (confirmPassword && password !== confirmPassword) return '两次输入的密码不一致'
    return ''
  }, [confirmPassword, password, token])

  const canSubmit = Boolean(token) &&
    password.length >= 10 &&
    password === confirmPassword &&
    !isSubmitting

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    setError('')

    try {
      await resetAdminPassword(token, password)
      setSucceeded(true)
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '密码重置失败，请重新生成链接')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f4ed] p-4 text-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-950/10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-700 text-white">
            {succeeded ? <CheckCircle2 className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {succeeded ? '管理员密码已重置' : '重置管理员密码'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {succeeded ? '旧登录态已失效，请使用新密码重新进入后台。' : '这个链接只能使用一次，提交后会自动轮换登录密钥。'}
          </p>
        </div>

        {succeeded ? (
          <button
            type="button"
            onClick={onSuccess}
            className="flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
          >
            去登录管理后台
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                新管理员密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 py-3 pl-12 pr-12 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  placeholder="至少 10 个字符"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 rounded-lg p-2 -translate-y-1/2 text-slate-500 transition-colors hover:bg-stone-200 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                再输入一次
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                placeholder="确认新密码"
                autoComplete="new-password"
              />
            </div>

            {(validationMessage || error) && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
                <span>{error || validationMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
            >
              {isSubmitting ? '正在重置...' : '确认重置密码'}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
            >
              返回抽奖页
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default PasswordReset
