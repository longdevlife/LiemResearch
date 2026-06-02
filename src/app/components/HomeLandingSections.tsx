import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, ArrowUpRight, BadgeCheck, ChevronDown, Clock3, Mail, TrendingUp } from 'lucide-react';
import { apiRequest, AuthUser, getStoredUser } from '../lib/api';
import { PublicPaper } from '../lib/papers';
import { calculateCurrentRank } from '../lib/userRanking';

type RankingEntry = {
  rank: number;
  user: AuthUser;
  points: number;
  uploadedPapers: number;
  uploadedPdfs: number;
  ratingsGiven: number;
};

function getContributorHighlight(entry: RankingEntry) {
  const academicRank = calculateCurrentRank(entry.points, entry.uploadedPapers);

  if (entry.rank === 1) {
    return {
      quote:
        entry.uploadedPdfs > 0
          ? `Leading the community with ${entry.uploadedPdfs} shared PDF${entry.uploadedPdfs === 1 ? '' : 's'} and ${entry.points.toLocaleString()} reputation points.`
          : `Currently #1 on the LiemResearch leaderboard with ${entry.points.toLocaleString()} reputation points.`,
      tag: `Rank #1 · ${entry.points.toLocaleString()} pts`,
    };
  }

  if (entry.uploadedPdfs > 0) {
    return {
      quote: `A valued contributor who has shared ${entry.uploadedPdfs} PDF${entry.uploadedPdfs === 1 ? '' : 's'} with researchers who need open access.`,
      tag: `${entry.uploadedPdfs} PDF${entry.uploadedPdfs === 1 ? '' : 's'} shared`,
    };
  }

  if (entry.uploadedPapers > 0) {
    return {
      quote: `An active member who has submitted ${entry.uploadedPapers} paper request${entry.uploadedPapers === 1 ? '' : 's'} to grow the shared library.`,
      tag: `${entry.uploadedPapers} paper${entry.uploadedPapers === 1 ? '' : 's'} requested`,
    };
  }

  if (entry.ratingsGiven > 0) {
    return {
      quote: `Helping the community evaluate research quality through ${entry.ratingsGiven} rating${entry.ratingsGiven === 1 ? '' : 's'}.`,
      tag: `${entry.ratingsGiven} rating${entry.ratingsGiven === 1 ? '' : 's'} given`,
    };
  }

  return {
    quote: `Recognized as a ${academicRank.name} while building a reputation score of ${entry.points.toLocaleString()} points.`,
    tag: `${entry.points.toLocaleString()} reputation points`,
  };
}

const processSteps = [
  {
    number: '01',
    title: 'SUBMIT REQUEST',
    description:
      'Paste a DOI, link, or paper title. The system checks for duplicates and extracts metadata automatically.',
  },
  {
    number: '02',
    title: 'COMMUNITY SUPPORT',
    description: 'Members with access upload PDFs. Each approved contribution earns reputation points.',
  },
  {
    number: '03',
    title: 'OPEN FOREVER',
    description: 'Materials stay public, free, and searchable — for everyone.',
  },
];

const featuredJournals = [
  { number: '01', name: 'Nature' },
  { number: '02', name: 'Science' },
  { number: '03', name: 'The Lancet' },
  { number: '04', name: 'Cell' },
  { number: '05', name: 'PNAS' },
  { number: '06', name: 'IEEE' },
];

const faqItems = [
  {
    question: 'Is LiemResearch free?',
    answer:
      'Yes. Browsing is public. To download PDFs and contribute, you need an account so we can protect the community from abuse and track contribution credits.',
  },
  {
    question: 'How do I request a paper?',
    answer:
      'Go to “Request Paper” and paste the DOI, a link, or the title. We’ll validate the metadata and queue it for community support or admin review.',
  },
  {
    question: 'Are uploads moderated?',
    answer:
      'Yes. Contributions go through review to ensure the file matches the request, is readable, and doesn’t violate platform rules.',
  },
  {
    question: 'What are reputation points used for?',
    answer:
      'They represent contribution value (uploads, ratings, and other activity). Points help highlight trusted members and can unlock higher community privileges over time.',
  },
  {
    question: 'Can I upload a PDF directly?',
    answer:
      'Yes. If you have access to a paper, you can upload a PDF through the request flow. Once accepted, it becomes available to others.',
  },
] as const;

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#9a9086]">
      <span className="text-[#7d746a]">§</span> {children}
    </p>
  );
}

