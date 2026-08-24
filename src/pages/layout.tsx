import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type PropsWithChildren } from "react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

type StyledLinkProps = PropsWithChildren<{
  to: string | { pathname?: string; search?: string; hash?: string };
  className?: string;
}>;
const StyledLink = ({ to, children, className }: StyledLinkProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${className ? className : ""} block text-center break-keep ${isActive ? "font-semibold text-neutral-600 dark:text-neutral-300" : ""}`
      }
    >
      {children}
    </NavLink>
  );
};

export const Layout = () => {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [isThemeButtonHovered, setIsThemeButtonHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | number>(null);
  const navigate = useNavigate();
  const showsDarkIcon = isThemeButtonHovered ? !dark : dark;
  const ThemeIcon = showsDarkIcon ? IoMoonOutline : IoSunnyOutline;
  const menuMap = [
    {
      title: "WORK",
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
    <div className={` bg-background w-screen min-h-screen relative pt-20 px-2`}>
      <aside className="absolute w-[calc(100%-1rem)] top-2 left-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-space-mono backdrop-blur-3xl overflow-clip">
        <nav className="flex justify-between items-center">
          <h1>
            <button
              className="size-full flex items-center py-2 px-4"
              onClick={() => void navigate("/")}
            >
              HOME
            </button>
          </h1>
          <ul className="flex items-center gap-2">
            {menuMap.map(({ href, title }, i) => (
              <li key={href}>
                {href ? (
                  <StyledLink to={href} className="py-2 px-4">
                    {title}
                  </StyledLink>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu((prev) => (prev == i ? null : i));
                    }}
                    className="py-2 px-4"
                  >
                    {title}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="flex justify-center text-xl dark:text-neutral-200 relative size-10 items-center overflow-hidden"
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
          </button>
        </nav>
        <motion.ul
          className="flex items-center text-sm justify-center border-neutral-300 border-t dark:border-neutral-700 overflow-hidden"
          animate={openMenu !== null ? "open" : "close"}
          variants={{
            open: { height: "auto", borderTopWidth: 1, transition: { when: "beforeChildren" } },
            close: { height: 0, borderTopWidth: 0, transition: { when: "afterChildren" } },
          }}
        >
          {menuMap[openMenu || 0].children?.map(({ title, href }) => (
            <motion.li
              key={href}
              className="border-r first:border-l border-neutral-300 dark:border-neutral-700"
              variants={{ open: { opacity: 1 }, close: { opacity: 0 } }}
            >
              <StyledLink to={href} className="p-2">
                {title}
              </StyledLink>
            </motion.li>
          ))}
        </motion.ul>
      </aside>
      <main className="h-full flex-1 rounded-lg text-neutral-800 dark:text-neutral-200">
        <Outlet />
      </main>
    </div>
  );
};
