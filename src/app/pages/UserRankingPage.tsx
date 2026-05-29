import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import {
  Award,
  ChevronDown,
  Crown,
  FileText,
  Medal,
  MinusCircle,
  PlusCircle,
  ShieldCheck,
  Star,
  Trophy,
  HelpCircle,
  Upload,
} from 'lucide-react';
import { apiRequest, AuthUser, getStoredUser } from '../lib/api';
import { calculateCurrentRank, RANK_LEVELS } from '../lib/userRanking';
import { getRankImage } from '../lib/rankVisuals';

interface UserRank {
  rank: number;
  user: AuthUser;
  uploadedPapers: number;
  uploadedPdfs: number;
  ratingsGiven: number;
  rejectedPapers: number;
  rejectedPdfs: number;
  penaltyPoints?: number;
  uploadCreditReward?: number;
  points: number;
}

type RuleId = 'paper' | 'pdf' | 'rating';

const pointRules: Array<{
  id: RuleId;
  title: string;
  icon: typeof FileText;
  earn: string;
  lose: string;
  description: string;
}> = [
  {
    id: 'paper',
    title: 'Request new paper',
    icon: FileText,
    earn: '-100 credits',
    lose: 'Charged on submit',
    description: 'New requests cost credits because the system or admin needs to process them.',
  },
  {
    id: 'pdf',
    title: 'Accepted PDF upload',
    icon: Upload,
    earn: '+100 to +300 credits',
    lose: 'No rank drop on download',
    description: 'Upload rewards depend on paper quality tier after the PDF is accepted.',
  },
  {
    id: 'rating',
    title: 'Paper Rating',
    icon: Star,
    earn: '+5 points',
    lose: 'No penalty',
    description: 'Every helpful rating contributes a small amount to the research community score.',
  },
];

