"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type FollowedAuthor = {
  id: string;
  display_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
};

type FeedPoem = {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  created_at: string;
  author_id: string;
  authorName: string;
  username: string;
};

export default function FollowingPage() {
  const [authors, setAuthors] = useState<FollowedAuthor[]>([]);
  const [poems, setPoems] = useState<FeedPoem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFollowing() {
      const supabase = createClient();

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authData.user) {
          if (!cancelled) {
            setMessage("Войди в аккаунт, чтобы увидеть свои подписки.");
            setLoading(false);
          }
          return;
        }

        const { data: follows, error } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", authData.user.id);

        if (error) throw error;

        const authorIds = (follows || []).map(
          (follow) => follow.following_id
        );

        if (authorIds.length === 0) {
          if (!cancelled) {
            setAuthors([]);
            setPoems([]);
            setLoading(false);
          }
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name, username, bio, avatar_url")
          .in("id", authorIds);

        if (profilesError) throw profilesError;

        const followedAuthors = profiles || [];

        const { data: poemData, error: poemsError } = await supabase
          .from("poems")
          .select(
            "id, title, content, language, category, created_at, author_id"
          )
          .in("author_id", authorIds)
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (poemsError) throw poemsError;

        const preparedPoems = (poemData || []).map((poem) => {
          const author = followedAuthors.find(
            (item) => item.id === poem.author_id
          );

          return {
            ...poem,
            authorName: author?.display_name || author?.username || "Автор",
            username: author?.username || "",
          };
        });

        if (!cancelled) {
          setAuthors(followedAuthors);
          setPoems(preparedPoems);
          setLoading(false);
        }
      } catch (error) {
        console.error("Ошибка загрузки подписок:", error);

        if (!cancelled) {
          setMessage("Не удалось загрузить подписки. Попробуй обновить страницу.");
          setLoading(false);
        }
      }
    }

    loadFollowing();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="following-page">
      <header className="following-nav">
        <Link
          href="/"
          className="following-logo"
          onClick={() => setMobileMenuOpen(false)}
        >
          Перо и Муза
        </Link>

        <button
          type="button"
          className="following-menu-toggle"
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
          <Link href="/favorites" onClick={() => setMobileMenuOpen(false)}>
            Избранное
          </Link>
        </nav>
      </header>

      {loading ? (
        <div className="following-loading">
          <span>✦</span>
          <p>Собираем твоё литературное окружение...</p>
        </div>
      ) : message ? (
        <>
          <section className="following-hero">
            <p className="following-eyebrow">ТВОЁ ЛИТЕРАТУРНОЕ ОКРУЖЕНИЕ</p>
            <span className="following-hero-ornament">✦</span>
            <h1>Мои подписки</h1>
            <div className="following-divider">
              <span />
              <i>✧</i>
              <span />
            </div>
          </section>

          <section className="following-empty">
            <div className="following-empty-icon">✧</div>
            <p>{message}</p>
            <Link href="/login" className="following-action-link">
              Войти в аккаунт
            </Link>
          </section>
        </>
      ) : authors.length === 0 ? (
        <>
          <section className="following-hero">
            <p className="following-eyebrow">ТВОЁ ЛИТЕРАТУРНОЕ ОКРУЖЕНИЕ</p>
            <span className="following-hero-ornament">✦</span>
            <h1>Мои подписки</h1>
            <div className="following-divider">
              <span />
              <i>✧</i>
              <span />
            </div>
            <p>Авторы, чьи строки хочется читать.</p>
          </section>

          <section className="following-empty">
            <div className="following-empty-icon">♡</div>
            <h2>Твоя читательская история начинается здесь</h2>
            <p>
              Ты пока ни на кого не подписан. Найди интересного автора
              в каталоге и подпишись на него — его новые произведения
              появятся в этой ленте.
            </p>
            <Link href="/authors" className="following-action-link">
              Открыть каталог авторов
            </Link>
          </section>
        </>
      ) : (
        <>
          <section className="following-hero">
            <p className="following-eyebrow">ТВОЁ ЛИТЕРАТУРНОЕ ОКРУЖЕНИЕ</p>
            <span className="following-hero-ornament">✦</span>
            <h1>Мои подписки</h1>
            <div className="following-divider">
              <span />
              <i>✧</i>
              <span />
            </div>
            <p>Авторы, чьи строки хочется читать.</p>
            <div className="following-count">
              Ты читаешь авторов: <strong>{authors.length}</strong>
            </div>
          </section>

          <section className="following-section">
            <div className="following-section-heading">
              <p className="following-eyebrow">ТВОЁ ЛИТЕРАТУРНОЕ ОКРУЖЕНИЕ</p>
              <h2>Авторы, которых я читаю</h2>
              <p>
                Каждая подписка — возможность открыть для себя новый мир.
              </p>
            </div>

            <div className="following-authors-grid">
              {authors.map((author, index) => (
                <article className="following-author-card" key={author.id}>
                  <span className="following-card-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <Link
                    href={`/authors/${encodeURIComponent(author.username)}`}
                    className="following-avatar-link"
                    aria-label={`Открыть профиль ${author.display_name || author.username}`}
                  >
                    {author.avatar_url ? (
                      <img
                        src={author.avatar_url}
                        alt={`Фотография ${author.display_name || author.username}`}
                        className="following-avatar"
                      />
                    ) : (
                      <div className="following-avatar-placeholder">
                        {(author.display_name || author.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <span className="following-author-ornament">✧</span>

                  <h3>{author.display_name || author.username}</h3>
                  <p className="following-username">@{author.username}</p>

                  <p className="following-author-bio">
                    {author.bio || "Автор пока не добавил описание."}
                  </p>

                  <Link
                    href={`/authors/${encodeURIComponent(author.username)}`}
                    className="following-profile-link"
                  >
                    Перейти к автору
                    <span> →</span>
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="following-section following-feed">
            <div className="following-section-heading">
              <p className="following-eyebrow">СВЕЖЕЕ В ТВОРЧЕСТВЕ</p>
              <h2>Новые произведения</h2>
              <p>
                Последние опубликованные строки авторов, на которых ты подписан.
              </p>
            </div>

            {poems.length === 0 ? (
              <div className="following-no-poems">
                <span>✧</span>
                <p>
                  У авторов, на которых ты подписан, пока нет опубликованных
                  произведений. Загляни сюда немного позже.
                </p>
              </div>
            ) : (
              <div className="following-poems-grid">
                {poems.map((poem, index) => (
                  <article className="following-poem-card" key={poem.id}>
                    <div className="following-poem-topline">
                      <span>
                        {poem.language === "ru"
                          ? "РУССКИЙ ЯЗЫК"
                          : poem.language === "en"
                            ? "ENGLISH"
                            : poem.language.toUpperCase()}
                      </span>
                      <span>{poem.category || "Свободная тема"}</span>
                    </div>

                    <span className="following-poem-ornament">✦</span>

                    <h3>
                      <Link href={`/poems/${poem.id}`}>
                        {poem.title}
                      </Link>
                    </h3>

                    <p className="following-poem-content">
                      {poem.content.length > 320
                        ? `${poem.content.slice(0, 320).trimEnd()}...`
                        : poem.content}
                    </p>

                    <div className="following-poem-meta">
                      <span>
                        Автор:{" "}
                        {poem.username ? (
                          <Link
                            href={`/authors/${encodeURIComponent(poem.username)}`}
                          >
                            {poem.authorName}
                          </Link>
                        ) : (
                          poem.authorName
                        )}
                      </span>
                      <time dateTime={poem.created_at}>
                        {new Date(poem.created_at).toLocaleDateString("ru-RU")}
                      </time>
                    </div>

                    <Link
                      href={`/poems/${poem.id}`}
                      className="following-read-link"
                    >
                      Читать произведение
                      <span> →</span>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer className="following-footer">
        <span>Перо и Муза</span>
        <i>✦</i>
        <p>Слова объединяют мир.</p>
      </footer>
    </main>
  );
}