function SectionLink({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1f1a17] transition-opacity hover:opacity-70"
    >
      {children}
    </button>
  );
}

export function HomeLandingSections() {
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const [pendingPapers, setPendingPapers] = useState<PublicPaper[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSections() {
      setIsLoadingPending(true);
      setIsLoadingRankings(true);

      try {
        const [papersData, rankingsData] = await Promise.all([
          apiRequest<{ papers: PublicPaper[] }>('/public-papers?hasPdf=false&limit=5&sortBy=newest'),
          apiRequest<{ rankings: RankingEntry[] }>('/rankings/top?page=1&limit=5'),
        ]);

        if (isMounted) {
          setPendingPapers(papersData.papers);
          setRankings(rankingsData.rankings);
        }
      } catch {
        if (isMounted) {
          setPendingPapers([]);
          setRankings([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingPending(false);
          setIsLoadingRankings(false);
        }
      }
    }

    loadSections();

    return () => {
      isMounted = false;
    };
  }, []);

  const topContributors = rankings.slice(0, 3);

  const goToRequest = () => navigate(currentUser ? '/request-paper' : '/login');
  const goToRankings = () => navigate(currentUser ? '/rankings' : '/login');
  const goToPaper = (paperId: string) => {
    if (currentUser) {
      navigate(`/paper/${paperId}`);
      return;
    }
    navigate('/login');
  };

  return (
    <>
      <section className="bg-[#1a1614] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-20 lg:py-24">
          <div>
            <SectionLabel>02 — PROCESS</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">Three steps.</h2>
            <p className="mt-1 text-4xl font-semibold italic text-[#8f8780] md:text-5xl lg:text-6xl">Nothing more.</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {processSteps.map((step) => (
              <div key={step.number}>
                <p className="text-sm font-medium text-[#8f8780]">{step.number}</p>
                <h3 className="mt-3 text-sm font-bold tracking-wide">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#b5aea6]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5e0d8] bg-[#f5f3f0]">
        <div className="mx-auto grid max-w-7xl md:grid-cols-2">
          <div className="border-b border-[#e5e0d8] px-5 py-10 md:border-b-0 md:border-r md:px-8 md:py-12 lg:px-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel>03 — OPEN</SectionLabel>
                <h2 className="mt-3 text-3xl font-semibold text-[#1f1a17] md:text-4xl">Waiting for support</h2>
              </div>
              <SectionLink onClick={goToRequest}>+ New request</SectionLink>
            </div>
            <div className="mt-6 border-t border-[#e5e0d8]" />

            <div className="mt-6 min-h-[120px]">
              {isLoadingPending && <p className="text-sm text-[#7d746a]">Loading...</p>}
              {!isLoadingPending && pendingPapers.length === 0 && (
                <p className="text-sm text-[#7d746a]">No requests are waiting right now.</p>
              )}
              {!isLoadingPending && pendingPapers.length > 0 && (
                <ul className="space-y-4">
                  {pendingPapers.map((paper) => (
                    <li key={paper._id}>
                      <button
                        type="button"
                        onClick={() => goToPaper(paper._id)}
                        className="group w-full text-left"
                      >
                        <p className="font-medium text-[#1f1a17] transition-colors group-hover:text-[#6f5438]">
                          {paper.title}
                        </p>
                        {paper.publishedYear ? (
                          <p className="mt-1 text-xs text-[#7d746a]">{paper.publishedYear}</p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="px-5 py-10 md:px-8 md:py-12 lg:px-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionLabel>04 — RECOGNITION</SectionLabel>
                <h2 className="mt-3 text-3xl font-semibold text-[#1f1a17] md:text-4xl">Top contributors</h2>
              </div>
              <SectionLink onClick={goToRankings}>View all →</SectionLink>
            </div>
            <div className="mt-6 border-t border-[#e5e0d8]" />

            <div className="mt-6 min-h-[120px]">
              {isLoadingRankings && <p className="text-sm text-[#7d746a]">Loading...</p>}
              {!isLoadingRankings && rankings.length === 0 && (
                <p className="text-sm text-[#7d746a]">No contributors yet.</p>
              )}
              {!isLoadingRankings && rankings.length > 0 && (
                <ul className="space-y-4">
                  {rankings.map((item) => (
                    <li key={item.user._id} className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <span className="mr-3 text-sm font-medium text-[#9a9086]">
                          {String(item.rank).padStart(2, '0')}
                        </span>
                        <span className="font-medium text-[#1f1a17]">{item.user.fullName}</span>
                      </div>
                      <span className="shrink-0 text-sm text-[#7d746a]">{item.points} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5e0d8] bg-[#f5f3f0] pb-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-5 md:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4 py-10 md:py-12">
            <div>
              <SectionLabel>05 — FIELDS</SectionLabel>
              <h2 className="mt-3 text-3xl font-semibold text-[#1f1a17] md:text-4xl">Featured journals</h2>
            </div>
            <SectionLink onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>View all →</SectionLink>
          </div>

          <div className="border-t border-[#e5e0d8]" />

          <div className="grid sm:grid-cols-3">
            {featuredJournals.map((journal, index) => {
              const isLastColumn = (index + 1) % 3 === 0;
              const isTopRow = index < 3;

              return (
                <div
                  key={journal.number}
                  className={`relative flex min-h-[140px] flex-col justify-between p-6 md:min-h-[160px] md:p-8 ${
                    !isLastColumn ? 'sm:border-r sm:border-[#e5e0d8]' : ''
                  } ${!isTopRow ? 'border-t border-[#e5e0d8] sm:border-t-0' : ''} ${
                    isTopRow ? 'border-b border-[#e5e0d8] sm:border-b-0' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium text-[#9a9086]">{journal.number}</span>
                    <ArrowUpRight size={18} className="text-[#c4bbb0]" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#1f1a17] md:text-2xl">{journal.name}</p>
                    <p className="mt-2 text-sm text-[#7d746a]">Coming soon</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5e0d8] bg-[#f5f3f0] py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-5 text-center md:px-6">
          <div className="relative">
            <span
              className="pointer-events-none absolute -left-2 top-0 select-none font-serif text-[7rem] leading-none text-[#e5e0d8] md:-left-6 md:text-[9rem]"
              aria-hidden
            >
              &ldquo;
            </span>
            <blockquote className="relative px-2 pt-6 md:px-8">
              <p className="text-2xl font-semibold leading-snug text-[#1f1a17] md:text-3xl lg:text-4xl">
                Knowledge should not be limited by{' '}
                <span className="font-serif font-normal italic text-[#9a9086]">paywalls</span>. It belongs to{' '}
                <span className="font-serif font-normal italic text-[#9a9086]">humanity.</span>
              </p>
            </blockquote>
          </div>
          <div className="mx-auto mt-10 max-w-xs border-t border-[#d8d0c4] pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9a9086]">LiemResearch mission</p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5e0d8] bg-[#f5f3f0] pb-20 md:pb-24">
        <div className="mx-auto max-w-7xl px-5 md:px-6 lg:px-8">
          <SectionLabel>06 — COMMUNITY</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold text-[#1f1a17] md:text-4xl lg:text-5xl">
            Member <span className="font-serif font-normal italic text-[#9a9086]">voices</span>
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6">
            {isLoadingRankings && (
              <p className="text-sm text-[#7d746a] md:col-span-3">Loading top members...</p>
            )}
            {!isLoadingRankings && topContributors.length === 0 && (
              <p className="text-sm text-[#7d746a] md:col-span-3">No ranked members yet.</p>
            )}
            {!isLoadingRankings &&
              topContributors.map((entry) => {
                const highlight = getContributorHighlight(entry);
                const affiliation = entry.user.university?.trim() || 'LiemResearch member';

                return (
                  <article
                    key={entry.user._id}
                    className="flex flex-col border border-[#e5e0d8] bg-white p-6 md:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-serif text-3xl leading-none text-[#d8d0c4]" aria-hidden>
                        &ldquo;
                      </span>
                      <span className="text-2xl font-medium text-[#e5e0d8]">
                        {String(entry.rank).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="mt-5 flex-1 text-sm leading-7 text-[#4a433c] md:text-[15px]">{highlight.quote}</p>
                    <div className="mt-8 border-t border-[#f0ebe3] pt-5">
                      <p className="font-semibold text-[#1f1a17]">{entry.user.fullName}</p>
                      <p className="mt-1 text-xs leading-5 text-[#7d746a]">{affiliation}</p>
                      <span className="mt-4 inline-block rounded-full border border-[#e5e0d8] bg-[#faf8f5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d746a]">
                        {highlight.tag}
                      </span>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </section>

      <section className="bg-[#1a1614] text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-2 md:gap-16 md:px-6 md:py-20 lg:py-24">
          <div>
            <SectionLabel>07 — GROWTH</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Growing.
            </h2>
            <p className="mt-1 text-4xl font-semibold italic text-[#8f8780] md:text-5xl lg:text-6xl">
              Getting stronger.
            </p>
            <p className="mt-6 max-w-md text-sm leading-7 text-[#b5aea6]">
              The number of shared papers grows month by month. The more members join, the stronger the community becomes.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex flex-1 items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#8f8780]">
                {['11', '12', '13', '14', '15', '16'].map((label) => (
                  <span key={label} className="flex-1 text-center">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[#b5aea6]">
                  <TrendingUp size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Growth</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">+340%</p>
                <p className="mt-1 text-xs text-[#8f8780]">MoM increase</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[#b5aea6]">
                  <Clock3 size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Availability</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">24/7</p>
                <p className="mt-1 text-xs text-[#8f8780]">Always on</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="flex items-center gap-2 text-[#b5aea6]">
                  <BadgeCheck size={16} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">Approval</span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">100%</p>
                <p className="mt-1 text-xs text-[#8f8780]">Reviewed uploads</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5e0d8] bg-[#f5f3f0] pb-20 pt-16 md:pb-24 md:pt-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-[340px_minmax(0,1fr)] md:gap-16 md:px-6 lg:px-8">
          <div>
            <SectionLabel>08 — FAQ</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#1f1a17] md:text-5xl">
              Frequently asked
              <span className="block font-serif font-normal italic text-[#9a9086]">questions</span>
            </h2>
          </div>

          <div className="border-t border-[#e5e0d8]">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={item.question} className="border-b border-[#e5e0d8]">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex((current) => (current === index ? null : index))}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-[#1f1a17] md:text-base">{item.question}</span>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e0d8] bg-white text-[#7d746a] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    >
                      <ChevronDown size={18} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-6 pr-12 text-sm leading-7 text-[#4a433c]">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* Newsletter */}
      <section className="border-t border-[#e5e0d8] bg-[#f5f3f0]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:gap-16 md:px-6 md:py-16 lg:px-8">
          <div>
            <SectionLabel>09 — UPDATE</SectionLabel>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-[#1f1a17] md:text-4xl">
              Get notified about{' '}
              <span className="font-serif font-normal italic text-[#9a9086]">new papers</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#7d746a]">
              Each week we send a short digest of newly contributed papers, open requests, and science highlights worth knowing about.
            </p>
          </div>

          <div>
            {newsletterSubmitted ? (
              <div className="rounded-2xl border border-[#d8d0c4] bg-white px-6 py-5">
                <p className="font-semibold text-[#1f1a17]">You're on the list!</p>
                <p className="mt-1 text-sm text-[#7d746a]">We'll reach out when new papers land.</p>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9086]"
                    />
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Your email"
                      className="w-full rounded-full border border-[#d8d0c4] bg-white py-3 pl-11 pr-4 text-sm text-[#1f1a17] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(122,111,97,0.12)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-[#1f1a17] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                  >
                    Subscribe
                  </button>
                </div>
                <p className="pl-2 text-xs text-[#9a9086]">No spam. Unsubscribe any time.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#e5e0d8] bg-[#f5f3f0] pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="mx-auto max-w-7xl px-5 md:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-end">
            <div>
              <h2 className="text-6xl font-black leading-none tracking-tight text-[#1f1a17] md:text-7xl lg:text-[88px]">
                Start
              </h2>
              <p className="text-6xl font-black italic leading-none tracking-tight text-[#c9c0b5] md:text-7xl lg:text-[88px]">
                contributing
              </p>
              <p className="text-6xl font-black leading-none tracking-tight text-[#1f1a17] md:text-7xl lg:text-[88px]">
                today.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <button
                type="button"
                onClick={() => navigate(currentUser ? '/request-paper' : '/register')}
                className="flex w-full items-center justify-between gap-3 rounded-full bg-[#1f1a17] px-6 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-85 md:max-w-xs"
              >
                <span>Join the community</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex w-full items-center justify-between gap-3 rounded-full border border-[#d8d0c4] bg-white px-6 py-4 text-sm font-semibold text-[#1f1a17] transition-colors hover:bg-[#f0ebe3] md:max-w-xs"
              >
                <span>Explore papers</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
