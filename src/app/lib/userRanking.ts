export interface RankConfig {
  level: number;
  name: string;
  minPoints: number;
  minPapers: number;
}

export const RANK_LEVELS: RankConfig[] = [
  { level: 1, name: 'Tân Khoa Sĩ', minPoints: 0, minPapers: 0 },
  { level: 2, name: 'Tầm Kinh Sĩ', minPoints: 500, minPapers: 5 },
  { level: 3, name: 'Luận Văn Khách', minPoints: 1500, minPapers: 15 },
  { level: 4, name: 'Trích Dẫn Sư', minPoints: 3500, minPapers: 35 },
  { level: 5, name: 'Tàng Thư Sĩ', minPoints: 7000, minPapers: 70 },
  { level: 6, name: 'Tri Thức Hiệp', minPoints: 12000, minPapers: 120 },
  { level: 7, name: 'Học Thuật Tướng', minPoints: 20000, minPapers: 200 },
  { level: 8, name: 'Tri Thức Vương', minPoints: 35000, minPapers: 350 },
  { level: 9, name: 'Khoa Đạo Đế', minPoints: 60000, minPapers: 600 },
  { level: 10, name: 'Luận Đạo Thần', minPoints: 100000, minPapers: 1000 },
];

export const calculateCurrentRank = (lifetimePoints: number, totalApprovedPapers: number): RankConfig => {
  for (let index = RANK_LEVELS.length - 1; index >= 0; index -= 1) {
    const rank = RANK_LEVELS[index];

    if (lifetimePoints >= rank.minPoints && totalApprovedPapers >= rank.minPapers) {
      return rank;
    }
  }

  return RANK_LEVELS[0];
};