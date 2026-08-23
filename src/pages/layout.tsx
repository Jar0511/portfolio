import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type PropsWithChildren } from "react";
import { IoMoonSharp } from "react-icons/io5";
import { MdSunny } from "react-icons/md";
import { Link, Outlet, useLocation } from "react-router-dom";

type StyledLinkProps =
PropsWithChildren<{ to: string | { pathname?: string; search?: string; hash?: string }; hasChildren?: boolean }>
const StyledLink = ({
  to,
  children,
  hasChildren
}: StyledLinkProps) => {
  const { pathname } = useLocation();
  return (
    <Link to={to} className={`block transition-colors duration-150 border-b border-neutral-300 dark:border-neutral-700 ${!hasChildren && to === pathname ? "font-semibold text-neutral-600 dark:text-neutral-300" : ""} px-4 py-3`}>
      {children}
    </Link>
  );
};

export const Layout = () => {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isThemeButtonHovered, setIsThemeButtonHovered] = useState(false);
  const showsDarkIcon = isThemeButtonHovered ? !dark : dark;
  const ThemeIcon = showsDarkIcon ? IoMoonSharp : MdSunny;
  const menuMap = [
    {
      title: "WORK",
      href: "/work/form",
      children: [
        { title: "Dynamic Form", href: "/work/form" },
        { title: "Nested Table", href: "/work/table" },
        { title: "Draggable Layout", href: "/work/layout" },
        { title: "Client-side PDF", href: "/work/pdf" },
      ],
    },
    {
      title: "CASE STUDY",
      href: "/case-study",
    },
  ];

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="theme-mode-surface transition-colors duration-150 bg-background w-screen h-screen flex p-2 gap-4">
      <aside className="w-65 h-full rounded-lg border transition-colors duration-150 border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-space-mono backdrop-blur-3xl">
        <nav className="flex justify-between flex-col h-full">
          <ul>
            {menuMap.map(({ href, children, title }) => (
              <li key={href}>
                <StyledLink to={href} hasChildren={!!children}>{title}</StyledLink>
                {!!children && (
                  <ul>
                    {children.map(({ title: childTitle, href: childHref }) => (
                      <li key={childHref}>
                        <StyledLink to={childHref}>
                          <span className="pl-4">{childTitle}</span>
                        </StyledLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="flex py-4 justify-center text-xl dark:text-neutral-100"
            onMouseEnter={() => {
              setIsThemeButtonHovered(true);
            }}
            onMouseLeave={() => {
              setIsThemeButtonHovered(false);
            }}
            onClick={() => {
              setDark((d) => !d);
            }}
            title="toggle theme"
            aria-label="theme toggle button"
          >
            <span className="relative flex size-6 items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.i
                  key={showsDarkIcon ? "moon" : "sun"}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <ThemeIcon />
                </motion.i>
              </AnimatePresence>
            </span>
          </button>
        </nav>
      </aside>
      <main className="h-full flex-1 rounded-lg transition-colors duration-150 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 backdrop-blur-3xl">
        <Outlet />
      </main>
    </div>
  );
};
