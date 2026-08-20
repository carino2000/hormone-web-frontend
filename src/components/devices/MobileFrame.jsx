import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "../../lib/navItems";

export default function MobileFrame({ children }) {
  return (
    <div className="mx-auto flex w-[380px] max-w-full flex-col overflow-hidden rounded-[2.5rem] border-8 border-neutral-900 bg-white shadow-xl">
      <div className="mx-auto mt-2 h-5 w-28 shrink-0 rounded-full bg-neutral-900" />
      <div className="relative h-[652px] overflow-y-auto p-4">{children}</div>
      <nav className="flex shrink-0 items-center justify-around border-t border-black/5 bg-white py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl px-4 py-1 text-[10px] font-medium transition ${
                isActive ? "text-rose-400" : "text-neutral-400"
              }`
            }
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
