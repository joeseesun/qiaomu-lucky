import React, { useState } from 'react'
import {
  Award,
  Calendar,
  Check,
  Copy,
  Crown,
  Gem,
  Gift,
  Heart,
  Phone,
  ArrowLeft,
  Loader2,
  Search,
  Star,
  Trophy
} from 'lucide-react'
import { apiRequest } from '../lib/api'

interface WinnerQueryProps {
  onBack: () => void
}

interface WinnerRecord {
  id: string
  drawn_at: string
  lottery_code?: string
  prize_name?: string
  lottery_activities?: {
    name?: string
    icon?: string
  } | null
  prize_types?: {
    name?: string
    color?: string
    icon?: string
  } | null
}

const WinnerQuery: React.FC<WinnerQueryProps> = ({ onBack }) => {
  const [phone, setPhone] = useState('')
  const [records, setRecords] = useState<WinnerRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const validatePhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 11) {
      setPhone(value)
    }
  }

  const searchRecords = async () => {
    if (!validatePhone(phone)) {
      return
    }

    setLoading(true)
    try {
      const data = await apiRequest<{ records: WinnerRecord[] }>(
        `/api/public/winners?phone=${encodeURIComponent(phone)}`
      )
      setRecords(data.records || [])
      setSearched(true)
    } catch (err) {
      console.error('查询中奖记录失败:', err)
      setRecords([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const getIconComponent = (iconName: string) => {
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

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f7f4ed] p-4 text-slate-950">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="fixed left-4 top-4 z-50 rounded-full border border-stone-200 bg-white p-3 text-slate-700 shadow-lg shadow-stone-950/10 transition hover:bg-stone-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
        aria-label="返回抽奖"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-950/20">
            <Search className="h-8 w-8" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-950">
            中奖记录查询
          </h1>
          <p className="text-lg text-slate-600">输入手机号查看您的中奖记录</p>
        </div>

        <div className="relative mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-950/10">
          <div className="mb-6">
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
              />
            </div>
          </div>

          <button
            onClick={searchRecords}
            disabled={loading || !validatePhone(phone)}
            className={`flex w-full items-center justify-center gap-3 rounded-xl bg-teal-700 py-4 text-xl font-bold text-white shadow-lg shadow-teal-950/20 transition ${
              loading || !validatePhone(phone)
                ? 'cursor-not-allowed bg-stone-300 text-stone-600 shadow-none'
                : 'hover:bg-teal-800 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                查询中...
              </>
            ) : (
              <>
                <Search className="w-6 h-6" />
                查询中奖记录
              </>
            )}
          </button>
        </div>

        {/* 查询结果 */}
        {searched && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-950/10">
            {records.length === 0 ? (
              <div className="text-center py-8">
                <Search className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                <h3 className="mb-2 text-xl font-semibold text-slate-950">暂无中奖记录</h3>
                <p className="text-slate-600">该手机号暂未中奖，继续努力吧！</p>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <Gift className="h-6 w-6 text-teal-700" />
                  <h3 className="text-xl font-semibold text-slate-950">
                    恭喜您！共中奖 {records.length} 次
                  </h3>
                </div>

                <div className="space-y-4">
                  {records.map((record) => {
                    const ActivityIcon = getIconComponent(record.lottery_activities?.icon || 'Gift')
                    const PrizeIcon = getIconComponent(record.prize_types?.icon || 'Gift')

                    return (
                      <div key={record.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <ActivityIcon className="h-6 w-6 text-teal-700" />
                            <div>
                              <h4 className="font-semibold text-slate-950">{record.lottery_activities?.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Calendar className="w-4 h-4" />
                                {new Date(record.drawn_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 奖品信息 */}
                        <div className="mb-4 rounded-xl border border-stone-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-3">
                            <PrizeIcon className="h-5 w-5 text-teal-700" />
                            <div>
                              <div className="text-lg font-bold text-slate-950">{record.prize_name}</div>
                              {record.prize_types && (
                                <span
                                  className="rounded-full px-2 py-1 text-xs font-medium"
                                  style={{
                                    backgroundColor: record.prize_types.color + '20',
                                    color: record.prize_types.color
                                  }}
                                >
                                  {record.prize_types.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 兑奖码 */}
                        {record.lottery_code && (
                          <div className="rounded-xl border border-stone-200 bg-white p-4">
                            <div className="mb-2 text-sm text-slate-600">兑奖码</div>
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1 rounded-lg bg-stone-100 px-3 py-2 font-mono text-lg font-bold tracking-wider text-teal-800">
                                {record.lottery_code}
                              </div>
                              <button
                                onClick={() => copyToClipboard(record.lottery_code, record.id)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                                  copied === record.id
                                    ? 'border border-teal-200 bg-teal-50 text-teal-800'
                                    : 'border border-stone-300 bg-white text-slate-700 hover:bg-stone-100'
                                }`}
                              >
                                {copied === record.id ? (
                                  <>
                                    <Check className="w-4 h-4" />
                                    已复制
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4" />
                                    复制
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            提示：请妥善保管您的兑奖码，凭码领取奖品
          </p>
        </div>
      </div>
    </div>
  )
}

export default WinnerQuery
