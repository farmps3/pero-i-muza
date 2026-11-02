
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";
import LikeButton from "../components/LikeButton";

type PopularPoem = {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  author_id: string;
  created_at: string;
  authorName: string;
  username: string;
  likesCount: number;
};

type PopularAuthor = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  poemsCount: number;
  likesCount: number;
};

export default function PopularPage() {
  const [poems, setPoems] = useState<PopularPoem[]>([]);
  const [authors, setAuthors] = useState<PopularAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPopularContent() {
      const supabase = createClient();

      const [
        { data: poemData, error: poemError },
        { data: authorData, error: authorError },
      ] = await Promise.all([
        supabase
          .from("poems")
          .select(
            "id, title, content, language, category, author_id, created_at"
          )
          .eq("status", "approved"),

        supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url, bio"),
      ]);

      if (poemError) {
        console.error("Ошибка загрузки стихотворений:", poemError.message);
        setLoading(false);
        return;
      }

      if (authorError) {
        console.error("Ошибка загрузки авторов:", authorError.message);
      }

      const poemRows = poemData || [];
      const authorRows = authorData || [];

      const poemIds = poemRows.map((poem) => poem.id);

      let likes: { poem_id: string }[] = [];

      if (poemIds.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from("likes")
          .select("poem_id")
          .in("poem_id", poemIds);

        if (likesError) {
          console.error("Ошибка загрузки лайков:", likesError.message);
        } else {
          likes = likesData || [];
        }
      }

      const preparedPoems: PopularPoem[] = poemRows.map((poem) => {
        const author = authorRows.find(
          (item) => item.id === poem.author_id
        );

        const likesCount = likes.filter(
          (like) => like.poem_id === poem.id
        ).length;

        return {
          ...poem,
          authorName:
            author?.display_name || author?.username || "Автор",
          username: author?.username || "",
          likesCount,
        };
      });

      preparedPoems.sort(
        (a, b) =>
          b.likesCount - a.likesCount ||
          new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
      );

      const preparedAuthors: PopularAuthor[] = authorRows
        .map((author) => {
          const authorPoems = preparedPoems.filter(
            (poem) => poem.author_id === author.id
          );

          return {
            ...author,
            poemsCount: authorPoems.length,
            likesCount: authorPoems.reduce(
              (total, poem) => total + poem.likesCount,
              0
            ),
          };
        })
        .filter((author) => author.poemsCount > 0);

      preparedAuthors.sort(
        (a, b) =>
          b.likesCount - a.likesCount ||
          b.poemsCount - a.poemsCount
      );

      setPoems(preparedPoems);
      setAuthors(preparedAuthors);
      setLoading(false);
    }

    loadPopularContent();
  }, []);

  return (
    <main className="popular-page">
      <header className="home-header">
        <Link href="/" className="home-logo">
          Перо и Муза
        </Link>

        <nav className="home-nav">
          <Link href="/">Главная</Link>
          <Link href="/authors">Авторы</Link>
          <Link href="/popular">Популярное</Link>
          <Link href="/following">Мои подписки</Link>
          <Link href="/notifications">Уведомления</Link>
        </nav>
      </header>

      <section className="popular-hero">
        <p className="home-section-label">
          ВЫБОР ЧИТАТЕЛЕЙ
        </p>

        <h1>Популярное</h1>

        <p>
          Произведения и авторы, которые нашли отклик
          в сердцах читателей.
        </p>
      </section>

      {loading ? (
        <p className="popular-loading">
          Собираем рейтинг...
        </p>
      ) : (
        <>
          <section className="popular-list">
            <h2>🏆 Популярные авторы</h2>

            <p className="popular-description">
              Авторы с наибольшим количеством сердечек
              на опубликованных произведениях.
            </p>

            {authors.length === 0 ? (
              <p className="home-empty">
                Пока нет авторов с опубликованными произведениями.
              </p>
            ) : (
              <div className="popular-authors-grid">
                {authors.slice(0, 10).map((author, index) => (
                  <article
                    className="popular-author-card"
                    key={author.id}
                  >
                    <span className="popular-author-place">
                      № {index + 1}
                    </span>

                    {author.avatar_url ? (
                      <img
                        className="popular-author-avatar"
                        src={author.avatar_url}
                        alt={author.display_name || "Автор"}
                      />
                    ) : (
                      <div className="popular-author-avatar popular-avatar-placeholder">
                        ✒
                      </div>
                    )}

                    <h3>
                      {author.username ? (
                        <Link
                          href={`/authors/${encodeURIComponent(
                            author.username
                          )}`}
                        >
                          {author.display_name ||
                            author.username}
                        </Link>
                      ) : (
                        author.display_name || "Автор"
                      )}
                    </h3>

                    {author.bio && (
                      <p className="popular-author-bio">
                        {author.bio}
                      </p>
                    )}

                    <div className="popular-author-stats">
                      <span>✍️ {author.poemsCount} стих.</span>
                      <span>❤️ {author.likesCount}</span>
                    </div>

                    {author.username && (
                      <Link
                        href={`/authors/${encodeURIComponent(
                          author.username
                        )}`}
                        className="popular-author-link"
                      >
                        Перейти в профиль →
                      </Link>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="popular-list">
            <h2>❤️ Популярные стихотворения</h2>

            <p className="popular-description">
              Произведения, отсортированные по количеству лайков.
            </p>

            {poems.length === 0 ? (
              <p className="home-empty">
                Пока нет опубликованных произведений.
              </p>
            ) : (
              <div className="home-poems-grid">
                {poems.map((poem, index) => (
                  <article
                    className="home-poem-card"
                    key={poem.id}
                  >
                    <p className="popular-place">
                      № {index + 1} в рейтинге
                    </p>

                    <p className="home-poem-language">
                      {poem.language === "ru"
                        ? "РУССКИЙ ЯЗЫК"
                        : "ENGLISH"}
                    </p>

                    <p className="home-poem-language">
                      {poem.category}
                    </p>

                    <h3>
                      <Link href={`/poems/${poem.id}`}>
                        {poem.title}
                      </Link>
                    </h3>

                    <p className="home-poem-content">
                      {poem.content}
                    </p>

                    <p className="home-poem-date">
                      Автор:{" "}
                      {poem.username ? (
                        <Link
                          href={`/authors/${encodeURIComponent(
                            poem.username
                          )}`}
                        >
                          {poem.authorName}
                        </Link>
                      ) : (
                        poem.authorName
                      )}
                    </p>

                    <div className="popular-card-actions">
                      <LikeButton poemId={poem.id} />
                      <span className="popular-total-likes">
                        ❤️ {poem.likesCount} всего
                      </span>
                    </div>

                    <Link
                      href={`/poems/${poem.id}`}
                      className="home-poem-read"
                    >
                      Читать полностью →
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer className="home-footer">
        <p>Перо и Муза © 2026</p>
        <p>Слова объединяют мир.</p>
      </footer>
    </main>
  );
}
