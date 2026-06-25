import React, { useState, useEffect } from 'react'
import { X, Save, Palette, Star, Trophy, Gift, Award, Crown, Gem } from 'lucide-react'
import { PrizeType } from '../types/lottery'

interface PrizeTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (prizeType: Omit<PrizeType, 'id'>) => void
  onUpdate: (id: string, prizeType: Omit<PrizeType, 'id'>) => void
  editingPrizeType?: PrizeType | null
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight: 10,
    color: '#ef4444',
    icon: 'Crown'
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (editingPrizeType) {
      setFormData({
        name: editingPrizeType.name,
        description: editingPrizeType.description,
        weight: editingPrizeType.weight,
        color: editingPrizeType.color,
        icon: editingPrizeType.icon
      })
    } else {
      setFormData({
        name: '',
        description: '',
        weight: 10,
        color: '#ef4444',
        icon: 'Crown'
      })
    }
  }, [editingPrizeType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)

    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    if (editingPrizeType) {
      onUpdate(editingPrizeType.id, formData)
    } else {
      onSave(formData)
    }

    setIsLoading(false)
    onClose()
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      weight: 10,
      color: '#ef4444',
      icon: 'Crown'
    })
    onClose()
  }

  const selectedIcon = iconOptions.find(option => option.value === formData.icon)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col transform transition-all duration-200 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Palette className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPrizeType ? '编辑奖品类型' : '创建奖品类型'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  类型名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：一等奖、二等奖"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  权重 ({formData.weight})
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>低概率</span>
                  <span>高概率</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="奖品类型描述"
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                颜色主题
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: option.value }))}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-purple-500 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-6 rounded-lg mb-2 ${option.preview}`}></div>
                    <div className="text-xs text-gray-600">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                图标
              </label>
              <div className="grid grid-cols-3 gap-3">
                {iconOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: option.value }))}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      formData.icon === option.value
                        ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <option.icon className="w-6 h-6 mx-auto mb-1" style={{ color: formData.color }} />
                    <div className="text-xs text-gray-600">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 预览 */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-3">预览效果</h3>
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg`} style={{ backgroundColor: formData.color + '20' }}>
                    {selectedIcon && React.createElement(selectedIcon.icon, {
                      className: "w-6 h-6",
                      style: { color: formData.color }
                    })}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{formData.name || '奖品类型名称'}</div>
                    <div className="text-sm text-gray-600">{formData.description || '奖品类型描述'}</div>
                    <div className="text-xs text-gray-500">权重: {formData.weight}</div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
            className={`flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
              isLoading || !formData.name.trim()
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-purple-700 hover:shadow-lg'
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
                {editingPrizeType ? '更新类型' : '创建类型'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrizeTypeModal