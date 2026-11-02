
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "../lib/supabase";
import NotificationBell from "../app/components/NotificationBell";

export default function Header() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Ошибка проверки аккаунта:", error.message);
      }

      if (mounted) {
        setUserId(data.user?.id || null);
        setAuthLoading(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUserId(session?.user?.id || null);
        setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Ошибка выхода:", error.message);
      alert("Не удалось выйти из аккаунта. Попробуй ещё раз.");
    } else {
      setUserId(null);
      setMobileMenuOpen(false);
    }

    setSigningOut(false);
  }

  return (
    <header className="home-header">
      <Link href="/" className="home-logo">
        Перо и Муза
      </Link>

      <button
        type="button"
        className="home-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? "✕" : "☰"}
      </button>

      <nav className={mobileMenuOpen ? "home-nav is-open" : "home-nav"}>
        <Link href="/authors">Авторы</Link>

        <Link href="/popular">Популярное</Link>

        {!authLoading && userId && (
          <>
            <Link href="/following">Мои подписки</Link>

            <Link href="/favorites">Избранное ★</Link>

            <NotificationBell />

            <Link href="/profile">Моя визитка</Link>

            <Link href="/my-poems">Мои стихи</Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="home-logout-button"
            >
              {signingOut ? "Выходим..." : "Выйти"}
            </button>
          </>
        )}

        {!authLoading && !userId && (
          <>
            <Link href="/login">Войти</Link>

            <Link href="/register">Регистрация</Link>
          </>
        )}
      </nav>
    </header>
  );
}
