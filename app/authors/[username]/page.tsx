"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../../lib/supabase";

type Profile = {
  id: string;
  display_name: string | null;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
};

type Poem = {
  id: string;
  title: string;
  content: string;
  language: string;
  created_at: string;
};

function AuthorPageContent() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthor() {
      const supabase = createClient();

      setLoading(true);
      setNotFound(false);

      const { data: author, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (cancelled) return;

      if (error || !author) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(author);

      const { data: authorPoems, error: poemsError } = await supabase
        .from("poems")
        .select("id, title, content, language, created_at")
        .eq("author_id", author.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (poemsError) {
        console.error(
          "Ошибка загрузки стихотворений:",
          poemsError.message
        );
      }

      setPoems(authorPoems || []);

      const { count: followers, error: followersError } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", author.id);

      if (cancelled) return;

      if (!followersError) {
        setFollowersCount(followers || 0);
      }

      const { count: following, error: followingError } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", author.id);

      if (cancelled) return;

      if (!followingError) {
        setFollowingCount(following || 0);
      }

      const { data: authData } = await supabase.auth.getUser();

      if (cancelled) return;

      const userId = authData.user?.id || null;
      setCurrentUserId(userId);

      if (userId) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", userId)
          .eq("following_id", author.id)
          .maybeSingle();

        if (cancelled) return;

        setIsFollowing(!!followData);
      } else {
        setIsFollowing(false);
      }

      setLoading(false);
    }

    if (username) {
      loadAuthor();
    }

    return () => {
      cancelled = true;
    };
  }, [username]);

  async function toggleFollow() {
    if (!profile || followLoading) return;

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setMessage("Чтобы подписаться, сначала войди в аккаунт.");
      return;
    }

    if (authData.user.id === profile.id) {
      setMessage("Нельзя подписаться на самого себя.");
      return;
    }

    setFollowLoading(true);
    setMessage("");

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", authData.user.id)
        .eq("following_id", profile.id);

      if (error) {
        setMessage("Не удалось отменить подписку: " + error.message);
      } else {
        setIsFollowing(false);
        setFollowersCount((count) => Math.max(0, count - 1));
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: authData.user.id,
          following_id: profile.id,
        });

      if (error) {
        setMessage("Не удалось подписаться: " + error.message);
      } else {
        setIsFollowing(true);
        setFollowersCount((count) => count + 1);
      }
    }

    setFollowLoading(false);
  }

  if (loading) {
    return (
      <main className="author-page author-page-refined">
        <div className="author-loading">
          <span className="author-loading-mark">✦</span>
          <p>Открываем страницу автора...</p>
        </div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="author-page author-page-refined">
        <div className="author-not-found">
          <span>✧</span>
          <p className="author-label">СТРАНИЦА НЕ НАЙДЕНА</p>
          <h1>Автор не найден</h1>
          <p>
            Возможно, эта страница была удалена или адрес указан неверно.
          </p>
          <Link href="/" className="author-back-link">
            Вернуться на главную
          </Link>
        </div>
      </main>
    );
  }

  const authorName = profile.display_name || profile.username;

  return (
    <main className="author-page author-page-refined">
      <header className="author-header author-header-refined">
        <Link
          href="/"
          className="author-logo"
          onClick={() => setMobileMenuOpen(false)}
        >
          Перо и Муза
        </Link>

        <button
          type="button"
          className="author-menu-toggle"
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

          <Link href="/authors" onClick={() => setMobileMenuOpen(false)}>
            Авторы
          </Link>

          <Link href="/following" onClick={() => setMobileMenuOpen(false)}>
            Мои подписки
          </Link>
        </nav>
      </header>

      <section className="author-profile author-profile-refined">
        <div className="author-cover author-cover-refined">
          {profile.cover_url ? (
            <img
              src={profile.cover_url}
              alt={`Обложка автора ${authorName}`}
            />
          ) : (
            <div className="author-cover-placeholder">
              <span className="author-cover-star">✦</span>
              <span>ПЕРО И МУЗА</span>
              <small>ЛИТЕРАТУРНОЕ ПРОСТРАНСТВО</small>
            </div>
          )}

          <div className="author-cover-shade" />
        </div>

        <div className="author-avatar-wrap">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`Фотография автора ${authorName}`}
              className="author-avatar author-avatar-refined"
            />
          ) : (
            <div className="author-avatar-placeholder author-avatar-placeholder-refined">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="author-identity">
          <p className="author-label">
            АВТОР ЛИТЕРАТУРНОГО ПРОСТРАНСТВА
          </p>

          <h1>{authorName}</h1>

          <p className="author-username">@{profile.username}</p>

          <div className="author-title-divider">
            <span />
            ✦
            <span />
          </div>

          <p className="author-bio">
            {profile.bio || "Этот автор пока не добавил описание."}
          </p>
        </div>

        <div className="author-statistics author-statistics-refined">
          <div className="author-stat">
            <strong>{poems.length}</strong>
            <span>Стихотворений</span>
          </div>

          <div className="author-stat">
            <strong>{followersCount}</strong>
            <span>Подписчиков</span>
          </div>

          <div className="author-stat">
            <strong>{followingCount}</strong>
            <span>Подписок</span>
          </div>
        </div>

        {currentUserId !== profile.id && (
          <button
            type="button"
            className={`author-follow-button author-follow-button-refined ${
              isFollowing ? "is-following" : ""
            }`}
            onClick={toggleFollow}
            disabled={followLoading}
          >
            {followLoading
              ? "Подождите..."
              : isFollowing
                ? "Вы подписаны ✓"
                : "Подписаться"}
          </button>
        )}

        {message && (
          <p className="author-follow-message">{message}</p>
        )}
      </section>

      <section className="author-works author-works-refined">
        <div className="author-works-heading">
          <p className="author-label">ТВОРЧЕСТВО</p>
          <h2>Произведения автора</h2>

          <p className="author-works-description">
            Каждое стихотворение — отдельная история, сохранённая в словах.
          </p>

          <div className="author-title-divider">
            <span />
            ✦
            <span />
          </div>
        </div>

        {poems.length === 0 ? (
          <div className="author-empty author-empty-refined">
            <span>✧</span>
            <h3>Пока здесь тихо</h3>
            <p>У автора ещё нет опубликованных стихотворений.</p>
          </div>
        ) : (
          <div className="author-poems author-poems-refined">
            {poems.map((poem) => (
              <article
                className="author-poem author-poem-refined"
                key={poem.id}
              >
                <div className="author-poem-topline">
                  <p className="author-poem-language">
                    {poem.language === "ru"
                      ? "РУССКИЙ ЯЗЫК"
                      : "ENGLISH"}
                  </p>

                  <span className="author-poem-star">✦</span>
                </div>

                <h3>{poem.title}</h3>

                <div className="author-poem-divider" />

                <p className="author-poem-content">
                  {poem.content}
                </p>

                <div className="author-poem-bottom">
                  <p className="author-poem-date">
                    {new Date(poem.created_at).toLocaleDateString("ru-RU")}
                  </p>

                  <Link
                    href={`/poems/${poem.id}`}
                    className="home-poem-read author-poem-read-refined"
                  >
                    Читать полностью <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="author-footer author-footer-refined">
        <span>✦</span>
        <p>Перо и Муза — слова объединяют мир.</p>
        <span>✦</span>
      </footer>
    </main>
  );
}

export default function AuthorPage() {
  return (
    <Suspense
      fallback={
        <main className="author-page author-page-refined">
          <div className="author-loading">
            <span className="author-loading-mark">✦</span>
            <p>Открываем страницу автора...</p>
          </div>
        </main>
      }
    >
      <AuthorPageContent />
    </Suspense>
  );
}