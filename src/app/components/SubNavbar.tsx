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
    <div className="border-b border-border bg-white">
      <div className="px-8 py-0">
        {title && <p className="text-sm text-muted-foreground pt-4 mb-3">{title}</p>}
        <div className="flex gap-1 flex-wrap pb-4">
          {items.map((item) => {
            const isActive = activeValue === item.value;

            return (
              <button
                key={item.value}
                onClick={() => onSelect(item.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
