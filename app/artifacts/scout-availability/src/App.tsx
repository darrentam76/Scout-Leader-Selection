import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Compass,
  Download,
  FileJson,
  HandHeart,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  getGetScoutSummaryQueryKey,
  getListScoutSubmissionsQueryKey,
  type LeaderPreference,
  type LeaderPreferenceInput,
  type ScoutEvent,
  useChatWithScoutAssistant,
  useCreateScoutSubmission,
  useGetScoutSummary,
  useListScoutEvents,
  useListScoutSubmissions,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();

type FormState = LeaderPreferenceInput;

const initialForm: FormState = {
  fullName: '',
  gender: '男',
  unit: '',
  yearsExp: 0,
  isSenior: false,
  targetIcCount: 2,
  skills: [],
  preferredIcEvents: [],
  helperEvents: [],
  preferredPartners: [],
  notes: '',
};

const stepInfo = [
  { number: '01', title: '認識你', caption: '基本資料', icon: UserRound },
  { number: '02', title: '你的專長', caption: '技能與經驗', icon: Sparkles },
  { number: '03', title: '想參與的角色', caption: '年度活動', icon: HandHeart },
  { number: '04', title: '一起出發', caption: '夥伴與備註', icon: UsersRound },
];

const skillOptions = [
  'Pioneering & Pioneering Design (先鋒工程 / 繩結技能)',
  'Camping & Map/Compass Navigation (戶外露營 / 遠足導航)',
  'First Aid & Health Safety (急救 / 衛生保健)',
  'Water Sports & Canoeing/Swimming (水上活動 / 游泳獨木舟)',
  'IT, AI & Web Development (資訊科技 / AI 應用 / 網站開發)',
  'Media, Photography & Graphic Design (影音製作 / 攝影 / 宣傳設計)',
  'MC, Games & Stage Performance (活動主持 / 團康司儀 / 遊戲帶領)',
  'Handicrafts & Badge Crafts (手藝創作 / 徽章製作)',
  'Camp Cooking & Meal Logistics (野外烹飪 / 膳食籌劃)',
  'Astronomy & Weather Observation (天文 / 氣象觀察)',
  'Environmental & Nature Conservation (環保生態 / 自然觀察)',
  'Drill & Ceremony Discipline (隊伍紀律 / 步操儀仗)',
  'Child Psychology & Youth Counseling (兒童心理 / 社工輔導)',
  'Administration & Secretarial (行政管理 / 檔案文書)',
  'Finance, Accounting & Budgeting (財務會計 / 預算控管)',
  'Quartermaster & Equipment Management (物資採購 / 裝備管理)',
  'Logistics & Transport Management (車隊運輸 / 物流統籌)',
  'Housewife / Homemaker (全職家庭主婦/主夫)',
  'Student / Youth Leader (學生 / 青年領袖)',
  'Others / NA (其他 / 不適用)',
];
const partnerOptions = ['高年級組', '低年級組', '親子活動組', '行政支援組'];

function ScoutMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${inverse ? 'bg-[#f7f1df] text-[#203640]' : 'bg-[#f47b35] text-[#203640]'}`}>
      <Compass size={22} strokeWidth={2.4} />
    </span>
  );
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-home-brand">
      <ScoutMark inverse={inverse} />
      <span className={`leading-tight ${inverse ? 'text-[#f7f1df]' : 'text-[#203640]'}`}>
        <strong className="block text-[15px] font-black tracking-[.08em]">3RD SCOUT TROOP</strong>
        <span className="block text-[11px] font-medium tracking-[.18em] opacity-65">小三童軍 · AVAILABILITY</span>
      </span>
    </Link>
  );
}

function TopBar({ admin = false }: { admin?: boolean }) {
  return (
    <header className="flex items-center justify-between border-b border-[#d9cfbd] px-5 py-4 md:px-10">
      <Brand />
      <div className="flex items-center gap-2">
        {admin ? (
          <Link href="/" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-[#617177] transition hover:bg-[#e7dfcf] sm:flex" data-testid="link-submit-form">
            <ArrowLeft size={16} /> 回到填寫表單
          </Link>
        ) : (
          <Link href="/admin" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-[#617177] transition hover:bg-[#e7dfcf]" data-testid="link-admin-dashboard">
            <LayoutDashboard size={16} /> <span className="hidden sm:inline">領隊看板</span>
          </Link>
        )}
        <button className="rounded-full p-2 text-[#617177] sm:hidden" aria-label="開啟選單" data-testid="button-mobile-menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

function ProgressRail({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center gap-1.5 md:mb-10">
      {stepInfo.map((item, index) => {
        const Icon = item.icon;
        const active = index === step;
        const done = index < step;
        return (
          <div className="flex min-w-0 flex-1 items-center gap-1.5" key={item.number}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-all ${active ? 'border-[#f47b35] bg-[#f47b35] text-[#203640] shadow-[0_3px_0_#c85f27]' : done ? 'border-[#39725e] bg-[#39725e] text-[#f7f1df]' : 'border-[#c9c0b1] bg-[#eee8da] text-[#879092]'}`}>
              {done ? <Check size={15} strokeWidth={3} /> : <Icon size={14} />}
            </div>
            <div className="hidden min-w-0 sm:block">
              <span className={`block truncate text-xs font-black ${active ? 'text-[#203640]' : 'text-[#889294]'}`}>{item.title}</span>
              <span className="block truncate text-[10px] text-[#9a9b93]">{item.caption}</span>
            </div>
            {index < stepInfo.length - 1 && <div className={`mx-0.5 h-px flex-1 ${done ? 'bg-[#39725e]' : 'bg-[#d7cfbf]'}`} />}
          </div>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return <label className="mb-2 block text-sm font-black text-[#344b51]">{children}{required && <span className="ml-1 text-[#e26d32]">*</span>}</label>;
}

