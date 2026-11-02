"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase";
import LikeButton from "../../components/LikeButton";
import FavoriteButton from "../../components/FavoriteButton";
import PoemViewCounter from "../../components/PoemViewCounter";

type Poem = {
  id: string;
  title: string;
  content: string;
  language: string;
  created_at: string;
  author_id: string;
};

type Author = {
  display_name: string | null;
  username: string;
  avatar_url: string | null;
};

type Comment = {
  id: string;
  content: string;
  author_id: string;
  status: string;
  created_at: string;
};

type CommentAuthor = {
  display_name: string | null;
  username: string;
  avatar_url: string | null;
};

type CommentWithAuthor = Comment & {
  author: CommentAuthor | null;
};

function PoemPageContent() {
  const params = useParams();
  const id = params.id as string;

  const [poem, setPoem] = useState<Poem | null>(null);
  const [author, setAuthor] = useState<Author | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  async function loadComments(
    supabase: ReturnType<typeof createClient>
  ) {
    const { data, error } = await supabase
      .from("comments")
      .select("id, content, author_id, status, created_at")
      .eq("poem_id", id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ошибка загрузки комментариев:", error.message);
      return;
    }

    const commentRows = data || [];

    if (commentRows.length === 0) {
      setComments([]);
      return;
    }

    const authorIds = [
      ...new Set(commentRows.map((item) => item.author_id)),
    ];

    const { data: authors } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", authorIds);

    const result = commentRows.map((comment) => ({
      ...comment,
      author:
        authors?.find((item) => item.id === comment.author_id) || null,
    }));

    setComments(result);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPoem() {
      const supabase = createClient();

      setLoading(true);

      const { data, error } = await supabase
        .from("poems")
        .select("id, title, content, language, created_at, author_id")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        setPoem(data);

        const { data: authorData } = await supabase
          .from("profiles")
          .select("display_name, username, avatar_url")
          .eq("id", data.author_id)
          .maybeSingle();

        if (cancelled) return;

        if (authorData) {
          setAuthor(authorData);
        }

        await loadComments(supabase);

        if (cancelled) return;
      } else {
        if (error) {
          console.error(
            "Ошибка загрузки стихотворения:",
            error.message
          );
        }

        setPoem(null);
      }

      setLoading(false);
    }

    if (id) {
      loadPoem();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function sendComment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const text = commentText.trim();

    if (!text) {
      setMessage("Напиши текст комментария.");
      return;
    }

    setSending(true);

    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setMessage("Чтобы оставить комментарий, войди в аккаунт.");
      setSending(false);
      return;
    }

    const { error } = await supabase.from("comments").insert({
      poem_id: id,
      author_id: user.id,
      content: text,
      status: "pending",
    });

    if (error) {
      setMessage("Не удалось отправить комментарий: " + error.message);
    } else {
      setCommentText("");
      setMessage("Комментарий отправлен на модерацию!");
    }

    setSending(false);
  }

  if (loading) {
    return (
      <main className="single-poem-page single-poem-page-refined">
        <div className="single-poem-loading">
          <span>✦</span>
          <p>Открываем страницу произведения...</p>
        </div>
      </main>
    );
  }

  if (!poem) {
    return (
      <main className="single-poem-page single-poem-page-refined">
        <div className="single-poem-not-found">
          <span>✧</span>
          <p className="single-poem-eyebrow">
            СТРАНИЦА НЕ НАЙДЕНА
          </p>
          <h1>Стихотворение не найдено</h1>
          <p>
            Возможно, произведение ещё не опубликовано или было удалено.
          </p>
          <Link href="/" className="single-poem-back-button">
            Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="single-poem-page single-poem-page-refined">
      <PoemViewCounter poemId={poem.id} />

      <header className="single-poem-top single-poem-top-refined">
        <Link href="/" className="single-poem-back">
          <span>←</span> На главную
        </Link>

        <Link href="/authors" className="single-poem-authors-link">
          Наши авторы
        </Link>
      </header>

      <article className="single-poem-card single-poem-card-refined">
        <div className="single-poem-card-ornament">✦</div>

        <p className="single-poem-language">
          {poem.language === "ru" ? "РУССКИЙ ЯЗЫК" : "ENGLISH"}
        </p>

        <h1>{poem.title}</h1>

        <div className="single-poem-title-divider">
          <span />
          ✧
          <span />
        </div>

        <p className="single-poem-date">
          {new Date(poem.created_at).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <div className="single-poem-content single-poem-content-refined">
          {poem.content}
        </div>

        <div className="single-poem-actions">
          <LikeButton poemId={poem.id} />
          <FavoriteButton poemId={poem.id} />
        </div>

        {author && (
          <div className="single-poem-author single-poem-author-refined">
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.display_name || "Автор"}
              />
            ) : (
              <div className="comment-avatar-placeholder">✒</div>
            )}

            <div className="single-poem-author-info">
              <p>АВТОР ПРОИЗВЕДЕНИЯ</p>

              <Link
                href={`/authors/${encodeURIComponent(author.username)}`}
              >
                {author.display_name || author.username}
              </Link>
            </div>

            <span className="single-poem-author-mark">✦</span>
          </div>
        )}
      </article>

      <section className="comments-section comments-section-refined">
        <div className="comments-heading">
          <p className="single-poem-eyebrow">
            ГОЛОСА ЧИТАТЕЛЕЙ
          </p>

          <h2>Отклики читателей</h2>

          <p className="comments-description">
            Делитесь впечатлениями и поддерживайте авторов.
          </p>

          <div className="single-poem-title-divider">
            <span />
            ✧
            <span />
          </div>
        </div>

        <form
          className="comment-form comment-form-refined"
          onSubmit={sendComment}
        >
          <label htmlFor="comment">
            Оставить комментарий
          </label>

          <textarea
            id="comment"
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Напиши, что ты почувствовал, читая это произведение..."
            maxLength={2000}
            rows={5}
          />

          <div className="comment-form-bottom">
            <span>{commentText.length}/2000</span>

            <button type="submit" disabled={sending}>
              {sending ? "Отправляем..." : "Отправить на проверку"}
            </button>
          </div>

          {message && (
            <p className="comment-message">{message}</p>
          )}
        </form>

        <div className="comments-list comments-list-refined">
          {comments.length === 0 ? (
            <div className="comments-empty comments-empty-refined">
              <span>✧</span>
              <p>Пока нет опубликованных комментариев.</p>
              <small>Твой отклик может стать первым.</small>
            </div>
          ) : (
            comments.map((comment) => (
              <article
                className="comment-card comment-card-refined"
                key={comment.id}
              >
                <div className="comment-author comment-author-refined">
                  {comment.author?.avatar_url ? (
                    <img
                      src={comment.author.avatar_url}
                      alt={
                        comment.author.display_name || "Читатель"
                      }
                    />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      ✒
                    </div>
                  )}

                  <div>
                    {comment.author ? (
                      <Link
                        href={`/authors/${encodeURIComponent(
                          comment.author.username
                        )}`}
                      >
                        {comment.author.display_name ||
                          comment.author.username}
                      </Link>
                    ) : (
                      <span>Читатель</span>
                    )}

                    <p>
                      {new Date(
                        comment.created_at
                      ).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <p className="comment-content comment-content-refined">
                  {comment.content}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <footer className="single-poem-footer">
        <span>✦</span>
        <p>Перо и Муза — слова объединяют мир.</p>
        <span>✦</span>
      </footer>
    </main>
  );
}

export default function PoemPage() {
  return (
    <Suspense
      fallback={
        <main className="single-poem-page single-poem-page-refined">
          <div className="single-poem-loading">
            <span>✦</span>
            <p>Открываем страницу произведения...</p>
          </div>
        </main>
      }
    >
      <PoemPageContent />
    </Suspense>
  );
}