import React, { useState, useEffect } from 'react'
import { X, Save, Package, Star, Trophy, Gift, Award, Crown, Gem } from 'lucide-react'
import { LotteryCode, PrizeType } from '../types/lottery'

interface PrizeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (code: string, prizeType: string, prizeName: string, prizeValue?: string, prizeDescription?: string) => void
  onUpdate: (id: string, code: string, prizeType: string, prizeName: string, prizeValue?: string, prizeDescription?: string) => void
  editingPrize?: LotteryCode | null
  prizeTypes: PrizeType[]
}

const prizeIcons = {
  'Gift': Gift,
  'Trophy': Trophy,
  'Star': Star,
  'Award': Award,
  'Crown': Crown,
  'Gem': Gem
}

const PrizeModal: React.FC<PrizeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingPrize,
  prizeTypes
}) => {
  const [formData, setFormData] = useState({
    code: '',
    prizeType: '',
    prizeName: '',
    prizeValue: '',
    prizeDescription: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (editingPrize) {
      setFormData({
        code: editingPrize.code,
        prizeType: editingPrize.prizeType,
        prizeName: editingPrize.prizeName,
        prizeValue: editingPrize.prizeValue || '',
        prizeDescription: editingPrize.prizeDescription || ''
      })
    } else {
      setFormData({
        code: '',
        prizeType: prizeTypes[0]?.id || '',
        prizeName: '',
        prizeValue: '',
        prizeDescription: ''
      })
    }
  }, [editingPrize, prizeTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || !formData.prizeType || !formData.prizeName.trim()) return

    setIsLoading(true)

    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    if (editingPrize) {
      onUpdate(
        editingPrize.id,
        formData.code.trim(),
        formData.prizeType,
        formData.prizeName.trim(),
        formData.prizeValue.trim() || undefined,
        formData.prizeDescription.trim() || undefined
      )
    } else {
      onSave(
        formData.code.trim(),
        formData.prizeType,
        formData.prizeName.trim(),
        formData.prizeValue.trim() || undefined,
        formData.prizeDescription.trim() || undefined
      )
    }

    setFormData({
      code: '',
      prizeType: prizeTypes[0]?.id || '',
      prizeName: '',
      prizeValue: '',
      prizeDescription: ''
    })
    setIsLoading(false)
    onClose()
  }

  const handleClose = () => {
    setFormData({
      code: '',
      prizeType: prizeTypes[0]?.id || '',
      prizeName: '',
      prizeValue: '',
      prizeDescription: ''
    })
    onClose()
  }

  const selectedPrizeType = prizeTypes.find(type => type.id === formData.prizeType)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-200 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPrize ? '编辑奖品' : '添加奖品'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 奖品类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              奖品类型 *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {prizeTypes.map((type) => {
                const IconComponent = prizeIcons[type.icon as keyof typeof prizeIcons] || Gift
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, prizeType: type.id }))}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      formData.prizeType === type.id
                        ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg`} style={{ backgroundColor: type.color + '20' }}>
                        <IconComponent className="w-5 h-5" style={{ color: type.color }} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                        <div className="text-xs text-gray-500">权重: {type.weight}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                奖品码 *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="请输入奖品码，如：WINNER001"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                奖品名称 *
              </label>
              <input
                type="text"
                value={formData.prizeName}
                onChange={(e) => setFormData(prev => ({ ...prev, prizeName: e.target.value }))}
                placeholder="请输入奖品名称"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              奖品价值
            </label>
            <input
              type="text"
              value={formData.prizeValue}
              onChange={(e) => setFormData(prev => ({ ...prev, prizeValue: e.target.value }))}
              placeholder="如：￥100、价值500元等"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              奖品描述
            </label>
            <textarea
              value={formData.prizeDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, prizeDescription: e.target.value }))}
              placeholder="请输入奖品详细描述"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* 预览 */}
          {selectedPrizeType && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-3">奖品预览</h3>
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg`} style={{ backgroundColor: selectedPrizeType.color + '20' }}>
                    {React.createElement(prizeIcons[selectedPrizeType.icon as keyof typeof prizeIcons] || Gift, {
                      className: "w-6 h-6",
                      style: { color: selectedPrizeType.color }
                    })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{formData.prizeName || '奖品名称'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`}
                            style={{ backgroundColor: selectedPrizeType.color + '20', color: selectedPrizeType.color }}>
                        {selectedPrizeType.name}
                      </span>
                    </div>
                    {formData.prizeValue && (
                      <div className="text-sm text-green-600 font-medium">{formData.prizeValue}</div>
                    )}
                    {formData.prizeDescription && (
                      <div className="text-sm text-gray-600 mt-1">{formData.prizeDescription}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">兑奖码：{formData.code || 'XXXXXX'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.code.trim() || !formData.prizeType || !formData.prizeName.trim()}
              className={`flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                isLoading || !formData.code.trim() || !formData.prizeType || !formData.prizeName.trim()
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700 hover:shadow-lg'
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
                  {editingPrize ? '更新奖品' : '添加奖品'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PrizeModal