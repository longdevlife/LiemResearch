import { useNavigate } from 'react-router';

export function Footer() {
  const logo = new URL('../../imports/liemresearch-logo.png', import.meta.url).href;
  const navigate = useNavigate();

  return (
    <footer className="bg-[#1a1614] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-6 md:py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-block h-3 w-3 rounded-full bg-[#b5aea6]" />
              </div>
              <span className="text-sm font-bold tracking-wide text-white">LiemResearch</span>
            </div>
            <p className="mt-4 max-w-[220px] text-xs leading-6 text-[#8f8780]">
              A non-profit project to democratize access to scientific knowledge in Vietnam.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#5a544f]">Explore</p>
              <nav className="mt-4 space-y-3">
                <a href="/" className="block text-sm text-[#8f8780] transition-colors hover:text-white">Papers</a>
                <a href="/request-paper" className="block text-sm text-[#8f8780] transition-colors hover:text-white">Requests</a>
                <a href="/rankings" className="block text-sm text-[#8f8780] transition-colors hover:text-white">Rankings</a>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#5a544f]">Contribute</p>
              <nav className="mt-4 space-y-3">
                <a href="/request-paper?mode=contribute" className="block text-sm text-[#8f8780] transition-colors hover:text-white">Upload PDF</a>
                <button type="button" onClick={() => navigate('/login')} className="block text-left text-sm text-[#8f8780] transition-colors hover:text-white">Sign in</button>
                <button type="button" onClick={() => navigate('/register')} className="block text-left text-sm text-[#8f8780] transition-colors hover:text-white">Profile</button>
              </nav>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#5a544f]">Contact</p>
              <nav className="mt-4 space-y-3">
                <p className="text-sm text-[#8f8780]">Hanoi · Vietnam</p>
                <p className="text-sm text-[#8f8780]">Open Science Initiative</p>
                <p className="text-sm text-[#8f8780]">MMXXVI</p>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#5a544f] sm:flex-row sm:items-center">
          <span>© 2026 LiemResearch Community</span>
          <span>Designed for open science · Made with ♥ in Vietnam</span>
        </div>
      </div>
    </footer>
  );
}
