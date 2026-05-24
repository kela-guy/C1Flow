import {
  NAV,
  type NavGroup,
  type NavItem,
} from './navConfig';
import { sgFadeBottom } from './styleguideSurfaces';

interface StyleguideSidebarProps {
  activeItem: string;
  activeAnchor: string | null;
  onSelectPage: (id: string) => void;
}

export function StyleguideSidebar({
  activeItem,
  activeAnchor,
  onSelectPage,
}: StyleguideSidebarProps) {
  return (
    <nav
      aria-label="Styleguide navigation"
      className="sticky top-0 h-screen w-[260px] shrink-0 overflow-y-auto py-6 pl-8 pr-6 scrollbar-none"
    >
      <a
        href="#icon-library"
        onClick={(e) => {
          e.preventDefault();
          onSelectPage(NAV[0].items[0].id);
        }}
        className="flex items-center gap-1.5 mb-8"
      >
        <span className="text-[14px] font-semibold text-slate-12 tracking-tight">C2 Hub</span>
        <span className="text-[14px] font-normal text-n-8 tracking-tight">docs</span>
      </a>

      {NAV.map((group) => (
        <SidebarGroup
          key={group.label}
          group={group}
          activeItem={activeItem}
          activeAnchor={activeAnchor}
          onSelectPage={onSelectPage}
        />
      ))}

      <div
        aria-hidden
        className={`${sgFadeBottom} -mb-6`}
      />
    </nav>
  );
}

function SidebarGroup({
  group,
  activeItem,
  activeAnchor,
  onSelectPage,
}: {
  group: NavGroup;
  activeItem: string;
  activeAnchor: string | null;
  onSelectPage: (id: string) => void;
}) {
  return (
    <div className="mb-6">
      <span className="block text-xs font-semibold text-slate-9 mb-2">
        {group.label}
      </span>
      <ul className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            activeItem={activeItem}
            activeAnchor={activeAnchor}
            onSelectPage={onSelectPage}
          />
        ))}
      </ul>
    </div>
  );
}

function SidebarItem({
  item,
  activeItem,
  activeAnchor,
  onSelectPage,
}: {
  item: NavItem;
  activeItem: string;
  activeAnchor: string | null;
  onSelectPage: (id: string) => void;
}) {
  const isActive = activeItem === item.id;
  const showChildren = isActive && item.children && item.children.length > 0;

  return (
    <li>
      <a
        href={`#${item.id}`}
        onClick={(e) => {
          e.preventDefault();
          onSelectPage(item.id);
        }}
        aria-current={isActive && !activeAnchor ? 'page' : undefined}
        className={`block py-[5px] text-xs cursor-pointer transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-border-strong focus-visible:ring-offset-1 focus-visible:ring-offset-transparent rounded-md ${
          isActive
            ? 'text-slate-12 font-semibold bg-state-pressed px-2.5 -mx-2.5'
            : 'text-accent-foreground font-semibold hover:text-n-11 hover:bg-state-hover px-2.5 -mx-2.5'
        }`}
      >
        {item.label}
      </a>
      {showChildren && (
        <ul className="mt-1 space-y-0.5 border-s border-border-default/70 ps-3">
          {item.children!.map((child) => {
            const isChildActive = activeAnchor === child.id;
            return (
              <li key={child.id}>
                <a
                  href={`#${child.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectPage(child.id);
                  }}
                  aria-current={isChildActive ? 'page' : undefined}
                  className={`block rounded-md px-2 py-[4px] text-[11px] font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-border-strong ${
                    isChildActive
                      ? 'bg-state-pressed text-slate-12'
                      : 'text-n-8 hover:bg-state-hover hover:text-n-11'
                  }`}
                >
                  {child.label}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
