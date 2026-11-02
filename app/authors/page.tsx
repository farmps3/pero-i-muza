
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type Author = {
  id: string;
  display_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  followersCount: number;
};

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadAuthors() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, bio, avatar_url")
        .order("display_name", { ascending: true });

      if (error) {
        console.error("Ошибка загрузки авторов:", error.message);
        setLoading(false);
        return;
      }

      const profiles = data || [];

      const authorsWithFollowers = await Promise.all(
        profiles.map(async (author) => {
          const { count, error: countError } = await supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", author.id);

          if (countError) {
            console.error(
              "Ошибка загрузки подписчиков:",
              countError.message
            );
          }

          return {
            ...author,
            followersCount: countError ? 0 : count || 0,
          };
        })
      );

      setAuthors(authorsWithFollowers);
      setLoading(false);
    }

    loadAuthors();
  }, []);

  const filteredAuthors = authors.filter((author) => {
    const text = search.trim().toLowerCase();

    return (
      (author.display_name || "").toLowerCase().includes(text) ||
      author.username.toLowerCase().includes(text)
    );
  });

  return (
    <main className="authors-page authors-page-refined">
      <header className="authors-header">
        <Link
          href="/"
          className="authors-logo"
          onClick={() => setMobileMenuOpen(false)}
        >
          Перо и Муза
        </Link>

        <button
          type="button"
          className="authors-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <nav className={mobileMenuOpen ? "is-open" : ""}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            На главную
          </Link>

          <Link
            href="/following"
            onClick={() => setMobileMenuOpen(false)}
          >
            Мои подписки
          </Link>
        </nav>
      </header>

      <section className="authors-hero authors-hero-refined">
        <div className="authors-hero-ornament" aria-hidden="true">
          ✦
        </div>

        <p className="authors-label">
          ЛИТЕРАТУРНОЕ СООБЩЕСТВО
        </p>

        <h1>Наши авторы</h1>

        <div className="authors-hero-divider" aria-hidden="true">
          <span />
          <span>✧</span>
          <span />
        </div>

        <p>
          За каждым именем стоит своя история,
          а за каждым стихотворением — целый мир.
        </p>

        <div className="authors-total">
          {authors.length} {authors.length === 1
            ? "автор"
            : authors.length >= 2 && authors.length <= 4
              ? "автора"
              : "авторов"}
        </div>
      </section>

      <section className="authors-content authors-content-refined">
        <div className="authors-search-wrap">
          <span aria-hidden="true">⌕</span>

          <input
            className="authors-search"
            type="search"
            placeholder="Найти автора по имени или псевдониму..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск автора"
          />
        </div>

        {!loading && (
          <p className="authors-results">
            {search.trim()
              ? `Найдено авторов: ${filteredAuthors.length}`
              : "Люди, которые наполняют это пространство словами"}
          </p>
        )}

        {loading ? (
          <p className="authors-empty">Загружаем авторов...</p>
        ) : filteredAuthors.length === 0 ? (
          <div className="authors-empty authors-empty-refined">
            <span aria-hidden="true">✧</span>
            <h2>Пока никого не нашли</h2>
            <p>Попробуй изменить поисковый запрос.</p>
          </div>
        ) : (
          <div className="authors-grid authors-grid-refined">
            {filteredAuthors.map((author) => (
              <Link
                href={`/authors/${encodeURIComponent(author.username)}`}
                className="authors-card authors-card-refined"
                key={author.id}
              >
                <div className="authors-card-ornament" aria-hidden="true">
                  ✧
                </div>

                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={`Фотография ${author.display_name || author.username}`}
                    className="authors-avatar"
                  />
                ) : (
                  <div className="authors-avatar-placeholder">
                    {(author.display_name || author.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <h2>{author.display_name || author.username}</h2>

                <p className="authors-username">
                  @{author.username}
                </p>

                <div className="authors-card-divider" aria-hidden="true">
                  ✦
                </div>

                <p className="authors-bio">
                  {author.bio || "Автор литературного пространства."}
                </p>

                <p className="authors-followers">
                  <span aria-hidden="true">♧</span>
                  Подписчиков: <strong>{author.followersCount}</strong>
                </p>

                <span className="authors-link">
                  Читать произведения <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="home-footer authors-footer">
        <p>Перо и Муза © 2026</p>
        <p>У каждого автора есть своя история.</p>
      </footer>
    </main>
  );
}
