
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type Notification = {
  id: string;
  actor_id: string | null;
  poem_id: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  authorName: string;
  username: string;
  poemTitle: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const supabase = createClient();
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (cancelled) return;

        if (authError || !authData.user) {
          setMessage("Войди в аккаунт, чтобы увидеть свои уведомления.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select("id, actor_id, poem_id, type, is_read, created_at")
          .eq("user_id", authData.user.id)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (error) {
          setMessage("Не удалось загрузить уведомления: " + error.message);
          setLoading(false);
          return;
        }

        const rows = data || [];

        const actorIds = [
          ...new Set(
            rows
              .map((item) => item.actor_id)
              .filter((id): id is string => !!id)
          ),
        ];

        const poemIds = [
          ...new Set(
            rows
              .map((item) => item.poem_id)
              .filter((id): id is string => !!id)
          ),
        ];

        let profiles: {
          id: string;
          display_name: string | null;
          username: string;
        }[] = [];

        let poems: {
          id: string;
          title: string;
        }[] = [];

        if (actorIds.length > 0) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", actorIds);

          profiles = profileData || [];
        }

        if (cancelled) return;

        if (poemIds.length > 0) {
          const { data: poemData } = await supabase
            .from("poems")
            .select("id, title")
            .in("id", poemIds);

          poems = poemData || [];
        }

        if (cancelled) return;

        const prepared: Notification[] = rows.map((item) => {
          const author = profiles.find(
            (profile) => profile.id === item.actor_id
          );

          const poem = poems.find(
            (entry) => entry.id === item.poem_id
          );

          return {
            ...item,
            authorName:
              author?.display_name || author?.username || "Автор",
            username: author?.username || "",
            poemTitle: poem?.title || "Произведение",
          };
        });

        setNotifications(prepared);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setMessage("Произошла ошибка при загрузке уведомлений.");
          setLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  async function markAsRead(id: string) {
    const supabase = createClient();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      setMessage("Не удалось отметить уведомление прочитанным.");
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  }

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length;

  return (
    <main className="author-page notifications-page">
      <header className="author-header">
        <Link href="/" className="author-logo">
          Перо и Муза
        </Link>

        <nav>
          <Link href="/">На главную</Link>
          <Link href="/authors">Авторы</Link>
          <Link href="/following">Мои подписки</Link>
        </nav>
      </header>

      <section className="author-works notifications-section">
        <div className="notifications-heading">
          <p className="author-label">
            ВАШЕ ЛИТЕРАТУРНОЕ ПРОСТРАНСТВО
          </p>

          <div className="notifications-ornament">✦</div>

          <h1>Уведомления</h1>

          <div className="notifications-divider">
            <span />
            ✦
            <span />
          </div>

          <p className="notifications-description">
            Здесь собраны события, связанные с вашими авторами
            и произведениями.
          </p>

          {!loading && !message && notifications.length > 0 && (
            <div className="notifications-summary">
              <span>
                Всего событий: {notifications.length}
              </span>
              <span className="notifications-unread-count">
                Непрочитанных: {unreadCount}
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="notifications-state">
            <div className="notifications-state-symbol">✦</div>
            <p>Собираем ваши уведомления...</p>
          </div>
        ) : message ? (
          <div className="notifications-state">
            <div className="notifications-state-symbol">✧</div>
            <p>{message}</p>
            <Link href="/login" className="notifications-login-link">
              Войти в аккаунт
            </Link>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-state">
            <div className="notifications-state-symbol">✧</div>
            <h2>Пока здесь тихо</h2>
            <p>
              Когда у авторов, на которых вы подписаны,
              появятся новые произведения, уведомления
              будут собраны здесь.
            </p>
            <Link href="/authors" className="notifications-login-link">
              Открыть каталог авторов
            </Link>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((item) => (
              <article
                className={
                  item.is_read
                    ? "notification-card"
                    : "notification-card notification-unread"
                }
                key={item.id}
              >
                <div className="notification-card-mark">
                  {item.is_read ? "✧" : "✦"}
                </div>

                <div className="notification-content">
                  <div className="notification-topline">
                    <p className="notification-label">
                      {item.is_read
                        ? "Прочитано"
                        : "Новое уведомление"}
                    </p>

                    {!item.is_read && (
                      <span className="notification-new-dot" />
                    )}
                  </div>

                  <p className="notification-message">
                    <strong>{item.authorName}</strong>{" "}
                    опубликовал(а) новое произведение:
                  </p>

                  <h3>{item.poemTitle}</h3>

                  <p className="notification-date">
                    {new Date(item.created_at).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <div className="notification-actions">
                    {item.poem_id && (
                      <Link
                        href={`/poems/${item.poem_id}`}
                        className="home-poem-read"
                        onClick={() => {
                          if (!item.is_read) {
                            void markAsRead(item.id);
                          }
                        }}
                      >
                        Читать произведение →
                      </Link>
                    )}

                    {!item.is_read && (
                      <button
                        className="notification-read-button"
                        onClick={() => markAsRead(item.id)}
                      >
                        Отметить прочитанным
                      </button>
                    )}
                  </div>

                  {item.username && (
                    <p className="notification-author-link">
                      <Link
                        href={`/authors/${encodeURIComponent(item.username)}`}
                      >
                        Страница автора
                      </Link>
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="author-footer">
        Перо и Муза — слова объединяют мир.
      </footer>
    </main>
  );
}
