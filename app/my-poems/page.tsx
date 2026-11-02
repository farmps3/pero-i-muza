
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase";

type Poem = {
  id: string;
  title: string;
  content: string;
  language: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function MyPoemsPage() {
  const router = useRouter();

  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLanguage, setEditLanguage] = useState("ru");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function loadPoems() {
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("poems")
        .select("id, title, content, language, status, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage("Не удалось загрузить произведения: " + error.message);
      } else {
        setPoems(data || []);
      }
    } catch {
      setMessage("Произошла ошибка при загрузке произведений.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPoems();
  }, []);

  function getStatus(status: Poem["status"]) {
    if (status === "approved") return "Опубликовано";
    if (status === "rejected") return "Не одобрено";
    return "На модерации";
  }

  function startEditing(poem: Poem) {
    setEditingId(poem.id);
    setEditTitle(poem.title);
    setEditContent(poem.content);
    setEditLanguage(poem.language);
    setMessage("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditLanguage("ru");
  }

  async function savePoem(poem: Poem) {
    if (!editTitle.trim() || !editContent.trim()) {
      setMessage("Заполни название и текст стихотворения.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("poems")
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          language: editLanguage,
          status: "pending",
        })
        .eq("id", poem.id);

      if (error) {
        setMessage("Не удалось сохранить изменения: " + error.message);
        return;
      }

      cancelEditing();
      await loadPoems();
      setMessage(
        "Изменения сохранены. Стихотворение отправлено на повторную модерацию."
      );
    } catch {
      setMessage("Произошла ошибка при сохранении стихотворения.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePoem(poem: Poem) {
    const confirmed = window.confirm(
      `Ты действительно хочешь удалить стихотворение «${poem.title}»? Это действие нельзя отменить.`
    );

    if (!confirmed) return;

    setDeletingId(poem.id);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("poems")
        .delete()
        .eq("id", poem.id);

      if (error) {
        setMessage("Не удалось удалить стихотворение: " + error.message);
        return;
      }

      setPoems((current) =>
        current.filter((item) => item.id !== poem.id)
      );

      if (editingId === poem.id) {
        cancelEditing();
      }

      setMessage("Стихотворение успешно удалено.");
    } catch {
      setMessage("Произошла ошибка при удалении стихотворения.");
    } finally {
      setDeletingId(null);
    }
  }

  const publishedCount = poems.filter(
    (poem) => poem.status === "approved"
  ).length;

  const pendingCount = poems.filter(
    (poem) => poem.status === "pending"
  ).length;

  const rejectedCount = poems.filter(
    (poem) => poem.status === "rejected"
  ).length;

  if (loading) {
    return (
      <main className="profile-page my-poems-page">
        <div className="my-poems-loading">
          <span>✦</span>
          <p>Собираем твои произведения...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page my-poems-page">
      <section className="profile-card my-poems-card">
        <header className="my-poems-header">
          <Link href="/" className="register-logo">
            Перо и Муза
          </Link>

          <button
            type="button"
            className="my-poems-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <nav
            className={`my-poems-nav ${
              mobileMenuOpen ? "is-open" : ""
            }`}
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              Главная
            </Link>
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
            >
              Мой кабинет
            </Link>
            <Link
              href="/authors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Авторы
            </Link>
            <Link
              href="/new-poem"
              onClick={() => setMobileMenuOpen(false)}
            >
              Написать стихотворение
            </Link>
          </nav>
        </header>

        <div className="my-poems-heading">
          <p className="register-label">
            ТВОЁ ЛИТЕРАТУРНОЕ ПРОСТРАНСТВО
          </p>

          <div className="my-poems-ornament">✦</div>

          <h1>Мои произведения</h1>

          <div className="my-poems-divider">
            <span />
            ✦
            <span />
          </div>

          <p className="register-description">
            Каждое стихотворение — часть твоей истории.
            Здесь собраны все твои произведения и их путь к читателю.
          </p>

          <Link href="/new-poem" className="my-poems-button">
            <span>＋</span> Добавить стихотворение
          </Link>
        </div>

        {poems.length > 0 && (
          <div className="my-poems-statistics">
            <div className="my-poems-stat">
              <strong>{poems.length}</strong>
              <span>Всего</span>
            </div>

            <div className="my-poems-stat">
              <strong>{publishedCount}</strong>
              <span>Опубликовано</span>
            </div>

            <div className="my-poems-stat">
              <strong>{pendingCount}</strong>
              <span>На модерации</span>
            </div>

            <div className="my-poems-stat">
              <strong>{rejectedCount}</strong>
              <span>Не одобрено</span>
            </div>
          </div>
        )}

        {message && (
          <p className="register-message my-poems-message">
            {message}
          </p>
        )}

        {!message && poems.length === 0 && (
          <div className="my-poems-empty">
            <div className="my-poems-empty-symbol">✧</div>
            <h2>Твоя первая история ещё впереди</h2>
            <p>
              Здесь пока нет стихотворений. Возможно,
              самое время подарить миру свои первые строки.
            </p>
            <Link href="/new-poem" className="my-poems-empty-link">
              Написать первое стихотворение →
            </Link>
          </div>
        )}

        <div className="my-poems-list">
          {poems.map((poem) => (
            <article className="my-poem-item" key={poem.id}>
              {editingId === poem.id ? (
                <div className="my-poem-editor">
                  <p className="my-poem-editor-label">
                    РАБОТА НАД ПРОИЗВЕДЕНИЕМ
                  </p>

                  <h2>Редактирование</h2>

                  <label htmlFor={`title-${poem.id}`}>
                    Название произведения
                  </label>

                  <input
                    id={`title-${poem.id}`}
                    type="text"
                    value={editTitle}
                    onChange={(event) =>
                      setEditTitle(event.target.value)
                    }
                    maxLength={150}
                  />

                  <label htmlFor={`language-${poem.id}`}>
                    Язык произведения
                  </label>

                  <select
                    id={`language-${poem.id}`}
                    value={editLanguage}
                    onChange={(event) =>
                      setEditLanguage(event.target.value)
                    }
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>

                  <label htmlFor={`content-${poem.id}`}>
                    Текст произведения
                  </label>

                  <textarea
                    id={`content-${poem.id}`}
                    value={editContent}
                    onChange={(event) =>
                      setEditContent(event.target.value)
                    }
                    rows={12}
                  />

                  <div className="my-poem-actions">
                    <button
                      type="button"
                      className="my-poem-save"
                      onClick={() => savePoem(poem)}
                      disabled={saving}
                    >
                      {saving ? "Сохраняем..." : "Сохранить изменения"}
                    </button>

                    <button
                      type="button"
                      className="my-poem-cancel"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Отмена
                    </button>
                  </div>

                  <p className="my-poem-editor-note">
                    После сохранения произведение снова отправится
                    на модерацию.
                  </p>
                </div>
              ) : (
                <>
                  <div className="my-poem-card-top">
                    <span className="my-poem-card-symbol">✦</span>

                    <span
                      className={`my-poem-status status-${poem.status}`}
                    >
                      {getStatus(poem.status)}
                    </span>
                  </div>

                  <h2>{poem.title}</h2>

                  <p className="my-poem-content">
                    {poem.content}
                  </p>

                  <div className="my-poem-meta">
                    <span>
                      {poem.language === "ru" ? "Русский" : "English"}
                    </span>
                    <span className="my-poem-meta-separator">·</span>
                    <span>
                      {new Date(poem.created_at).toLocaleDateString(
                        "ru-RU",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>

                  {poem.status === "rejected" && (
                    <p className="my-poem-rejected-note">
                      Произведение не прошло модерацию. Ты можешь
                      внести изменения и отправить его на проверку снова.
                    </p>
                  )}

                  <div className="my-poem-actions">
                    <button
                      type="button"
                      className="my-poem-edit"
                      onClick={() => startEditing(poem)}
                    >
                      ✎ Редактировать
                    </button>

                    <button
                      type="button"
                      className="my-poem-delete"
                      onClick={() => deletePoem(poem)}
                      disabled={deletingId === poem.id}
                    >
                      {deletingId === poem.id
                        ? "Удаляем..."
                        : "Удалить"}
                    </button>

                    {poem.status === "approved" && (
                      <Link
                        href={`/poems/${poem.id}`}
                        className="my-poem-open"
                      >
                        Читать →
                      </Link>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>

        <Link href="/profile" className="register-back">
          ← Вернуться в личный кабинет
        </Link>
      </section>
    </main>
  );
}
