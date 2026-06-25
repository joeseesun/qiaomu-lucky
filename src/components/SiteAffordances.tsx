import React, { useEffect, useState } from 'react'
import { ExternalLink, Gift, Github, Lock, QrCode, Search, Settings, X } from 'lucide-react'

type ModalType = 'reward' | 'follow' | null

interface SiteAffordancesProps {
  onAdmin: () => void
  onQuery: () => void
  showAdminEntry: boolean
  showQueryEntry: boolean
  adminLabel: string
  queryLabel: string
}

const SiteAffordances: React.FC<SiteAffordancesProps> = ({
  onAdmin,
  onQuery,
  showAdminEntry,
  showQueryEntry,
  adminLabel,
  queryLabel
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  useEffect(() => {
    if (!menuOpen && !activeModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setActiveModal(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModal, menuOpen])

  const modalTitle = activeModal === 'reward' ? '打赏支持' : '关注向阳乔木'

  const runMenuAction = (action: () => void) => {
    setMenuOpen(false)
    action()
  }

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setMenuOpen(false)}
          aria-label="关闭设置菜单"
        />
      )}

      <div className="fixed right-4 top-4 z-50">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-slate-700 shadow-lg shadow-stone-950/10 transition hover:bg-stone-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
          aria-label="设置"
          aria-expanded={menuOpen}
        >
          <Settings className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl shadow-stone-950/15">
            <div className="px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Qiaomu Lucky</p>
              <p className="mt-1 text-sm text-slate-600">抽奖工具设置</p>
            </div>

            <div className="my-1 h-px bg-stone-200" />

            {showQueryEntry && (
              <button
                type="button"
                onClick={() => runMenuAction(onQuery)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-stone-100 hover:text-slate-950"
              >
                <Search className="h-4 w-4 text-teal-700" />
                {queryLabel}
              </button>
            )}

            {showAdminEntry && (
              <button
                type="button"
                onClick={() => runMenuAction(onAdmin)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-stone-100 hover:text-slate-950"
              >
                <Lock className="h-4 w-4 text-teal-700" />
                {adminLabel}
              </button>
            )}

            {(showQueryEntry || showAdminEntry) && <div className="my-1 h-px bg-stone-200" />}

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setActiveModal('reward')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-stone-100 hover:text-slate-950"
            >
              <Gift className="h-4 w-4 text-teal-700" />
              打赏支持
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                setActiveModal('follow')
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-stone-100 hover:text-slate-950"
            >
              <QrCode className="h-4 w-4 text-teal-700" />
              公众号二维码
            </button>

            <a
              href="https://tuijian.qiaomu.ai/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-stone-100 hover:text-slate-950"
            >
              <ExternalLink className="h-4 w-4 text-teal-700" />
              乔木推荐
            </a>
          </div>
        )}
      </div>

      {activeModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-950">{modalTitle}</h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-stone-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {activeModal === 'reward' ? (
              <div className="text-center">
                <img
                  src="/qiaomu_reward_qr.png"
                  alt="打赏支持二维码"
                  className="mx-auto h-auto w-full max-w-[260px] rounded-xl border border-stone-200"
                />
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  喜欢这个工具的话，可以请乔木喝杯咖啡。
                </p>
              </div>
            ) : (
              <div className="text-center">
                <img
                  src="/qiaomu_wechat_public_account_qr.jpg"
                  alt="向阳乔木推荐看公众号二维码"
                  className="mx-auto h-auto w-full max-w-[220px] rounded-xl border border-stone-200"
                />
                <p className="mt-4 text-sm font-medium text-slate-900">向阳乔木推荐看</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <a
                    href="https://github.com/joeseesun/"
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-stone-200"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                  <a
                    href="https://x.com/vista8"
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-stone-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    X
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default SiteAffordances