function TextField({ label, value, onChange, placeholder, type = 'text', required = false, id }: { label: string; value: string | number; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean; id: string }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input id={id} data-testid={`input-${id}`} value={value} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} min={type === 'number' ? 0 : undefined} className="h-12 w-full rounded-xl border border-[#d5cbbb] bg-[#fbf8ef] px-4 text-[15px] text-[#203640] outline-none transition placeholder:text-[#a7a59a] focus:border-[#f47b35] focus:ring-4 focus:ring-[#f47b35]/15" />
    </div>
  );
}

function ChoiceChip({ label, selected, onClick, id }: { label: string; selected: boolean; onClick: () => void; id: string }) {
  return (
    <button type="button" onClick={onClick} data-testid={`button-choice-${id}`} aria-pressed={selected} className={`rounded-full border px-3.5 py-2 text-sm font-bold transition-all active:scale-[.97] ${selected ? 'border-[#39725e] bg-[#39725e] text-[#f7f1df] shadow-[0_2px_0_#285343]' : 'border-[#d5cbbb] bg-[#fbf8ef] text-[#536468] hover:border-[#39725e] hover:text-[#285343]'}`}>
      {selected && <Check size={14} className="mr-1 inline-block" strokeWidth={3} />}{label}
    </button>
  );
}

