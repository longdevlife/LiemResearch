import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { AppHeader } from '../components/AppHeader';
import {
  Award,
  ChevronDown,
  FileText,
  Medal,
  MinusCircle,
  PlusCircle,
  ShieldCheck,
  Star,
  Trophy,
  Upload,
} from 'lucide-react';
import { apiRequest, AuthUser, getStoredUser } from '../lib/api';

interface UserRank {
  rank: number;
  user: AuthUser;
  uploadedPapers: number;
  uploadedPdfs: number;
  ratingsGiven: number;
  rejectedPapers: number;
  rejectedPdfs: number;
  penaltyPoints?: number;
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
    title: 'Approved Paper',
    icon: FileText,
    earn: '+50 points',
    lose: '-10 if rejected',
    description: 'Paper requests add points after admin approval. Rejected papers reduce the score lightly.',
  },
  {
    id: 'pdf',
    title: 'Valid PDF Upload',
    icon: Upload,
    earn: '+50 points',
    lose: '-10 if rejected',
    description: 'PDF uploads count when accepted as a valid file for the paper.',
  },
  {
    id: 'rating',
    title: 'Paper Rating',
    icon: Star,
    earn: '+5 points',
    lose: 'No penalty',
    description: 'Every helpful rating contributes to the research community score.',
  },
];

export function UserRankingPage() {
  const [rankings, setRankings] = useState<UserRank[]>([]);
  const [openRule, setOpenRule] = useState<RuleId | null>('paper');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRankings() {
      setIsLoading(true);
      setError('');

      try {
        const data = await apiRequest<{ rankings: UserRank[] }>('/rankings/top', { auth: true });
        if (isMounted) setRankings(data.rankings);
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
  }, []);

  const currentUser = getStoredUser();
  const currentRank = rankings.find((item) => item.user._id === currentUser?._id);
  const topThree = rankings.slice(0, 3);
  const totalPoints = useMemo(() => rankings.reduce((sum, item) => sum + item.points, 0), [rankings]);
  const totalContributors = rankings.length;

  return (
    <div className="flex min-h-screen bg-surface-achievement bg-fixed">
      <Sidebar role="user" />

      <div className="flex-1">
        <AppHeader role="user" />
        <div className="p-8">
          <div className="mx-auto max-w-6xl">
          <section className="mb-8 overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div className="bg-blue-600 px-8 py-8 text-white">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1 text-sm font-medium">
                    <Trophy size={16} />
                    Community leaderboard
                  </div>
                  <h1 className="text-3xl font-semibold">User Rankings</h1>
                  <p className="mt-2 max-w-2xl text-blue-50">
                    Contributors ranked by approved papers, accepted PDFs, useful ratings, and small penalties for rejected work.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <HeroMetric label="Contributors" value={totalContributors} />
                  <HeroMetric label="Total Points" value={totalPoints} />
                  <HeroMetric label="Your Rank" value={currentRank ? `#${currentRank.rank}` : 'N/A'} />
                </div>
              </div>
            </div>
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
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
              <main className="space-y-6">
                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {topThree.map((item) => (
                    <TopContributorCard key={item.user._id} item={item} isCurrentUser={item.user._id === currentUser?._id} />
                  ))}
                </section>

                <section className="rounded-lg border border-border bg-white shadow-sm">
                  <div className="border-b border-border px-6 py-5">
                    <h3 className="text-foreground">Leaderboard</h3>
                    <p className="mt-1 text-muted-foreground">Score breakdown is shown beside each contributor.</p>
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

function HeroMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-white/15 px-4 py-3">
      <p className="text-sm text-blue-50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TopContributorCard({ item, isCurrentUser }: { item: UserRank; isCurrentUser: boolean }) {
  const rankStyles = {
    1: 'border-yellow-300 bg-yellow-50',
    2: 'border-gray-300 bg-gray-50',
    3: 'border-amber-300 bg-amber-50',
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

      <div className="mb-4 rounded-lg bg-white p-4">
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
  const positivePoints = item.uploadedPapers * 50 + item.uploadedPdfs * 50 + item.ratingsGiven * 5;
  const negativePoints = item.rejectedPapers * 10 + item.rejectedPdfs * 10 + (item.penaltyPoints || 0);

  return (
    <div className={`grid grid-cols-1 gap-4 px-6 py-5 transition-colors lg:grid-cols-[72px_1fr_220px_100px] lg:items-center ${
      isCurrentUser ? 'bg-blue-50' : 'hover:bg-accent'
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
        <p className="text-sm text-muted-foreground">ID: {item.user.studentId}</p>
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
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Rank</p>
          <p className="text-2xl font-semibold text-foreground">#{item.rank}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">Points</p>
          <p className="text-2xl font-semibold text-foreground">{item.points}</p>
        </div>
      </div>
    </section>
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
    <div className="rounded-lg bg-white/70 p-3">
      <div className="mb-1 flex items-center gap-1 text-muted-foreground">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
