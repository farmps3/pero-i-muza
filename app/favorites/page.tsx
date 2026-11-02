"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type FavoritePoem = {
  id: string;
  title: string;
  content: string;
  language: string;
  created_at: string;
  author_id: string;
};

type Author = {
  id: string;
  display_name: string | null;
  username: string;
};

type FavoriteItem = {
  poem: FavoritePoem;
  author: Author | null;
};

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      const supabase = createClient();

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
          if (!cancelled) {
            setMessage("Войди в аккаунт, чтобы увидеть избранные стихи.");
            setLoading(false);
          }
          return;
        }

        const { data: favorites, error: favoritesError } = await supabase
          .from("favorites")
          .select("poem_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (favoritesError) throw favoritesError;

        if (!favorites || favorites.length === 0) {
          if (!cancelled) {
            setItems([]);
            setLoading(false);
          }
          return;
        }

        const poemIds = favorites.map((favorite) => favorite.poem_id);

        const { data: poems, error: poemsError } = await supabase
          .from("poems")
          .select("id, title, content, language, created_at, author_id")
          .in("id", poemIds)
          .eq("status", "approved");

        if (poemsError) throw poemsError;

        const authorIds = [
          ...new Set((poems || []).map((poem) => poem.author_id)),
        ];

        let authors: Author[] = [];

        if (authorIds.length > 0) {
          const { data: authorData, error: authorsError } = await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", authorIds);

          if (authorsError) throw authorsError;
          authors = authorData || [];
        }

        const result = (poems || [])
          .sort((a, b) => {
            const dateA =
              favorites.find((favorite) => favorite.poem_id === a.id)
                ?.created_at || "";
            const dateB =
              favorites.find((favorite) => favorite.poem_id === b.id)
                ?.created_at || "";

            return new Date(dateB).getTime() - new Date(dateA).getTime();
          })
          .map((poem) => ({
            poem,
            author:
              authors.find((author) => author.id === poem.author_id) || null,
          }));

        if (!cancelled) {
          setItems(result);
          setLoading(false);
        }
      } catch (error) {
        console.error("Ошибка загрузки избранного:", error);

        if (!cancelled) {
          setMessage("Не удалось загрузить избранное. Попробуй обновить страницу.");
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      cancelled = true;
    };
  }, []);

  async function removeFavorite(poemId: string) {
    if (removingId) return;

    setRemovingId(poemId);

    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setMessage("Войди в аккаунт, чтобы изменять избранное.");
        return;
      }

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", authData.user.id)
        .eq("poem_id", poemId);

      if (error) throw error;

      setItems((current) =>
        current.filter((item) => item.poem.id !== poemId)
      );
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
      setMessage("Не удалось убрать стихотворение из избранного.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <main className="favorites-page">
      <header className="favorites-nav">
        <Link
          href="/"
          className="favorites-logo"
          onClick={() => setMobileMenuOpen(false)}
        >
          Перо и Муза
        </Link>

        <button
          type="button"
          className="favorites-menu-toggle"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <nav className={mobileMenuOpen ? "is-open" : ""}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            На главную
          </Link>
          <Link href="/authors" onClick={() => setMobileMenuOpen(false)}>
            Авторы
          </Link>
          <Link href="/following" onClick={() => setMobileMenuOpen(false)}>
            Мои подписки
          </Link>
        </nav>
      </header>

      {loading ? (
        <div className="favorites-loading">
          <span className="favorites-loading-ornament">✦</span>
          <p>Собираем твою литературную коллекцию...</p>
        </div>
      ) : (
        <>
          <section className="favorites-header">
            <p className="favorites-eyebrow">
              ТВОЯ ЛИТЕРАТУРНАЯ КОЛЛЕКЦИЯ
            </p>

            <span className="favorites-header-ornament">✦</span>

            <h1>Избранное</h1>

            <div className="favorites-title-divider">
              <span />
              <i>✧</i>
              <span />
            </div>

            <p>Стихи, к которым хочется возвращаться.</p>

            {!message && items.length > 0 && (
              <div className="favorites-count">
                В твоей коллекции:{" "}
                <strong>{items.length}</strong>{" "}
                {items.length === 1
                  ? "произведение"
                  : items.length >= 2 && items.length <= 4
                    ? "произведения"
                    : "произведений"}
              </div>
            )}
          </section>

          {message ? (
            <section className="favorites-empty">
              <div className="favorites-empty-icon">✧</div>
              <p>{message}</p>
              <Link href="/login" className="favorites-empty-link">
                Войти в аккаунт
              </Link>
            </section>
          ) : items.length === 0 ? (
            <section className="favorites-empty">
              <div className="favorites-empty-icon">☆</div>
              <p className="favorites-empty-eyebrow">
                МЕСТО ДЛЯ ЛЮБИМЫХ СТРОК
              </p>
              <h2>Здесь пока тихо...</h2>
              <p>
                Сохраняй понравившиеся произведения, и они появятся в этой
                коллекции. Пусть у каждого важного слова будет своё место.
              </p>
              <Link href="/" className="favorites-empty-link">
                Найти стихи
              </Link>
            </section>
          ) : (
            <section className="favorites-content">
              <div className="favorites-grid">
                {items.map(({ poem, author }, index) => (
                  <article className="favorite-poem-card" key={poem.id}>
                    <div className="favorite-card-topline">
                      <p className="favorite-poem-language">
                        {poem.language === "ru"
                          ? "РУССКИЙ ЯЗЫК"
                          : poem.language === "en"
                            ? "ENGLISH"
                            : poem.language.toUpperCase()}
                      </p>
                      <span className="favorite-card-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <span className="favorite-card-ornament">✧</span>

                    <h2>
                      <Link href={`/poems/${poem.id}`}>
                        {poem.title}
                      </Link>
                    </h2>

                    <p className="favorite-poem-content">
                      {poem.content.length > 220
                        ? `${poem.content.slice(0, 220).trimEnd()}...`
                        : poem.content}
                    </p>

                    <div className="favorite-poem-footer">
                      {author ? (
                        <Link
                          href={`/authors/${encodeURIComponent(author.username)}`}
                          className="favorite-author-link"
                        >
                          <span className="favorite-author-mark">✦</span>
                          {author.display_name || author.username}
                        </Link>
                      ) : (
                        <span className="favorite-author-link">
                          <span className="favorite-author-mark">✦</span>
                          Автор
                        </span>
                      )}

                      <button
                        type="button"
                        className="favorite-remove-button"
                        onClick={() => removeFavorite(poem.id)}
                        disabled={removingId !== null}
                      >
                        {removingId === poem.id
                          ? "Удаляем..."
                          : "Убрать ★"}
                      </button>
                    </div>

                    <Link
                      href={`/poems/${poem.id}`}
                      className="favorite-read-link"
                    >
                      Читать произведение
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <footer className="favorites-footer">
        <span>Перо и Муза</span>
        <i>✦</i>
        <p>У каждого слова есть своё место.</p>
      </footer>
    </main>
  );
}