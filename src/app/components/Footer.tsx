export function Footer() {
  const logo = new URL('../../imports/liemresearch-logo.png', import.meta.url).href;

  return (
    <footer className="mt-6 bg-transparent text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <img src={logo} alt="LiemResearch" className="h-8 w-auto" />
              <p className="text-sm font-semibold text-foreground">LiemResearch</p>
            </div>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Dự án phi lợi nhuận vì mục tiêu bình đẳng hóa quyền truy cập tri thức khoa học tại Việt Nam.
            </p>
          </div>

          <div className="flex items-start justify-end">
            <nav className="flex gap-6 text-sm uppercase tracking-[0.18em]">
              <a href="/" className="text-muted-foreground hover:text-foreground">Khám phá</a>
              <a href="/request-paper" className="text-muted-foreground hover:text-foreground">Request</a>
              <a href="/rankings" className="text-muted-foreground hover:text-foreground">Ranking</a>
            </nav>
          </div>
        </div>

        <div className="mt-6 border-t border-border/60 pt-5">
          <p className="text-xs">© 2026 LiemResearch Community · Designed for open science</p>
        </div>
      </div>
    </footer>
  );
}
