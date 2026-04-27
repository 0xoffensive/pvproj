"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const role = (session?.user as { role?: string } | undefined)?.role;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const primaryButtonClass =
    "rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800";
  const outlineButtonClass =
    "rounded-lg border border-green-700 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-950/40";
  const navLinkClass = "text-sm font-medium hover:text-green-700 transition-colors";

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-7xl items-center justify-start gap-3 px-3 py-2 sm:gap-6 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-bold text-green-700 dark:text-green-400 sm:text-xl"
          onClick={closeMobileMenu}
        >
          <span className="text-xl sm:text-2xl">🌲</span>
          Dievų Giria
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a
            href={isHomePage ? "#features" : "/#features"}
            className={navLinkClass}
          >
            Funkcijos
          </a>
          <a
            href={isHomePage ? "#how-it-works" : "/#how-it-works"}
            className={navLinkClass}
          >
            Kaip veikia
          </a>
          <Link href="/skelbimas" className={navLinkClass}>
            Turgavietė
          </Link>
          <Link href="/planavimas" className={navLinkClass}>
            Planavimas
          </Link>
        </div>

        {/* Replaced + Skelbimas with Mano skelbimai */}
        {session?.user && role === "atstovas" && (
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/mano-skelbimai"
              className={outlineButtonClass}
            >
              Mano skelbimai
            </Link>
            <Link
              href="/skelbimas/kurti"
              className={primaryButtonClass}
            >
              Kurti skelbimus
            </Link>
          </div>
        )}

        {/* Admin panel link for administrators */}
        {session?.user && role === "administratorius" && (
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/admin"
              className={outlineButtonClass}
            >
              Admin panelė
            </Link>
            <Link
              href="/skelbimas/kurti"
              className={primaryButtonClass}
            >
              Kurti skelbimus
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="ml-auto rounded-lg border border-green-700 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 dark:text-green-400 dark:border-green-500 dark:hover:bg-green-950/40 md:hidden"
          aria-label="Atidaryti navigacijos meniu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? "Uzdaryti" : "Meniu"}
        </button>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          ) : session ? (
            <>
              <Link
                href="/profilis"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-green-700 transition-colors"
              >
                Profilis
              </Link>
              <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 lg:inline">
                Sveiki, <span className="font-medium text-zinc-900 dark:text-zinc-100">{session.user?.name}</span>
              </span>
              <button
                onClick={() => signOut()}
                className={outlineButtonClass}
              >
                Atsijungti
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={outlineButtonClass}
              >
                Prisijungti
              </Link>
              <Link
                href="/register"
                className={primaryButtonClass}
              >
                Registruotis
              </Link>
            </>
          )}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-zinc-200 bg-white/95 px-3 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
          <div className="flex flex-col gap-2">
            <a
              href={isHomePage ? "#features" : "/#features"}
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-zinc-200 dark:hover:bg-green-950/40 dark:hover:text-green-400"
            >
              Funkcijos
            </a>
            <a
              href={isHomePage ? "#how-it-works" : "/#how-it-works"}
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-zinc-200 dark:hover:bg-green-950/40 dark:hover:text-green-400"
            >
              Kaip veikia
            </a>
            <Link
              href="/skelbimas"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-zinc-200 dark:hover:bg-green-950/40 dark:hover:text-green-400"
            >
              Turgavietė
            </Link>
            <Link
              href="/planavimas"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-zinc-200 dark:hover:bg-green-950/40 dark:hover:text-green-400"
            >
              Planavimas
            </Link>

            {status !== "loading" && session && role === "atstovas" && (
              <>
                <Link href="/mano-skelbimai" onClick={closeMobileMenu} className={outlineButtonClass}>
                  Mano skelbimai
                </Link>
                <Link href="/skelbimas/kurti" onClick={closeMobileMenu} className={primaryButtonClass}>
                  Kurti skelbimus
                </Link>
              </>
            )}

            {status !== "loading" && session && role === "administratorius" && (
              <>
                <Link href="/admin" onClick={closeMobileMenu} className={outlineButtonClass}>
                  Admin panele
                </Link>
                <Link href="/skelbimas/kurti" onClick={closeMobileMenu} className={primaryButtonClass}>
                  Kurti skelbimus
                </Link>
              </>
            )}

            {status === "loading" ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            ) : session ? (
              <>
                <Link
                  href="/profilis"
                  onClick={closeMobileMenu}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-zinc-200 dark:hover:bg-green-950/40 dark:hover:text-green-400"
                >
                  Profilis
                </Link>
                <button onClick={() => signOut()} className={outlineButtonClass}>
                  Atsijungti
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={closeMobileMenu} className={outlineButtonClass}>
                  Prisijungti
                </Link>
                <Link href="/register" onClick={closeMobileMenu} className={primaryButtonClass}>
                  Registruotis
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}