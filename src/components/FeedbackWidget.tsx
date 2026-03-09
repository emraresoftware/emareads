import { useEffect, useRef, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_FEEDBACK_API || '/api/feedback'

type Category = 'bug' | 'suggestion' | 'question' | 'other'
type Priority = 'low' | 'normal' | 'high' | 'critical'
type Status = 'open' | 'in_progress' | 'resolved' | 'closed'

interface FeedbackItem {
  id: string
  message: string
  category: Category
  category_label: string
  priority: Priority
  status: Status
  status_label: string
  admin_reply?: string
  replied_at?: string
  created_at: string
}

const CATS: Array<{ id: Category; icon: string; label: string }> = [
  { id: 'bug', icon: '🐛', label: 'Hata' },
  { id: 'suggestion', icon: '💡', label: 'Öneri' },
  { id: 'question', icon: '❓', label: 'Soru' },
  { id: 'other', icon: '💬', label: 'Diğer' },
]
const PRIS: Array<{ id: Priority; label: string }> = [
  { id: 'low', label: 'Düşük' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'Yüksek' },
  { id: 'critical', label: 'Kritik' },
]
const STATUS_STYLES: Record<Status, string> = {
  open: 'bg-yellow-500/15 text-yellow-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  resolved: 'bg-emerald-500/15 text-emerald-400',
  closed: 'bg-slate-500/15 text-slate-400',
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'new' | 'history'>('new')
  const [cat, setCat] = useState<Category>('bug')
  const [pri, setPri] = useState<Priority>('normal')
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState<FeedbackItem[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Panel dışına tıklanınca kapat
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function loadHistory() {
    setHistLoading(true)
    const r = await fetch(`${API_URL}/my`).then(r => r.json()).catch(() => ({ messages: [] }))
    setHistory(r.messages || r.feedbacks || [])
    setHistLoading(false)
  }

  function switchTab(t: 'new' | 'history') {
    setTab(t)
    if (t === 'history') loadHistory()
  }

  async function handleSend() {
    if (msg.trim().length < 3) return
    setSending(true)
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, category: cat, priority: pri, page_url: location.href }),
    }).catch(() => null)
    setSending(false)
    setMsg('')
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div ref={panelRef} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      {/* Panel */}
      {open && (
        <div className="mb-3 w-80 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
          style={{ animation: 'fbSlideUp .2s ease' }}>
          <style>{`@keyframes fbSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div>
              <p className="text-white text-sm font-semibold">💬 Geri Bildirim</p>
              <p className="text-slate-500 text-xs">Görüşleriniz bizim için değerli</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            {(['new', 'history'] as const).map(t => (
              <button key={t} onClick={() => switchTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${
                  tab === t ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-300'
                }`}>
                {t === 'new' ? 'Yeni Bildirim' : 'Geçmişim'}
              </button>
            ))}
          </div>

          {/* Yeni bildirim */}
          {tab === 'new' && (
            <div className="p-4 space-y-3">
              {/* Kategori */}
              <div className="grid grid-cols-4 gap-1.5">
                {CATS.map(c => (
                  <button key={c.id} onClick={() => setCat(c.id)}
                    className={`py-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-0.5 border ${
                      cat === c.id ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-white'
                    }`}>
                    <span className="text-base">{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>

              {/* Öncelik */}
              <div className="flex gap-1.5">
                {PRIS.map(p => (
                  <button key={p.id} onClick={() => setPri(p.id)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      pri === p.id ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-white'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Mesaj */}
              {sent ? (
                <div className="text-center py-6">
                  <span className="text-4xl block mb-2">✅</span>
                  <p className="text-white font-medium text-sm">Teşekkür ederiz!</p>
                  <p className="text-slate-400 text-xs mt-1">Bildiriminiz iletildi.</p>
                </div>
              ) : (
                <textarea value={msg} onChange={e => setMsg(e.target.value)}
                  placeholder="Mesajınızı yazın... (min 3 karakter)"
                  maxLength={2000} rows={4}
                  className="w-full bg-slate-800/60 border border-slate-700/40 rounded-xl px-3 py-2 text-slate-200 text-sm placeholder-slate-600 outline-none focus:border-indigo-500/50 resize-none" />
              )}

              {/* Gönder */}
              {!sent && (
                <button onClick={handleSend} disabled={sending || msg.trim().length < 3}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  {sending ? 'Gönderiliyor...' : 'Gönder →'}
                </button>
              )}
            </div>
          )}

          {/* Geçmiş */}
          {tab === 'history' && (
            <div className="p-4 max-h-72 overflow-y-auto">
              {histLoading ? (
                <p className="text-slate-500 text-sm text-center py-6">Yükleniyor...</p>
              ) : history.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">Henüz geri bildiriminiz yok</p>
              ) : (
                <div className="space-y-2">
                  {history.map(f => (
                    <div key={f.id} className="p-3 bg-slate-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-400">{f.category_label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[f.status]}`}>
                          {f.status_label}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs">{f.message}</p>
                      <p className="text-slate-600 text-xs mt-1">{f.created_at}</p>
                      {f.admin_reply && (
                        <div className="mt-2 pl-2 border-l-2 border-indigo-500/50">
                          <p className="text-slate-400 text-xs">💬 {f.admin_reply}</p>
                          {f.replied_at && <p className="text-slate-600 text-xs mt-0.5">{f.replied_at}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Buton */}
      <button onClick={() => setOpen(o => !o)}
        className="w-13 h-13 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center text-2xl transition-transform hover:scale-110"
        style={{ width: 52, height: 52 }}
        title="Geri Bildirim">
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
