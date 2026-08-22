import { useEffect, useState, type PropsWithChildren } from "react";
import { IoMoonSharp } from "react-icons/io5";
import { MdSunny } from "react-icons/md";
import { Link, Outlet } from "react-router-dom";

const StyledLink = ({
  to,
  children,
}: PropsWithChildren<{ to: string | { pathname?: string; search?: string; hash?: string } }>) => {
  return (
    <Link to={to} className="block border-b border-neutral-300 dark:border-neutral-700 px-4 py-3">
      {children}
    </Link>
  );
};

export const Layout = () => {
  const [dark, setDark] = useState(false);
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
    const html = document.getElementsByTagName("html")?.[0];
    if (dark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    setDark(storedTheme === "dark");
  }, []);
  return (
    <div className="theme-mode-surface bg-background w-screen h-screen flex p-2 gap-4">
        <aside className="w-65 h-full rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-space-mono backdrop-blur-3xl">
          <nav className="flex justify-between flex-col h-full">
            <ul>
              {menuMap.map(({ href, children, title }) => (
                <li key={href}>
                  <StyledLink to={href}>{title}</StyledLink>
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
              className="flex py-4 justify-center text-xl dark:text-neutral-100"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <IoMoonSharp /> : <MdSunny />}
            </button>
          </nav>
        </aside>
      <main className="bg-blue-100 h-full flex-1">
        g
        <Outlet />
      </main>
    </div>
  );
};
