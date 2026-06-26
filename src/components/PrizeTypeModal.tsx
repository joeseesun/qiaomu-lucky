import React, { useEffect, useRef, useState } from 'react'
import { X, Save, Palette, Star, Trophy, Gift, Award, Crown, Gem, AlertCircle } from 'lucide-react'
import { PrizeType } from '../types/lottery'

type PrizeTypeFormData = Omit<PrizeType, 'id'>

interface PrizeTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (prizeType: PrizeTypeFormData) => Promise<void> | void
  onUpdate: (id: string, prizeType: PrizeTypeFormData) => Promise<void> | void
  editingPrizeType?: PrizeType | null
}

const initialFormData: PrizeTypeFormData = {
  name: '',
  description: '',
  weight: 10,
  color: '#ef4444',
  icon: 'Crown'
}

const colorOptions = [
  { value: '#ef4444', label: '红色', preview: 'bg-red-500' },
  { value: '#f97316', label: '橙色', preview: 'bg-orange-500' },
  { value: '#eab308', label: '黄色', preview: 'bg-yellow-500' },
  { value: '#22c55e', label: '绿色', preview: 'bg-green-500' },
  { value: '#3b82f6', label: '蓝色', preview: 'bg-blue-500' },
  { value: '#8b5cf6', label: '紫色', preview: 'bg-purple-500' },
  { value: '#ec4899', label: '粉色', preview: 'bg-pink-500' },
  { value: '#6b7280', label: '灰色', preview: 'bg-gray-500' }
]

const iconOptions = [
  { value: 'Crown', label: '皇冠', icon: Crown },
  { value: 'Trophy', label: '奖杯', icon: Trophy },
  { value: 'Award', label: '奖章', icon: Award },
  { value: 'Star', label: '星星', icon: Star },
  { value: 'Gem', label: '宝石', icon: Gem },
  { value: 'Gift', label: '礼品', icon: Gift }
]

const PrizeTypeModal: React.FC<PrizeTypeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingPrizeType
}) => {
  const [formData, setFormData] = useState<PrizeTypeFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    setFormData(editingPrizeType
      ? {
          name: editingPrizeType.name,
          description: editingPrizeType.description,
          weight: editingPrizeType.weight,
          color: editingPrizeType.color,
          icon: editingPrizeType.icon
        }
      : initialFormData
    )
    setError('')

    window.setTimeout(() => nameInputRef.current?.focus(), 0)
  }, [editingPrizeType, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, isOpen, onClose])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isLoading) return

    const payload: PrizeTypeFormData = {
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
      weight: Number(formData.weight)
    }

    if (!payload.name) {
      setError('请填写奖品类型名称')
      return
    }

    if (!Number.isFinite(payload.weight) || payload.weight < 1) {
      setError('权重必须大于 0')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      if (editingPrizeType) {
        await onUpdate(editingPrizeType.id, payload)
      } else {
        await onSave(payload)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '奖品类型保存失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (isLoading) return
    setFormData(initialFormData)
    setError('')
    onClose()
  }

  const selectedIcon = iconOptions.find(option => option.value === formData.icon)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="grid max-h-[calc(100dvh-2rem)] w-full max-w-2xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prize-type-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
              <Palette className="h-5 w-5" />
            </div>
            <h2 id="prize-type-modal-title" className="text-xl font-semibold text-slate-950">
              {editingPrizeType ? '编辑奖品类型' : '创建奖品类型'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
          <div className="min-h-0 space-y-6 overflow-y-auto p-6">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  类型名称 *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="如：一等奖、二等奖"
                  className="w-full rounded-xl border border-stone-300 bg-stone-50 p-3 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  权重 ({formData.weight})
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.weight}
                  onChange={(event) => setFormData(prev => ({ ...prev, weight: Number(event.target.value) }))}
                  className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-200"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>低概率</span>
                  <span>高概率</span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(event) => setFormData(prev => ({ ...prev, description: event.target.value }))}
                placeholder="奖品类型描述"
                className="w-full rounded-xl border border-stone-300 bg-stone-50 p-3 text-slate-950 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                颜色主题
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      formData.color === option.value
                        ? 'border-teal-700 ring-2 ring-teal-700/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className={`mb-2 h-6 w-full rounded-lg ${option.preview}`}></div>
                    <div className="text-xs text-slate-600">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                图标
              </label>
              <div className="grid grid-cols-3 gap-3">
                {iconOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                      formData.icon === option.value
                        ? 'border-teal-700 bg-teal-50 ring-2 ring-teal-700/20'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <option.icon className="mx-auto mb-1 h-6 w-6" style={{ color: formData.color }} />
                    <div className="text-xs text-slate-600">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-stone-50 p-4">
              <h3 className="mb-3 font-medium text-slate-950">预览效果</h3>
              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: formData.color + '20' }}>
                    {selectedIcon && React.createElement(selectedIcon.icon, {
                      className: 'h-6 w-6',
                      style: { color: formData.color }
                    })}
                  </div>
                  <div>
                    <div className="font-medium text-slate-950">{formData.name || '奖品类型名称'}</div>
                    <div className="text-sm text-slate-600">{formData.description || '奖品类型描述'}</div>
                    <div className="text-xs text-slate-500">权重: {formData.weight}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-stone-200 p-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 font-medium text-slate-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium text-white transition-colors ${
                isLoading || !formData.name.trim()
                  ? 'cursor-not-allowed bg-stone-300 text-stone-600'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editingPrizeType ? '更新类型' : '创建类型'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PrizeTypeModal
