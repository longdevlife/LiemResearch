import React from 'react';
import { Crown, Trophy, Medal, Award, ChevronDown, Info, ShieldCheck, FileText, Upload, Star } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

import lv1 from '@/imports/lv1.png';
import lv2 from '@/imports/lv2.png';
import lv3 from '@/imports/lv3.png';
import lv4 from '@/imports/lv4.png';
import lv5 from '@/imports/lv5.png';
import lv6 from '@/imports/lv6.png';
import lv7 from '@/imports/lv7.png';
import lv8 from '@/imports/lv8.png';
import lv9 from '@/imports/lv9.png';
import lv10 from '@/imports/lv10.png';

const avatars: Record<number, string> = { 1: lv1, 2: lv2, 3: lv3, 4: lv4, 5: lv5, 6: lv6, 7: lv7, 8: lv8, 9: lv9, 10: lv10 };

const mockRankings = [
  { rank: 1, name: "Alice Nguyen", points: 15400, level: 10, papers: 145, ratings: 300, isMe: false, university: "MIT" },
  { rank: 2, name: "Bob Tran", points: 12200, level: 9, papers: 110, ratings: 250, isMe: false, university: "Stanford" },
  { rank: 3, name: "Charlie Le", points: 9800, level: 8, papers: 90, ratings: 180, isMe: false, university: "Harvard" },
  { rank: 4, name: "David Pham", points: 7500, level: 7, papers: 65, ratings: 120, isMe: false, university: "VNU HCM" },
  { rank: 5, name: "Minh Chánh", points: 6800, level: 6, papers: 50, ratings: 90, isMe: true, university: "UIT" },
  { rank: 6, name: "Eva Hoang", points: 4200, level: 5, papers: 35, ratings: 60, isMe: false, university: "Oxford" },
  { rank: 7, name: "Frank Vu", points: 2100, level: 4, papers: 20, ratings: 40, isMe: false, university: "Cambridge" },
];

