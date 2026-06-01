interface SubNavbarItem {
  label: string;
  value: string;
}

interface SubNavbarProps {
  items: SubNavbarItem[];
  activeValue: string;
  onSelect: (value: string) => void;
  title?: string;
}

export function SubNavbar({ items, activeValue, onSelect, title }: SubNavbarProps) {
  return (
    <div className="border-b border-[#dfd4c7] bg-[#fffaf4]">
      <div className="px-8 py-0">
        {title && <p className="mb-3 pt-4 text-sm text-[#7d6d60]">{title}</p>}
        <div className="flex gap-1 flex-wrap pb-4">
          {items.map((item) => {
            const isActive = activeValue === item.value;

            return (
              <button
                key={item.value}
                onClick={() => onSelect(item.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                  isActive
                    ? 'bg-[#2f251f] text-[#fffaf4] shadow-sm'
                    : 'bg-[#f4ebe1] text-[#7b5b3a] hover:bg-[#ead9c7] hover:text-[#5e4630]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