export function UserRankingPage() {
  const [rankings, setRankings] = useState<UserRank[]>([]);
  const [currentRank, setCurrentRank] = useState<UserRank | null>(null);
  const [openRule, setOpenRule] = useState<RuleId | null>('paper');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContributors, setTotalContributors] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRankings() {
      setIsLoading(true);
      setError('');

      try {
        const [topData, myData] = await Promise.all([
          apiRequest<{ rankings: UserRank[]; pagination?: { total?: number; totalPages?: number } }>(
            `/rankings/top?page=${page}&limit=10`,
            { auth: true }
          ),
          apiRequest<{ ranking: UserRank }>('/rankings/me', { auth: true }).catch(() => ({ ranking: null })),
        ]);

        if (isMounted) {
          setRankings(topData.rankings);
          setTotalContributors(topData.pagination?.total ?? topData.rankings.length);
          setTotalPages(topData.pagination?.totalPages ?? 1);
          setCurrentRank(myData.ranking ?? null);
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Unable to load rankings');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRankings();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const currentUser = getStoredUser();
  const topThree = rankings.slice(0, 3);
  const totalPoints = useMemo(() => rankings.reduce((sum, item) => sum + item.points, 0), [rankings]);
  const currentAcademicRank = currentRank ? calculateCurrentRank(currentRank.points, currentRank.uploadedPapers) : null;
  const [showRankInfo, setShowRankInfo] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowRankInfo(false);
    }

    if (showRankInfo) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showRankInfo]);

  return (
    <div className="flex min-h-screen bg-surface-achievement bg-fixed">
      <Sidebar role="user" />

      <div className="flex-1">
        <AppHeader role="user" />
        <div className="p-8">
          <div className="mx-auto max-w-7xl">
          <section className="mb-8">
            <div className="rounded-lg border border-border bg-white px-8 py-8 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    <Trophy size={16} />
                    Community leaderboard
                  </div>
                  <h1 className="text-3xl font-semibold text-foreground">User Rankings</h1>
                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    Track the strongest contributors by approved papers, accepted PDFs, useful ratings, and review quality.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <HeroMetric label="Contributors" value={totalContributors} icon={Award} tone="blue" />
                  <HeroMetric label="Page Points" value={totalPoints} icon={Trophy} tone="emerald" />
                  <HeroMetric
                    label="Your Rank"
                    icon={ShieldCheck}
                    tone="amber"
                    value={currentRank && currentAcademicRank ? `#${currentRank.rank} / Lv. ${currentAcademicRank.level}` : 'N/A'}
                  />
                </div>
              </div>
            </div>
            <div className="absolute right-4 top-4 z-40">
              <button
                type="button"
                onClick={() => setShowRankInfo((s) => !s)}
                aria-label="Thông tin các cấp rank"
                className="inline-flex items-center justify-center rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            {showRankInfo && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setShowRankInfo(false)}
                />

                <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Cấp bậc (Levels)</h2>
                    <button
                      type="button"
                      onClick={() => setShowRankInfo(false)}
                      className="rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="mt-4 overflow-auto">
                    <div className="grid grid-cols-12 gap-3 items-center font-medium text-sm text-muted-foreground">
                      <div className="col-span-1">&nbsp;</div>
                      <div className="col-span-1">Level</div>
                      <div className="col-span-6">Name</div>
                      <div className="col-span-2 text-right">Min Points</div>
                      <div className="col-span-2 text-right">Min Papers</div>
                    </div>
                    <div className="mt-2 space-y-2">
                      {RANK_LEVELS.map((lvl) => (
                        <div key={lvl.level} className="grid grid-cols-12 items-center rounded-md border border-border/40 bg-muted/30 p-2">
                          <div className="col-span-1">
                            <img src={getRankImage(lvl.level)} alt={lvl.name} className="h-8 w-8 object-contain" />
                          </div>
                          <div className="col-span-1 font-semibold">Lv. {lvl.level}</div>
                          <div className="col-span-6 truncate">{lvl.name}</div>
                          <div className="col-span-2 text-right font-medium">{lvl.minPoints.toLocaleString()}</div>
                          <div className="col-span-2 text-right">{lvl.minPapers}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">Người dùng phải thỏa cả hai điều kiện điểm và số bài để đạt cấp tương ứng.</p>
                </div>
              </div>
            )}
          </section>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="rounded-lg border border-border bg-white p-12 text-center shadow-sm">
              <p className="text-muted-foreground">Loading rankings...</p>
            </div>
          )}

          {!isLoading && rankings.length > 0 && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <main className="space-y-6">
                <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-foreground">Top Contributors</h3>
                      <p className="mt-1 text-sm text-muted-foreground">The current page's highest ranked contributors.</p>
                    </div>
                    <Crown size={24} className="text-amber-500" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {topThree.map((item) => (
                      <TopContributorCard key={item.user._id} item={item} isCurrentUser={item.user._id === currentUser?._id} />
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-white shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-foreground">Leaderboard</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Score breakdown is shown beside each contributor.</p>
                    </div>
                    <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                      {rankings.length} shown
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {rankings.map((item) => (
                      <LeaderboardRow
                        key={item.user._id}
                        item={item}
                        isCurrentUser={item.user._id === currentUser?._id}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
                      <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                          disabled={page === 1 || isLoading}
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                          disabled={page === totalPages || isLoading}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </main>

              <aside className="space-y-6">
                {currentRank && <MyRankCard item={currentRank} />}

                <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-primary" />
                    <h3 className="text-foreground">Point Rules</h3>
                  </div>

                  <div className="space-y-3">
                    {pointRules.map((rule) => (
                      <RuleAccordion
                        key={rule.id}
                        rule={rule}
                        isOpen={openRule === rule.id}
                        onToggle={() => setOpenRule(openRule === rule.id ? null : rule.id)}
                      />
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          )}

          {!isLoading && rankings.length === 0 && (
            <div className="rounded-lg border border-border bg-white p-12 text-center shadow-sm">
              <Trophy size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-foreground">No rankings yet</h3>
              <p className="text-muted-foreground">Rankings will appear after valid uploads or ratings.</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value: number | string;
  tone: 'blue' | 'emerald' | 'amber';
}) {
  const toneStyles = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneStyles[tone]}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={18} />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function TopContributorCard({ item, isCurrentUser }: { item: UserRank; isCurrentUser: boolean }) {
  const academicRank = calculateCurrentRank(item.points, item.uploadedPapers);
  const rankStyles = {
    1: 'border-amber-300 bg-amber-50',
    2: 'border-slate-300 bg-slate-50',
    3: 'border-orange-300 bg-orange-50',
  };

  return (
    <article className={`rounded-lg border-2 p-5 shadow-sm ${rankStyles[item.rank as 1 | 2 | 3] || 'border-border bg-white'}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <RankIcon rank={item.rank} />
          <div>
            <p className="font-semibold text-foreground">{item.user.fullName}</p>
            <p className="text-sm text-muted-foreground">{item.user.university}</p>
          </div>
        </div>
        {isCurrentUser && (
          <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">You</span>
        )}
      </div>

      <AcademicRankBadge rank={academicRank} className="mb-4" />

      <div className="mb-4 border-y border-current/10 py-4">
        <p className="text-sm text-muted-foreground">Total score</p>
        <p className="text-3xl font-semibold text-foreground">{item.points}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <MiniStat icon={FileText} value={item.uploadedPapers} label="Papers" />
        <MiniStat icon={Upload} value={item.uploadedPdfs} label="PDFs" />
        <MiniStat icon={Star} value={item.ratingsGiven} label="Ratings" />
      </div>
    </article>
  );
}

function LeaderboardRow({ item, isCurrentUser }: { item: UserRank; isCurrentUser: boolean }) {
  const academicRank = calculateCurrentRank(item.points, item.uploadedPapers);
  const positivePoints = (item.uploadCreditReward || 0) + item.ratingsGiven * 5;
  const negativePoints = item.penaltyPoints || 0;

  return (
    <div className={`grid grid-cols-1 gap-4 px-6 py-5 transition-colors lg:grid-cols-[72px_minmax(0,1fr)_240px_120px] lg:items-center ${
      isCurrentUser ? 'bg-blue-50/70' : 'hover:bg-accent'
    }`}>
      <div className="flex items-center gap-3">
        <RankIcon rank={item.rank} compact />
        <span className="font-semibold text-foreground">#{item.rank}</span>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{item.user.fullName}</p>
          {isCurrentUser && <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">You</span>}
        </div>
        <p className="truncate text-sm text-muted-foreground">{item.user.university}</p>
        <div className="mt-2">
          <AcademicRankBadge rank={academicRank} compact />
        </div>
        {/* Student ID removed from ranking display */}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon={FileText} value={item.uploadedPapers} label="Papers" />
        <MiniStat icon={Upload} value={item.uploadedPdfs} label="PDFs" />
        <MiniStat icon={Star} value={item.ratingsGiven} label="Ratings" />
      </div>

      <div className="text-left lg:text-right">
        <p className="text-2xl font-semibold text-foreground">{item.points}</p>
        <div className="mt-1 flex gap-2 text-xs lg:justify-end">
          <span className="text-green-700">+{positivePoints}</span>
          <span className="text-red-700">-{negativePoints}</span>
        </div>
      </div>
    </div>
  );
}

function MyRankCard({ item }: { item: UserRank }) {
  const academicRank = calculateCurrentRank(item.points, item.uploadedPapers);

  return (
    <section className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-primary">
          <Trophy size={22} />
        </div>
        <div>
          <h3 className="text-foreground">Your Position</h3>
          <p className="text-sm text-muted-foreground">Current leaderboard standing</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Rank</p>
          <p className="text-2xl font-semibold text-foreground">#{item.rank}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">Points</p>
          <p className="text-2xl font-semibold text-foreground">{item.points}</p>
        </div>
      </div>

      <div className="mt-4">
        <AcademicRankBadge rank={academicRank} />
      </div>
    </section>
  );
}

function AcademicRankBadge({
  rank,
  compact = false,
  className = '',
}: {
  rank: ReturnType<typeof calculateCurrentRank>;
  compact?: boolean;
  className?: string;
}) {
  const image = getRankImage(rank.level);

  return (
    <div
      className={`inline-flex w-fit max-w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900 shadow-sm ${className}`}
    >
      <img
        src={image}
        alt={rank.name}
        className={compact ? 'h-9 w-9 object-contain' : 'h-12 w-12 object-contain'}
      />
      <div className="min-w-0">
        <p className={compact ? 'text-xs font-semibold leading-4' : 'text-sm font-semibold leading-5'}>
          Lv. {rank.level} · {rank.name}
        </p>
      </div>
    </div>
  );
}

function RuleAccordion({
  rule,
  isOpen,
  onToggle,
}: {
  rule: (typeof pointRules)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = rule.icon;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-3 font-medium text-foreground">
          <Icon size={18} className="text-primary" />
          {rule.title}
        </span>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="border-t border-border bg-muted/40 p-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-green-700">
                <PlusCircle size={18} />
                <span className="font-semibold">{rule.earn}</span>
              </div>
              <p className="text-sm text-green-800">Earned when the contribution is accepted.</p>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-red-700">
                <MinusCircle size={18} />
                <span className="font-semibold">{rule.lose}</span>
              </div>
              <p className="text-sm text-red-800">{rule.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RankIcon({ rank, compact }: { rank: number; compact?: boolean }) {
  const size = compact ? 20 : 28;

  if (rank === 1) return <Trophy size={size} className="text-yellow-500" />;
  if (rank === 2) return <Medal size={size} className="text-gray-400" />;
  if (rank === 3) return <Award size={size} className="text-amber-700" />;

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FileText;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-white/60 p-3">
      <div className="mb-1 flex items-center gap-1 text-muted-foreground">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