function EventCard({ event, preferred, helper, onPreferred, onHelper }: { event: ScoutEvent; preferred: boolean; helper: boolean; onPreferred: () => void; onHelper: () => void }) {
  const date = new Date(event.date);
  const monthOnly = /^\d{4}-\d{2}$/.test(event.date);
  const month = monthOnly ? `${Number(event.date.slice(5))}月` : Number.isNaN(date.getTime()) ? '--' : `${date.getMonth() + 1}月`;
  const day = monthOnly ? '待定' : Number.isNaN(date.getTime()) ? '--' : `${date.getDate()}`;
  return (
    <div className={`rounded-2xl border bg-[#fbf8ef] p-4 transition-all ${preferred || helper ? 'border-[#f47b35] shadow-[0_3px_0_#e8aa7c]' : 'border-[#d9cfbd]'}`} data-testid={`card-event-${event.id}`}>
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#203640] text-[#f7f1df]">
          <span className="text-[10px] font-bold tracking-wider text-[#f6c667]">{month}</span>
          <strong className="font-mono text-xl leading-none">{day}</strong>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-black text-[#203640]" data-testid={`text-event-name-${event.id}`}>{event.name}</p>
          <p className="mt-0.5 truncate text-xs text-[#738084]">{event.nameEn || event.unit}</p>
          <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#39725e]"><UsersRound size={12} /> 需要 {event.helpers} 位協助</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" data-testid={`button-ic-event-${event.id}`} onClick={onPreferred} className={`rounded-lg border py-2 text-xs font-black transition ${preferred ? 'border-[#f47b35] bg-[#f47b35] text-[#203640]' : 'border-[#d9cfbd] text-[#617177] hover:border-[#f47b35]'}`}>{preferred ? '已選為主責' : '我想主責'}</button>
        <button type="button" data-testid={`button-helper-event-${event.id}`} onClick={onHelper} className={`rounded-lg border py-2 text-xs font-black transition ${helper ? 'border-[#39725e] bg-[#d7e7db] text-[#285343]' : 'border-[#d9cfbd] text-[#617177] hover:border-[#39725e]'}`}>{helper ? '已選為協助' : '我可協助'}</button>
      </div>
    </div>
  );
}

function FormIntro() {
  return (
    <aside className="relative overflow-hidden bg-[#203640] px-6 py-8 text-[#f7f1df] md:flex md:min-h-[calc(100dvh-73px)] md:w-[38%] md:flex-col md:justify-between md:px-12 md:py-12">
      <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full border-[28px] border-[#39725e]/45" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full border-[28px] border-[#f47b35]/25" />
      <div className="relative animate-rise">
        <div className="mb-8 flex items-center gap-2 text-xs font-bold tracking-[.18em] text-[#f6c667]"><span className="h-px w-8 bg-[#f6c667]" /> 2026 年度</div>
        <p className="mb-4 text-sm font-bold tracking-[.14em] text-[#b8cabb]">給每一位願意同行的領隊</p>
        <h1 className="max-w-md text-[clamp(2.5rem,8vw,5.5rem)] font-black leading-[1.05] tracking-[-.07em]">把時間<br /><span className="text-[#f47b35]">留給一起</span><br />成長的人。</h1>
        <p className="mt-7 max-w-sm text-sm leading-7 text-[#c6d1cb]">小三童軍的年度活動，需要每一雙願意伸出的手。告訴我們你的專長與心之所向，讓我們把合適的人放在合適的位置。</p>
      </div>
      <div className="relative mt-9 hidden md:block">
        <div className="mb-6 h-px w-full bg-[#f7f1df]/15" />
        <div className="flex items-start gap-3 text-xs leading-5 text-[#b8cabb]"><ShieldCheck className="mt-0.5 shrink-0 text-[#f6c667]" size={17} /><span>資料只用於本年度活動分工，<br />由領隊團隊妥善保管。</span></div>
        <p className="mt-9 font-mono text-[10px] tracking-[.15em] text-[#71888a]">EST. 2014 · THIRD SCOUT TROOP</p>
      </div>
    </aside>
  );
}

function FormError({ message = '資料載入出了點狀況，請再試一次。', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#e7b1a6] bg-[#fff2ee] p-4 text-sm text-[#9c4237]" data-testid="state-error">
      <AlertCircle size={19} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="flex items-center gap-1 font-black underline" data-testid="button-retry"><RefreshCw size={14} />重試</button>}
    </div>
  );
}

type ChatMessage = { role: 'assistant' | 'user'; content: string };

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const chat = useChatWithScoutAssistant();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '你好！我可以協助說明填表流程、主 IC 分工規則，以及資料私隱與安全安排。' },
  ]);
  const send = () => {
    const question = text.trim();
    if (!question) return;
    setMessages((current) => [...current, { role: 'user', content: question }]);
    setText('');
    chat.mutate({ data: { message: question } }, {
      onSuccess: (result) => setMessages((current) => [...current, { role: 'assistant', content: result.reply }]),
      onError: () => setMessages((current) => [...current, { role: 'assistant', content: '助手目前未能連線，請稍後再試，或直接聯絡領隊團隊。' }]),
    });
  };
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <section className="mb-3 w-[min(23rem,calc(100vw-2.5rem))] overflow-hidden rounded-3xl border border-[#d9cfbd] bg-[#fbf8ef] shadow-[0_22px_60px_rgba(32,54,64,.28)]" aria-label="資料私隱與流程助手" data-testid="chat-widget">
          <header className="flex items-center gap-3 bg-[#203640] px-4 py-3.5 text-[#f7f1df]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f47b35] text-[#203640]"><ShieldCheck size={19} /></span>
            <div className="min-w-0 flex-1"><strong className="block text-sm">資料私隱與流程助手</strong><span className="block text-[11px] text-[#c6d1cb]">只回答小三童軍系統相關問題</span></div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 text-[#c6d1cb] hover:bg-white/10" aria-label="關閉助手"><X size={18} /></button>
          </header>
          <div className="max-h-72 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.role === 'user' ? 'bg-[#f47b35] text-[#203640]' : 'bg-[#e9e5d9] text-[#42575a]'}`}>{message.content}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#e2d9c9] p-3">
            <div className="flex gap-2 rounded-2xl border border-[#d5cbbb] bg-white p-1.5 focus-within:border-[#39725e]">
              <input value={text} disabled={chat.isPending} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') send(); }} placeholder="輸入你的問題…" className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-[#9a9b93] disabled:opacity-60" data-testid="input-chat-message" />
              <button type="button" disabled={chat.isPending} onClick={send} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#39725e] text-white transition hover:bg-[#285343] disabled:opacity-60" aria-label="傳送問題" data-testid="button-send-chat">{chat.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}</button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-[#8a9491]"><LockKeyhole size={11} />請勿輸入身分證號、住址或其他非必要敏感資料。</p>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((current) => !current)} className="flex h-14 items-center gap-2 rounded-full bg-[#203640] px-4 text-sm font-black text-[#f7f1df] shadow-[0_8px_22px_rgba(32,54,64,.28)] transition hover:-translate-y-0.5" aria-expanded={open} data-testid="button-chat-widget">
        <MessageCircle size={20} className="text-[#f6c667]" /> <span>{open ? '收起助手' : '需要協助？'}</span>
      </button>
    </div>
  );
}

