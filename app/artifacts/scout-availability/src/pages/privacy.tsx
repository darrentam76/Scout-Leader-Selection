import { Link } from 'wouter';
import { ArrowLeft, CalendarDays, LockKeyhole, MessageCircle, ShieldCheck, UserRound } from 'lucide-react';

const sections = [
  {
    icon: UserRound,
    title: '我們收集的資料',
    body: '透過本表單收集：姓名、性別、所屬小組／小幼童軍團、童軍年資、專長選項、年度活動意願（主責／協助）、希望合作的夥伴類型，以及你自願填寫的備註。',
  },
  {
    icon: ShieldCheck,
    title: '資料用途',
    body: '所有資料只用於籌劃本年度（2026–27）活動分工與配對，不會用於其他用途，亦不會出售或提供予任何第三方的商業用途。',
  },
  {
    icon: LockKeyhole,
    title: '儲存與存取安全',
    body: '資料以加密連線（HTTPS）傳送並儲存於受管理的資料庫。名單頁面已加鎖，只有領隊團隊以密碼登入後才能查看；公開網絡無法讀取任何回覆內容。',
  },
  {
    icon: CalendarDays,
    title: '保留期限',
    body: '回覆資料保留 180 日，之後由系統自動刪除。如活動安排提前完成，我們亦可能提前清除。',
  },
  {
    icon: MessageCircle,
    title: 'AI 助手說明',
    body: '頁面上的「資料私隱與流程助手」由 AI 生成內容，僅供參考。你的提問會經過第三方 AI 服務（DeepSeek）處理以產生回覆。請勿在對話中輸入身分證號碼、住址等敏感個人資料。如有疑問，請直接向領隊團隊查詢。',
  },
];

export default function PrivacyPage() {
  return (
    <div className="paper-grain min-h-[100dvh]">
      <header className="flex items-center justify-between border-b border-[#d9cfbd] px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-[#617177] transition hover:bg-[#e7dfcf]" data-testid="link-privacy-back">
          <ArrowLeft size={16} /> 回到填寫表單
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 md:px-10 md:py-14">
        <p className="mb-2 text-xs font-black tracking-[.16em] text-[#39725e]">私隱政策 · PRIVACY</p>
        <h1 className="text-3xl font-black tracking-tight text-[#203640] md:text-4xl">你的資料，我們怎樣處理。</h1>
        <p className="mt-4 text-sm leading-7 text-[#758185]">
          本頁說明「3rd Scout Troop Availability」如何按照香港《個人資料（私隱）條例》處理你所提供的資料。
        </p>
        <div className="mt-9 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-[#d9cfbd] bg-[#fbf8ef] p-5" data-testid={`card-privacy-${section.title}`}>
              <h2 className="flex items-center gap-2.5 font-black text-[#203640]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eee8da] text-[#39725e]"><section.icon size={18} /></span>
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#536468]">{section.body}</p>
            </section>
          ))}
          <section className="rounded-2xl border border-[#d9cfbd] bg-[#eee8da]/60 p-5" data-testid="card-privacy-rights">
            <h2 className="font-black text-[#203640]">查閱、更正及刪除</h2>
            <p className="mt-3 text-sm leading-7 text-[#536468]">
              你有權查閱及更正你的個人資料，亦可要求刪除。請直接聯絡領隊團隊提出，我們會盡快處理。
            </p>
          </section>
        </div>
        <p className="mt-10 font-mono text-[10px] tracking-[.15em] text-[#9a9b93]">EST. 2014 · THIRD SCOUT TROOP · 最後更新：2026 年 8 月</p>
      </main>
    </div>
  );
}