export function RankingsPage() {
  const top3 = mockRankings.slice(0, 3);
  const rest = mockRankings.slice(3);
  const myRank = mockRankings.find(r => r.isMe);
  // slice()/index access is typed as possibly-undefined under
  // noUncheckedIndexedAccess — name the three podium spots and render the
  // podium only when all three exist.
  const [gold, silver, bronze] = top3;

  return (
    <div className="w-full">
      <PageHeader
        title="Leaderboard"
        description="Top contributors by approved papers, accepted PDFs, and useful ratings."
      />

      <div className="mt-8 flex flex-col xl:flex-row gap-8">
        
        {/* Main Content (Podium + Table) */}
        <div className="flex-1 min-w-0 space-y-12">
          
          {/* Podium (Top 3) */}
          <div className="relative">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" /> Bục Vinh Quang
            </h3>
            
            {gold && silver && bronze && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">

              {/* Rank 2 (Silver) */}
              <div className="bg-gradient-to-b from-slate-50 to-white dark:from-[#1a1c23] dark:to-[#121212] border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-6 relative flex flex-col items-center text-center shadow-lg transform transition-transform hover:-translate-y-2 order-2 md:order-1 h-[280px] justify-between">
                <div className="absolute -top-6 w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full border-4 border-white dark:border-[#121212] flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shadow-md">
                  #2
                </div>
                <div className="w-24 h-24 mb-4 mt-2">
                  <img src={avatars[silver.level]} alt={`Level ${silver.level}`} className="w-full h-full object-contain filter drop-shadow-md" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate w-full">{silver.name}</h4>
                  <p className="text-sm font-medium text-slate-500 mb-2">Lv. {silver.level} • {silver.university}</p>
                </div>
                <div className="w-full py-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                  <span className="font-black text-xl text-slate-800 dark:text-slate-200">{silver.points.toLocaleString()}</span> <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">pts</span>
                </div>
              </div>

              {/* Rank 1 (Gold) */}
              <div className="bg-gradient-to-b from-yellow-50 to-white dark:from-[#2a2410] dark:to-[#121212] border-2 border-yellow-400 dark:border-yellow-600 rounded-2xl p-6 relative flex flex-col items-center text-center shadow-[0_10px_40px_rgba(250,204,21,0.15)] dark:shadow-[0_10px_40px_rgba(250,204,21,0.05)] transform transition-transform hover:-translate-y-2 order-1 md:order-2 h-[320px] justify-between z-10">
                <div className="absolute -top-8 flex flex-col items-center">
                  <Crown className="w-8 h-8 text-yellow-500 mb-1 drop-shadow-sm" fill="currentColor" />
                  <div className="w-14 h-14 bg-yellow-400 dark:bg-yellow-500 rounded-full border-4 border-white dark:border-[#121212] flex items-center justify-center font-black text-white shadow-md text-xl">
                    #1
                  </div>
                </div>
                <div className="w-32 h-32 mb-4 mt-8">
                  <img src={avatars[gold.level]} alt={`Level ${gold.level}`} className="w-full h-full object-contain filter drop-shadow-lg" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 dark:text-white truncate w-full">{gold.name}</h4>
                  <p className="text-sm font-medium text-slate-500 mb-3">Lv. {gold.level} • {gold.university}</p>
                </div>
                <div className="w-full py-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
                  <span className="font-black text-2xl text-yellow-700 dark:text-yellow-500">{gold.points.toLocaleString()}</span> <span className="text-xs text-yellow-600 dark:text-yellow-600 uppercase tracking-wider font-bold">pts</span>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="bg-gradient-to-b from-orange-50 to-white dark:from-[#231a15] dark:to-[#121212] border-2 border-orange-300 dark:border-orange-800 rounded-2xl p-6 relative flex flex-col items-center text-center shadow-lg transform transition-transform hover:-translate-y-2 order-3 md:order-3 h-[260px] justify-between">
                <div className="absolute -top-6 w-12 h-12 bg-orange-200 dark:bg-orange-900/50 rounded-full border-4 border-white dark:border-[#121212] flex items-center justify-center font-bold text-orange-800 dark:text-orange-400 shadow-md">
                  #3
                </div>
                <div className="w-20 h-20 mb-4 mt-2">
                  <img src={avatars[bronze.level]} alt={`Level ${bronze.level}`} className="w-full h-full object-contain filter drop-shadow-md" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white truncate w-full">{bronze.name}</h4>
                  <p className="text-sm font-medium text-slate-500 mb-2">Lv. {bronze.level} • {bronze.university}</p>
                </div>
                <div className="w-full py-2 bg-orange-100/50 dark:bg-orange-900/20 rounded-lg">
                  <span className="font-black text-xl text-orange-800 dark:text-orange-500">{bronze.points.toLocaleString()}</span> <span className="text-xs text-orange-600 dark:text-orange-700 uppercase tracking-wider font-bold">pts</span>
                </div>
              </div>

            </div>
            )}
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Bảng Xếp Hạng</h3>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-semibold">
                {mockRankings.length} Users
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 dark:bg-[#181818] text-slate-500 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4 w-20 text-center">Hạng</th>
                    <th className="px-6 py-4">Người dùng</th>
                    <th className="px-6 py-4 text-center hidden sm:table-cell">Papers</th>
                    <th className="px-6 py-4 text-center hidden md:table-cell">Ratings</th>
                    <th className="px-6 py-4 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {rest.map((user) => (
                    <tr 
                      key={user.rank} 
                      className={`group transition-colors ${
                        user.isMe 
                          ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                          : 'hover:bg-slate-50/80 dark:hover:bg-[#1c1f26]'
                      }`}
                    >
                      <td className="px-6 py-5 text-center">
                        <span className="font-bold text-slate-400 dark:text-slate-600">#{user.rank}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 shrink-0">
                            <img src={avatars[user.level]} alt={`Lv ${user.level}`} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${user.isMe ? 'text-[#001b69] dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                {user.name}
                              </span>
                              {user.isMe && (
                                <span className="bg-[#001b69] text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">You</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium">Lv. {user.level} • {user.university}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center hidden sm:table-cell">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-semibold text-xs">
                          <FileText className="w-3.5 h-3.5" /> {user.papers}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center hidden md:table-cell">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-semibold text-xs">
                          <Star className="w-3.5 h-3.5" /> {user.ratings}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className={`font-black text-lg ${user.isMe ? 'text-[#001b69] dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {user.points.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full xl:w-[320px] shrink-0 space-y-6">
          
          {/* Your Position Card */}
          {myRank && (
            <div className="bg-gradient-to-br from-[#001b69] to-[#001040] dark:from-[#0f172a] dark:to-[#020617] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6 opacity-90">
                  <ShieldCheck className="w-5 h-5 text-blue-300" />
                  <h3 className="font-bold tracking-wide">Vị Trí Của Bạn</h3>
                </div>
                
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 bg-white/10 rounded-full p-2 border border-white/20">
                    <img src={avatars[myRank.level]} alt="My Level" className="w-full h-full object-contain filter drop-shadow-md" />
                  </div>
                  <div>
                    <div className="text-3xl font-black mb-1">#{myRank.rank}</div>
                    <div className="text-sm text-blue-200 font-medium">Lv. {myRank.level} • {myRank.points.toLocaleString()} pts</div>
                  </div>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <div className="text-xs text-blue-200 font-medium flex justify-between">
                  <span>Current: {myRank.points}</span>
                  <span>Next Lv: 7500</span>
                </div>
              </div>
            </div>
          )}

          {/* Point Rules */}
          <div className="bg-white dark:bg-[#1c1f26] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2 text-[15px]">
              <Info className="w-4 h-4 text-[#001b69] dark:text-blue-500" /> Cách Tính Điểm
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Upload PDF thành công</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium"><span className="text-emerald-600 dark:text-emerald-400 font-bold">+100</span> đến <span className="text-emerald-600 dark:text-emerald-400 font-bold">+300</span> điểm tùy chất lượng.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 dark:bg-blue-500/20 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Đánh giá (Rating)</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium"><span className="text-blue-600 dark:text-blue-400 font-bold">+5</span> điểm cho mỗi review hữu ích.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 opacity-70">
                <div className="bg-red-100 dark:bg-red-500/20 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Yêu cầu báo cáo mới</h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium"><span className="text-red-600 dark:text-red-400 font-bold">-100</span> điểm (trừ vào quỹ điểm của bạn).</p>
                </div>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