function ConfirmModal({ form, events, pending, error, onClose, onConfirm }: { form: FormState; events: ScoutEvent[]; pending: boolean; error: boolean; onClose: () => void; onConfirm: () => void }) {
  const selectedEvents = events.filter((event) => form.preferredIcEvents.includes(event.id) || form.helperEvents.includes(event.id));
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#203640]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="confirm-title" data-testid="modal-confirm">
      <div className="animate-pop w-full max-w-lg rounded-t-[2rem] border border-[#d9cfbd] bg-[#fbf8ef] p-6 shadow-2xl sm:rounded-[2rem] sm:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div><p className="mb-1 text-xs font-black tracking-[.16em] text-[#39725e]">最後確認</p><h2 id="confirm-title" className="text-2xl font-black tracking-tight text-[#203640]">準備送出你的選擇？</h2></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#758185] hover:bg-[#e7dfcf]" aria-label="關閉確認視窗" data-testid="button-close-confirm"><X size={20} /></button>
        </div>
        <div className="space-y-3 rounded-2xl bg-[#eee8da] p-4 text-sm">
          <div className="flex justify-between gap-4"><span className="text-[#718084]">領隊</span><strong data-testid="text-confirm-name">{form.fullName} · {form.unit}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-[#718084]">專長</span><strong className="max-w-[70%] text-right">{form.skills.length ? form.skills.join('、') : '尚未選擇'}</strong></div>
          <div className="flex justify-between gap-4"><span className="text-[#718084]">活動志願</span><strong className="max-w-[70%] text-right">{selectedEvents.length ? `${selectedEvents.length} 個活動` : '尚未選擇'}</strong></div>
        </div>
        {error && <div className="mt-4"><FormError message="送出失敗，資料沒有離開這個頁面。請稍後再試。" /></div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-12 rounded-xl px-5 text-sm font-black text-[#617177] hover:bg-[#e7dfcf]" data-testid="button-edit-form">回去修改</button>
          <button type="button" disabled={pending} onClick={onConfirm} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#f47b35] px-6 text-sm font-black text-[#203640] shadow-[0_3px_0_#c85f27] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-confirm-submit">{pending ? '送出中…' : '確認送出'}<ArrowRight size={17} /></button>
        </div>
      </div>
    </div>
  );
}

function SuccessPanel({ submission, onReset }: { submission: LeaderPreference; onReset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-73px)] max-w-3xl items-center px-5 py-12 md:px-10">
      <div className="animate-pop w-full rounded-[2rem] border border-[#d9cfbd] bg-[#fbf8ef] p-7 shadow-[var(--shadow-md)] md:p-12">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#39725e] text-[#f7f1df] shadow-[0_4px_0_#285343]"><CheckCircle2 size={33} /></div>
        <p className="mb-2 text-xs font-black tracking-[.18em] text-[#39725e]">已收到你的回覆</p>
        <h1 className="text-3xl font-black tracking-tight text-[#203640] md:text-5xl">謝謝你，{submission.fullName}。</h1>
        <p className="mt-4 max-w-lg leading-7 text-[#617177]">你的年度意願已經交到領隊團隊手上。我們會依照整體回覆安排活動分工，期待在營地見到你。</p>
        <div className="my-9 grid gap-3 border-y border-[#d9cfbd] py-5 sm:grid-cols-3">
          <div><span className="block text-xs text-[#8a9491]">所屬單位</span><strong className="mt-1 block text-[#203640]" data-testid="text-success-unit">{submission.unit}</strong></div>
          <div><span className="block text-xs text-[#8a9491]">你的專長</span><strong className="mt-1 block text-[#203640]" data-testid="text-success-skills">{submission.skills.length ? `${submission.skills.length} 項` : '未填寫'}</strong></div>
          <div><span className="block text-xs text-[#8a9491]">回覆編號</span><strong className="mt-1 block font-mono text-sm text-[#203640]" data-testid="text-success-id">{submission.id.slice(0, 8).toUpperCase()}</strong></div>
        </div>
        <button type="button" onClick={onReset} className="flex h-12 items-center gap-2 rounded-xl bg-[#203640] px-5 text-sm font-black text-[#f7f1df] transition hover:bg-[#2c4a57]" data-testid="button-new-submission"><RefreshCw size={16} />填寫另一份回覆</button>
      </div>
    </main>
  );
}

function LeaderForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState<LeaderPreference | null>(null);
  const queryClient = useQueryClient();
  const eventsQuery = useListScoutEvents();
  const createSubmission = useCreateScoutSubmission();
  const events = eventsQuery.data ?? [];

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setExperience = (years: number) => setForm((current) => ({ ...current, yearsExp: years, isSenior: years >= 3 }));
  const toggle = (key: 'skills' | 'preferredIcEvents' | 'helperEvents' | 'preferredPartners', value: string, max?: number) => {
    const current = form[key];
    if (current.includes(value)) update(key, current.filter((item) => item !== value) as FormState[typeof key]);
    else if (!max || current.length < max) update(key, [...current, value] as FormState[typeof key]);
  };
  const goNext = () => {
    if (step === 0 && (!form.fullName.trim() || !form.unit.trim())) return;
    if (step === 1 && form.skills.length === 0) return;
    if (step < 3) setStep((current) => current + 1);
    else setConfirm(true);
  };
  const confirmSubmit = () => {
    createSubmission.mutate({ data: form }, {
      onSuccess: (result) => {
        setSubmitted(result);
        setConfirm(false);
        queryClient.invalidateQueries({ queryKey: getListScoutSubmissionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetScoutSummaryQueryKey() });
      },
    });
  };
  if (submitted) return <><TopBar /><SuccessPanel submission={submitted} onReset={() => { setSubmitted(null); setStep(0); setForm(initialForm); }} /></>;

  return (
    <div className="paper-grain min-h-[100dvh]">
      <TopBar />
      <div className="md:flex">
        <FormIntro />
        <main className="min-w-0 flex-1 px-5 py-8 md:px-12 md:py-14 lg:px-20">
          <div className="mx-auto max-w-2xl">
            <ProgressRail step={step} />
            <div className="animate-rise" key={step}>
              {step === 0 && <section><p className="mb-2 text-xs font-black tracking-[.16em] text-[#e26d32]">第一站 · 基本資料</p><h2 className="text-3xl font-black tracking-tight text-[#203640] md:text-4xl">先讓我們認識你。</h2><p className="mt-3 text-sm leading-6 text-[#758185]">簡單幾題，讓今年的分工更貼近每位夥伴。</p><div className="mt-9 space-y-5"><TextField id="full-name" label="姓名" value={form.fullName} onChange={(value) => update('fullName', value)} placeholder="請輸入你的姓名" required /><div className="grid gap-5 sm:grid-cols-2"><label><FieldLabel required>性別 <span className="text-xs font-normal text-[#8a9491]">Gender</span></FieldLabel><select value={form.gender} onChange={(event) => update('gender', event.target.value as FormState['gender'])} className="h-12 w-full rounded-xl border border-[#d5cbbb] bg-[#fbf8ef] px-4 text-sm font-bold text-[#344b51] outline-none focus:border-[#39725e]" data-testid="select-gender"><option value="男">男 Male</option><option value="女">女 Female</option></select></label><label><FieldLabel required>所屬小組／小幼童軍團 <span className="text-xs font-normal text-[#8a9491]">Unit</span></FieldLabel><select value={form.unit} onChange={(event) => update('unit', event.target.value)} className="h-12 w-full rounded-xl border border-[#d5cbbb] bg-[#fbf8ef] px-4 text-sm font-bold text-[#344b51] outline-none focus:border-[#39725e]" data-testid="select-unit"><option value="">請選擇</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option><option value="P4">P4</option><option value="P5">P5</option><option value="P6">P6</option><option value="Secondary">中學 Secondary</option><option value="Special">特別組 Special</option></select></label></div><div className="grid gap-5 sm:grid-cols-2"><label><FieldLabel required>童軍資歷／年資 <span className="text-xs font-normal text-[#8a9491]">Experience</span></FieldLabel><select value={form.yearsExp} onChange={(event) => setExperience(Number(event.target.value))} className="h-12 w-full rounded-xl border border-[#d5cbbb] bg-[#fbf8ef] px-4 text-sm font-bold text-[#344b51] outline-none focus:border-[#39725e]" data-testid="select-years-exp"><option value={0}>請選擇</option><option value={1}>1 年</option><option value={2}>2 年</option><option value={3}>3 年</option><option value={4}>4–6 年</option><option value={7}>7–10 年</option><option value={11}>11–15 年</option><option value={16}>16–20 年</option></select></label><label><FieldLabel>期望擔任主 IC 次數 <span className="text-xs font-normal text-[#8a9491]">Target</span></FieldLabel><select value={form.targetIcCount} onChange={(event) => update('targetIcCount', Number(event.target.value))} className="h-12 w-full rounded-xl border border-[#d5cbbb] bg-[#fbf8ef] px-4 text-sm font-bold text-[#344b51] outline-none focus:border-[#39725e]" data-testid="select-target-ic"><option value={2}>2 次</option><option value={3}>3 次</option><option value={4}>4 次</option></select></label></div><div className={`rounded-2xl border p-4 ${form.isSenior ? 'border-[#b8d4bd] bg-[#e6f0e7] text-[#285343]' : 'border-[#f3d788] bg-[#fff4cd] text-[#83651c]'}`} data-testid="text-seniority-badge"><div className="flex items-center gap-2 font-black">{form.isSenior ? <ShieldCheck size={18} /> : <Sparkles size={18} />}{form.isSenior ? 'Senior Scouter（資深領袖）' : 'Junior Scouter（新進領袖）'}</div><p className="mt-1 text-xs opacity-75">{form.isSenior ? '3 年或以上童軍資歷' : '1–2 年童軍資歷'}</p></div>{form.targetIcCount > 3 && <div className="rounded-2xl border border-[#e7b1a6] bg-[#fff2ee] p-4 text-sm text-[#9c4237]" data-testid="text-ic-cap-warning"><strong>工作量上限提醒：</strong> 每位領袖實際主 IC 次數最多為 3 次；領隊團隊會按整體安排平衡分工。</div>}</div></section>}
              {step === 1 && <section><p className="mb-2 text-xs font-black tracking-[.16em] text-[#e26d32]">第二站 · 技能與經驗</p><h2 className="text-3xl font-black tracking-tight text-[#203640] md:text-4xl">你擅長什麼？</h2><p className="mt-3 text-sm leading-6 text-[#758185]">最多選 5 項，讓夥伴知道什麼時候可以找你。</p><div className="mt-9"><FieldLabel required>我的專長 <span className="ml-1 font-mono text-[11px] font-normal text-[#8d9692]">{form.skills.length}/5</span></FieldLabel><div className="flex flex-wrap gap-2.5">{skillOptions.map((skill) => <ChoiceChip key={skill} id={`skill-${skill}`} label={skill} selected={form.skills.includes(skill)} onClick={() => toggle('skills', skill, 5)} />)}</div><div className="mt-8 rounded-2xl border border-dashed border-[#d5cbbb] bg-[#eee8da]/60 p-4 text-sm leading-6 text-[#758185]"><Sparkles size={17} className="mr-2 inline-block text-[#e26d32]" />不確定怎麼選？想想看：活動中大家最常稱讚你哪件事？</div></div></section>}
              {step === 2 && <section><p className="mb-2 text-xs font-black tracking-[.16em] text-[#e26d32]">第三站 · 年度活動</p><h2 className="text-3xl font-black tracking-tight text-[#203640] md:text-4xl">在哪裡一起出力？</h2><p className="mt-3 text-sm leading-6 text-[#758185]">可以同時選擇主責與協助，告訴我們你的理想參與方式。</p><div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-[#617177]"><span className="rounded-full bg-[#fce1cd] px-3 py-1.5 text-[#a95027]">主責：我想帶頭規劃</span><span className="rounded-full bg-[#d7e7db] px-3 py-1.5 text-[#285343]">協助：我可以搭把手</span></div><div className="mt-5 space-y-3">{eventsQuery.isLoading ? [1, 2, 3].map((item) => <div className="skel h-[164px] rounded-2xl" key={item} data-testid={`skeleton-event-${item}`} />) : eventsQuery.isError ? <FormError onRetry={() => eventsQuery.refetch()} /> : events.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d5cbbb] p-8 text-center text-sm text-[#758185]" data-testid="state-empty-events">目前還沒有年度活動資料。</div> : events.map((event) => <EventCard key={event.id} event={event} preferred={form.preferredIcEvents.includes(event.id)} helper={form.helperEvents.includes(event.id)} onPreferred={() => toggle('preferredIcEvents', event.id)} onHelper={() => toggle('helperEvents', event.id)} />)}</div></section>}
              {step === 3 && <section><p className="mb-2 text-xs font-black tracking-[.16em] text-[#e26d32]">第四站 · 一起出發</p><h2 className="text-3xl font-black tracking-tight text-[#203640] md:text-4xl">想和誰並肩？</h2><p className="mt-3 text-sm leading-6 text-[#758185]">活動沒有標準答案，找到聊得來、做事有默契的夥伴就很好。</p><div className="mt-9"><FieldLabel>希望合作的夥伴類型 <span className="text-xs font-normal text-[#8a9491]">可選 0–4 項</span></FieldLabel><div className="flex flex-wrap gap-2.5">{partnerOptions.map((partner) => <ChoiceChip key={partner} id={`partner-${partner}`} label={partner} selected={form.preferredPartners.includes(partner)} onClick={() => toggle('preferredPartners', partner, 4)} />)}</div><div className="mt-7"><FieldLabel>還有什麼想告訴領隊團隊？</FieldLabel><textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="例如：某些日期不方便、想嘗試的新任務，或一句給夥伴的話……" rows={5} className="w-full resize-none rounded-2xl border border-[#d5cbbb] bg-[#fbf8ef] p-4 text-[15px] leading-7 text-[#203640] outline-none transition placeholder:text-[#a7a59a] focus:border-[#f47b35] focus:ring-4 focus:ring-[#f47b35]/15" data-testid="input-notes" /></div></div></section>}
            </div>
            <div className="mt-10 flex items-center justify-between border-t border-[#d9cfbd] pt-6">
              <button type="button" disabled={step === 0} onClick={() => setStep((current) => current - 1)} className="flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-black text-[#718084] transition hover:bg-[#e7dfcf] disabled:invisible" data-testid="button-previous-step"><ArrowLeft size={17} />上一步</button>
              <span className="font-mono text-[11px] font-bold tracking-widest text-[#9a9b93]" data-testid="text-step-count">{String(step + 1).padStart(2, '0')} / 04</span>
              <button type="button" onClick={goNext} className="flex h-12 items-center gap-2 rounded-xl bg-[#f47b35] px-5 text-sm font-black text-[#203640] shadow-[0_3px_0_#c85f27] transition hover:-translate-y-0.5 active:translate-y-0" data-testid="button-next-step">{step === 3 ? '檢查並送出' : '繼續'}<ArrowRight size={17} /></button>
            </div>
            {step === 0 && (!form.fullName.trim() || !form.unit.trim()) && <p className="mt-3 text-right text-xs text-[#a95027]" data-testid="text-form-hint">請先填寫姓名與單位</p>}
            {step === 1 && form.skills.length === 0 && <p className="mt-3 text-right text-xs text-[#a95027]" data-testid="text-skills-hint">請至少選一項專長</p>}
          </div>
        </main>
      </div>
      {confirm && <ConfirmModal form={form} events={events} pending={createSubmission.isPending} error={createSubmission.isError} onClose={() => setConfirm(false)} onConfirm={confirmSubmit} />}
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="space-y-3" data-testid="state-loading-dashboard">{[1, 2, 3, 4].map((item) => <div className="skel h-20 rounded-2xl" key={item} />)}</div>;
}

function AdminDashboard() {
  const [search, setSearch] = useState('');
  const submissionsQuery = useListScoutSubmissions();
  const summaryQuery = useGetScoutSummary();
  const submissions = submissionsQuery.data ?? [];
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return submissions;
    return submissions.filter((item) => [item.fullName, item.unit, ...item.skills].join(' ').toLowerCase().includes(needle));
  }, [search, submissions]);
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `3rd-scout-submissions-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="paper-grain min-h-[100dvh]">
      <TopBar admin />
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="mb-2 flex items-center gap-2 text-xs font-black tracking-[.16em] text-[#39725e]"><span className="h-2 w-2 rounded-full bg-[#f47b35]" /> 領隊工作台</p><h1 className="text-4xl font-black tracking-[-.05em] text-[#203640] md:text-5xl">今年，誰要一起上場？</h1><p className="mt-3 text-sm text-[#758185]">查看回覆，找到最適合的活動搭檔。</p></div>
          <button type="button" onClick={exportJson} disabled={!filtered.length} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d0c6b6] bg-[#fbf8ef] px-4 text-sm font-black text-[#344b51] transition hover:border-[#39725e] disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-export-json"><FileJson size={17} />匯出 JSON</button>
        </div>
        {summaryQuery.isError && <div className="mb-5"><FormError message="摘要暫時無法載入。" onRetry={() => summaryQuery.refetch()} /></div>}
        <section className="mb-8 grid gap-3 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl bg-[#203640] p-5 text-[#f7f1df] shadow-[var(--shadow-sm)]" data-testid="card-summary-total"><ClipboardList className="absolute right-4 top-4 text-[#f47b35]/70" size={24} /><span className="text-xs font-bold text-[#b8cabb]">收到回覆</span>{summaryQuery.isLoading ? <div className="skel mt-3 h-9 w-20 rounded-lg bg-[#3a535b]" /> : <strong className="mt-1 block font-mono text-4xl text-[#f6c667]" data-testid="text-summary-total">{summaryQuery.data?.totalSubmissions ?? submissions.length}</strong>}<span className="mt-1 block text-xs text-[#8da29d]">份年度意願</span></div>
          <div className="rounded-2xl border border-[#d9cfbd] bg-[#fbf8ef] p-5 shadow-[var(--shadow-sm)]" data-testid="card-summary-senior"><ShieldCheck className="mb-4 text-[#39725e]" size={23} /><span className="block text-xs font-bold text-[#758185]">資深領隊</span>{summaryQuery.isLoading ? <div className="skel mt-2 h-9 w-20 rounded-lg" /> : <strong className="mt-1 block font-mono text-4xl text-[#203640]" data-testid="text-summary-senior">{summaryQuery.data?.seniorCount ?? 0}</strong>}<span className="mt-1 block text-xs text-[#8a9491]">位可帶領夥伴</span></div>
          <div className="rounded-2xl border border-[#d9cfbd] bg-[#fbf8ef] p-5 shadow-[var(--shadow-sm)]" data-testid="card-summary-skills"><Sparkles className="mb-4 text-[#e26d32]" size={23} /><span className="block text-xs font-bold text-[#758185]">最常出現的專長</span>{summaryQuery.isLoading ? <div className="skel mt-2 h-9 w-28 rounded-lg" /> : <strong className="mt-1 block truncate text-2xl font-black text-[#203640]" data-testid="text-summary-top-skill">{summaryQuery.data?.topSkills?.[0]?.skill ?? '等待回覆'}</strong>}<span className="mt-1 block text-xs text-[#8a9491]">{summaryQuery.data?.topSkills?.[0] ? `${summaryQuery.data.topSkills[0].count} 位領隊` : '持續收集中'}</span></div>
        </section>
        <section className="rounded-[1.7rem] border border-[#d9cfbd] bg-[#fbf8ef] shadow-[var(--shadow-sm)]">
          <div className="flex flex-col gap-4 border-b border-[#e0d8ca] p-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div><h2 className="flex items-center gap-2 text-lg font-black text-[#203640]"><UsersRound size={19} className="text-[#39725e]" />夥伴名單</h2><p className="mt-1 text-xs text-[#8a9491]" data-testid="text-results-count">顯示 {filtered.length} / {submissions.length} 份回覆</p></div>
            <div className="relative w-full md:w-72"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a9491]" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋姓名、單位或專長" className="h-10 w-full rounded-xl border border-[#d5cbbb] bg-[#f3eee3] pl-10 pr-3 text-sm outline-none transition focus:border-[#39725e] focus:ring-4 focus:ring-[#39725e]/10" data-testid="input-search-submissions" /></div>
          </div>
          <div className="p-3 md:p-5">
            {submissionsQuery.isLoading ? <DashboardSkeleton /> : submissionsQuery.isError ? <FormError message="回覆名單載入失敗。" onRetry={() => submissionsQuery.refetch()} /> : filtered.length === 0 ? <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d5cbbb] px-5 py-16 text-center" data-testid="state-empty-submissions"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eee8da] text-[#718084]"><Search size={22} /></div><h3 className="font-black text-[#203640]">{submissions.length ? '找不到相符的回覆' : '還沒有收到回覆'}</h3><p className="mt-2 text-sm text-[#8a9491]">{submissions.length ? '試試其他姓名、單位或專長。' : '把表單連結給夥伴，從第一份回覆開始。'}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] border-separate border-spacing-0 text-left"><thead><tr className="text-[11px] font-black tracking-wider text-[#8a9491]"><th className="border-b border-[#e0d8ca] px-3 pb-3">領隊</th><th className="border-b border-[#e0d8ca] px-3 pb-3">單位</th><th className="border-b border-[#e0d8ca] px-3 pb-3">經驗</th><th className="border-b border-[#e0d8ca] px-3 pb-3">專長</th><th className="border-b border-[#e0d8ca] px-3 pb-3">參與活動</th><th className="border-b border-[#e0d8ca] px-3 pb-3">回覆時間</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="group transition hover:bg-[#f3eee3]" data-testid={`row-submission-${item.id}`}><td className="border-b border-[#eee8da] px-3 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d7e7db] text-xs font-black text-[#285343]">{item.fullName.slice(0, 1)}</span><div><strong className="block text-sm text-[#203640]" data-testid={`text-submission-name-${item.id}`}>{item.fullName}</strong>{item.isSenior && <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#39725e]"><ShieldCheck size={11} />資深領隊</span>}</div></div></td><td className="border-b border-[#eee8da] px-3 py-4 text-sm text-[#536468]">{item.unit}</td><td className="border-b border-[#eee8da] px-3 py-4 font-mono text-sm text-[#536468]">{item.yearsExp} 年</td><td className="max-w-[230px] border-b border-[#eee8da] px-3 py-4"><div className="flex flex-wrap gap-1.5">{item.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded-md bg-[#fce1cd] px-2 py-1 text-[11px] font-bold text-[#a95027]">{skill}</span>)}{item.skills.length > 3 && <span className="px-1 py-1 text-[11px] text-[#8a9491]">+{item.skills.length - 3}</span>}</div></td><td className="border-b border-[#eee8da] px-3 py-4 text-sm text-[#536468]">{item.preferredIcEvents.length + item.helperEvents.length ? `${item.preferredIcEvents.length + item.helperEvents.length} 個活動` : '—'}</td><td className="border-b border-[#eee8da] px-3 py-4 font-mono text-[11px] text-[#8a9491]">{new Date(item.createdAt).toLocaleDateString('zh-TW')}</td></tr>)}</tbody></table></div>}
          </div>
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-[#8a9491]"><CalendarDays size={14} />資料會隨夥伴送出表單即時更新</p>
      </main>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={LeaderForm} /><Route path="/admin" component={AdminDashboard} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><ChatWidget /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;