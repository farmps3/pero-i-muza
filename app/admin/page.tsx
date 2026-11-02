
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type Poem = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
};

type Comment = {
  id: string;
  poem_id: string;
  author_id: string;
  content: string;
  created_at: string;
  authorName?: string;
  poemTitle?: string;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"poems" | "comments">("poems");
  const [poems, setPoems] = useState<Poem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = createClient();

  async function loadData() {
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setMessage("Сначала войди в аккаунт администратора.");
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data: adminResult, error: adminError } =
      await supabase.rpc("is_admin");

    if (adminError || !adminResult) {
      setMessage("У тебя нет доступа к административной панели.");
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    const [poemsResult, commentsResult] = await Promise.all([
      supabase
        .from("poems")
        .select("id, title, content, author_id, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),

      supabase
        .from("comments")
        .select("id, poem_id, author_id, content, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

    if (poemsResult.error) {
      setMessage("Ошибка загрузки стихотворений: " + poemsResult.error.message);
    } else {
      setPoems(poemsResult.data || []);
    }

    if (commentsResult.error) {
      setMessage("Ошибка загрузки комментариев: " + commentsResult.error.message);
      setComments([]);
    } else {
      const commentRows = commentsResult.data || [];

      if (commentRows.length > 0) {
        const authorIds = [...new Set(commentRows.map((item) => item.author_id))];
        const poemIds = [...new Set(commentRows.map((item) => item.poem_id))];

        const [authorsResult, poemsForCommentsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", authorIds),

          supabase
            .from("poems")
            .select("id, title")
            .in("id", poemIds),
        ]);

        const enrichedComments = commentRows.map((comment) => {
          const author = authorsResult.data?.find(
            (item) => item.id === comment.author_id
          );

          const poem = poemsForCommentsResult.data?.find(
            (item) => item.id === comment.poem_id
          );

          return {
            ...comment,
            authorName:
              author?.display_name || author?.username || "Читатель",
            poemTitle: poem?.title || "Стихотворение",
          };
        });

        setComments(enrichedComments);
      } else {
        setComments([]);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function moderatePoem(id: string, status: "approved" | "rejected") {
    if (processingId) return;

    setProcessingId(id);

    const { error } = await supabase
      .from("poems")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage("Не удалось изменить стихотворение: " + error.message);
      setProcessingId(null);
      return;
    }

    setMessage(
      status === "approved"
        ? "Стихотворение опубликовано!"
        : "Стихотворение отклонено."
    );

    setProcessingId(null);
    await loadData();
  }

  async function moderateComment(
    id: string,
    status: "approved" | "rejected"
  ) {
    if (processingId) return;

    setProcessingId(id);

    const { error } = await supabase
      .from("comments")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage("Не удалось изменить комментарий: " + error.message);
      setProcessingId(null);
      return;
    }

    setMessage(
      status === "approved"
        ? "Комментарий опубликован!"
        : "Комментарий отклонён."
    );

    setProcessingId(null);
    await loadData();
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">Загружаем кабинет...</div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <div className="admin-container">
          <h1>Доступ запрещён</h1>
          <p>{message}</p>
          <Link href="/" className="admin-back-link">
            Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link
          href="/"
          className="admin-logo"
          onClick={() => setMobileMenuOpen(false)}
        >
          Перо и Муза
        </Link>

        <button
          type="button"
          className="admin-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <nav className={mobileMenuOpen ? "admin-nav is-open" : "admin-nav"}>
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            Главная
          </Link>
          <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
            Моя визитка
          </Link>
          <Link href="/my-poems" onClick={() => setMobileMenuOpen(false)}>
            Мои стихи
          </Link>
        </nav>
      </header>

      <div className="admin-container">
        <p className="admin-section-label">УПРАВЛЕНИЕ ПРОЕКТОМ</p>

        <h1>Кабинет администратора</h1>

        <p className="admin-description">
          Управление публикациями проекта «Перо и Муза».
        </p>

        <div className="admin-tabs">
          <button
            className={activeTab === "poems" ? "active" : ""}
            onClick={() => setActiveTab("poems")}
          >
            Стихотворения ({poems.length})
          </button>

          <button
            className={activeTab === "comments" ? "active" : ""}
            onClick={() => setActiveTab("comments")}
          >
            Комментарии ({comments.length})
          </button>
        </div>

        {message && <p className="admin-message">{message}</p>}

        {activeTab === "poems" && (
          <section className="admin-moderation-section">
            <h2>Стихотворения на проверку</h2>

            {poems.length === 0 ? (
              <p className="admin-empty">Новых стихотворений пока нет.</p>
            ) : (
              poems.map((poem) => (
                <article className="admin-item" key={poem.id}>
                  <h3>{poem.title}</h3>

                  <p className="admin-item-date">
                    {new Date(poem.created_at).toLocaleString("ru-RU")}
                  </p>

                  <p className="admin-item-content">{poem.content}</p>

                  <div className="admin-actions">
                    <button
                      className="admin-approve"
                      disabled={processingId !== null}
                      onClick={() => moderatePoem(poem.id, "approved")}
                    >
                      {processingId === poem.id ? "Обработка..." : "Одобрить"}
                    </button>

                    <button
                      className="admin-reject"
                      disabled={processingId !== null}
                      onClick={() => moderatePoem(poem.id, "rejected")}
                    >
                      Отклонить
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {activeTab === "comments" && (
          <section className="admin-moderation-section">
            <h2>Комментарии на проверку</h2>

            {comments.length === 0 ? (
              <p className="admin-empty">Новых комментариев пока нет.</p>
            ) : (
              comments.map((comment) => (
                <article className="admin-item" key={comment.id}>
                  <p className="admin-item-date">
                    Автор: {comment.authorName}
                  </p>

                  <h3>К стихотворению: {comment.poemTitle}</h3>

                  <p className="admin-item-date">
                    {new Date(comment.created_at).toLocaleString("ru-RU")}
                  </p>

                  <p className="admin-item-content">{comment.content}</p>

                  <div className="admin-actions">
                    <button
                      className="admin-approve"
                      disabled={processingId !== null}
                      onClick={() => moderateComment(comment.id, "approved")}
                    >
                      {processingId === comment.id ? "Обработка..." : "Одобрить"}
                    </button>

                    <button
                      className="admin-reject"
                      disabled={processingId !== null}
                      onClick={() => moderateComment(comment.id, "rejected")}
                    >
                      Отклонить
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        <button
          className="admin-refresh"
          onClick={loadData}
          disabled={loading || processingId !== null}
        >
          Обновить список
        </button>
      </div>
    </main>
  );
}
