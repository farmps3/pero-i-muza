"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

type AuthorStats = {
  poems: number;
  published: number;
  pending: number;
  likes: number;
  followers: number;
  views: number;
};

const emptyStats: AuthorStats = {
  poems: 0,
  published: 0,
  pending: 0,
  likes: 0,
  followers: 0,
  views: 0,
};

export default function ProfilePage() {
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [coverUrl, setCoverUrl] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [stats, setStats] = useState<AuthorStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function loadStats(
    authorId: string,
    isActive: () => boolean
  ) {
    const [
      { data: poems, error: poemsError },
      { count: followers, error: followersError },
    ] = await Promise.all([
      supabase
        .from("poems")
        .select("id, status")
        .eq("author_id", authorId),

      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", authorId),
    ]);

    if (poemsError || followersError) {
      console.error(
        "Ошибка загрузки статистики:",
        poemsError || followersError
      );
      return;
    }

    const allPoems = poems || [];
    const approvedPoems = allPoems.filter(
      (poem) => poem.status === "approved"
    );
    const pendingPoems = allPoems.filter(
      (poem) => poem.status === "pending"
    );

    const poemIds = approvedPoems.map((poem) => poem.id);

    let likesCount = 0;
    let viewsCount = 0;

    if (poemIds.length > 0) {
      const [
        { count: likes, error: likesError },
        { count: views, error: viewsError },
      ] = await Promise.all([
        supabase
          .from("likes")
          .select("id", { count: "exact", head: true })
          .in("poem_id", poemIds),

        supabase
          .from("poem_views")
          .select("id", { count: "exact", head: true })
          .in("poem_id", poemIds),
      ]);

      if (likesError) {
        console.error("Ошибка подсчёта лайков:", likesError.message);
      } else {
        likesCount = likes || 0;
      }

      if (viewsError) {
        console.error("Ошибка подсчёта просмотров:", viewsError.message);
      } else {
        viewsCount = views || 0;
      }
    }

    if (!isActive()) return;

    setStats({
      poems: allPoems.length,
      published: approvedPoems.length,
      pending: pendingPoems.length,
      likes: likesCount,
      followers: followers || 0,
      views: viewsCount,
    });
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
          window.location.href = "/login";
          return;
        }

        if (!active) return;

        setUserId(user.id);
        setEmail(user.email || "");

        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, username, bio, avatar_url, cover_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setMessageError(true);
          setMessage("Не удалось загрузить профиль: " + error.message);
        } else if (data) {
          setDisplayName(data.display_name || "");
          setUsername(data.username || "");
          setBio(data.bio || "");
          setAvatarUrl(data.avatar_url || "");
          setCoverUrl(data.cover_url || "");
        }

        await loadStats(user.id, () => active);
      } catch (error) {
        if (active) {
          setMessageError(true);
          setMessage(
            "Не удалось загрузить кабинет: " +
              (error instanceof Error
                ? error.message
                : "Неизвестная ошибка")
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(avatarFile);
    setAvatarPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [avatarFile]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(coverFile);
    setCoverPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [coverFile]);

  async function uploadImage(file: File, folder: string) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Выбери файл изображения.");
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Размер изображения не должен превышать 5 МБ.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/${folder}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setMessageError(false);

    try {
      if (!userId) {
        throw new Error("Не удалось определить пользователя.");
      }

      const cleanUsername = username.trim().toLowerCase();
      const cleanDisplayName = displayName.trim();
      const cleanBio = bio.trim();

      if (!cleanUsername) {
        throw new Error("Укажи имя пользователя.");
      }

      if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
        throw new Error(
          "Псевдоним должен содержать от 3 до 30 символов: английские буквы, цифры и нижнее подчёркивание."
        );
      }

      if (cleanDisplayName.length > 60) {
        throw new Error("Имя не должно превышать 60 символов.");
      }

      if (cleanBio.length > 1000) {
        throw new Error("Описание не должно превышать 1000 символов.");
      }

      const { data: existingUser, error: usernameError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("username", cleanUsername)
          .neq("id", userId)
          .maybeSingle();

      if (usernameError) {
        throw new Error(
          "Не удалось проверить псевдоним: " + usernameError.message
        );
      }

      if (existingUser) {
        throw new Error("Этот псевдоним уже занят. Попробуй другой.");
      }

      let newAvatarUrl = avatarUrl;
      let newCoverUrl = coverUrl;

      if (avatarFile) {
        newAvatarUrl = await uploadImage(avatarFile, "avatar");
      }

      if (coverFile) {
        newCoverUrl = await uploadImage(coverFile, "cover");
      }

      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          display_name: cleanDisplayName,
          username: cleanUsername,
          bio: cleanBio,
          avatar_url: newAvatarUrl,
          cover_url: newCoverUrl,
        },
        { onConflict: "id" }
      );

      if (error) throw new Error(error.message);

      setAvatarUrl(newAvatarUrl);
      setCoverUrl(newCoverUrl);
      setAvatarFile(null);
      setCoverFile(null);
      setUsername(cleanUsername);
      setMessageError(false);
      setMessage("Твоя визитка успешно обновлена! ❤️");
    } catch (error) {
      setMessageError(true);
      setMessage(
        "Ошибка сохранения: " +
          (error instanceof Error ? error.message : "Неизвестная ошибка")
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="profile-page profile-dashboard-page">
        <div className="profile-loading">
          <span className="profile-loading-symbol">✦</span>
          <p>Открываем твоё литературное пространство...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page profile-dashboard-page">
      <div className="profile-card profile-card-expanded profile-dashboard-card profile-dashboard-redesign">
        <header className="profile-dashboard-header">
          <Link href="/" className="register-logo">
            Перо и Муза
          </Link>

          <button
            type="button"
            className="profile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <nav
            className={`profile-dashboard-nav ${
              mobileMenuOpen ? "is-open" : ""
            }`}
          >
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              Главная
            </Link>
            <Link href="/authors" onClick={() => setMobileMenuOpen(false)}>
              Авторы
            </Link>
            <Link href="/my-poems" onClick={() => setMobileMenuOpen(false)}>
              Мои стихи
            </Link>
            <Link href="/favorites" onClick={() => setMobileMenuOpen(false)}>
              Избранное
            </Link>
          </nav>
        </header>

        <section className="profile-dashboard-intro">
          <p className="register-label">
            ТВОЁ ЛИТЕРАТУРНОЕ ПРОСТРАНСТВО
          </p>

          <div className="profile-dashboard-ornament">✦</div>

          <h1>Мой кабинет</h1>

          <p className="register-description">
            Твоё творчество, твои читатели и твоя литературная история.
          </p>

          {displayName && (
            <p className="profile-dashboard-welcome">
              Рады видеть тебя, {displayName}
            </p>
          )}
        </section>

        <section className="author-dashboard profile-stats-section">
          <div className="profile-section-heading">
            <span className="profile-section-kicker">ТВОЙ ТВОРЧЕСКИЙ ПУТЬ</span>
            <h2>Моя статистика</h2>
            <p>Здесь собраны маленькие свидетельства твоей большой работы.</p>
          </div>

          <div className="author-stats-grid profile-stats-redesign">
            <div className="author-stat-card">
              <span className="author-stat-icon">✍</span>
              <strong>{stats.poems}</strong>
              <span>Всего произведений</span>
            </div>

            <div className="author-stat-card">
              <span className="author-stat-icon">❧</span>
              <strong>{stats.published}</strong>
              <span>Опубликовано</span>
            </div>

            <div className="author-stat-card">
              <span className="author-stat-icon">◷</span>
              <strong>{stats.pending}</strong>
              <span>На модерации</span>
            </div>

            <div className="author-stat-card">
              <span className="author-stat-icon">♡</span>
              <strong>{stats.likes}</strong>
              <span>Лайков получено</span>
            </div>

            <div className="author-stat-card">
              <span className="author-stat-icon">♧</span>
              <strong>{stats.followers}</strong>
              <span>Подписчиков</span>
            </div>

            <div className="author-stat-card">
              <span className="author-stat-icon">◉</span>
              <strong>{stats.views}</strong>
              <span>Просмотров стихов</span>
            </div>
          </div>
        </section>

        <section className="profile-dashboard-shortcuts">
          <div className="profile-section-heading">
            <span className="profile-section-kicker">БЫСТРЫЙ ДОСТУП</span>
            <h2>Моё творчество</h2>
            <p>Всё необходимое для твоей авторской жизни — рядом.</p>
          </div>

          <div className="author-dashboard-links profile-shortcuts-grid">
            <Link href="/my-poems">
              <span className="profile-shortcut-icon">📚</span>
              <span>
                <strong>Мои произведения</strong>
                <small>Редактировать и просматривать стихи</small>
              </span>
              <span className="profile-shortcut-arrow">→</span>
            </Link>

            <Link href="/new-poem">
              <span className="profile-shortcut-icon">✒</span>
              <span>
                <strong>Написать стихотворение</strong>
                <small>Добавить новую работу</small>
              </span>
              <span className="profile-shortcut-arrow">→</span>
            </Link>

            <Link href="/following">
              <span className="profile-shortcut-icon">♧</span>
              <span>
                <strong>Мои подписки</strong>
                <small>Авторы, за которыми ты следишь</small>
              </span>
              <span className="profile-shortcut-arrow">→</span>
            </Link>

            <Link href="/notifications">
              <span className="profile-shortcut-icon">♢</span>
              <span>
                <strong>Уведомления</strong>
                <small>Новости о твоих произведениях</small>
              </span>
              <span className="profile-shortcut-arrow">→</span>
            </Link>
          </div>
        </section>

        <div className="profile-form-divider" />

        <section className="profile-business-card-section">
          <div className="profile-section-heading">
            <span className="profile-section-kicker">ТВОЙ АВТОРСКИЙ ОБРАЗ</span>
            <h2>Моя визитка</h2>
            <p>
              Расскажи читателям свою историю. Пусть они узнают человека,
              который стоит за стихами.
            </p>
          </div>

          <form className="profile-edit-form profile-edit-form-redesign" onSubmit={saveProfile}>
            <div className="profile-image-field">
              <label htmlFor="cover">Обложка авторской страницы</label>

              <div className="profile-cover-preview profile-cover-preview-redesign">
                {coverPreview || coverUrl ? (
                  <img
                    src={coverPreview || coverUrl}
                    alt="Обложка авторской страницы"
                  />
                ) : (
                  <div className="profile-cover-placeholder">
                    <span>✦</span>
                    <strong>Твоё литературное пространство</strong>
                    <small>Выбери изображение для обложки</small>
                  </div>
                )}
              </div>

              <input
                id="cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setCoverFile(event.target.files?.[0] || null)
                }
              />

              <p className="profile-field-hint">
                Лучше выбрать широкое изображение. Максимальный размер — 5 МБ.
              </p>
            </div>

            <div className="profile-image-field profile-avatar-field">
              <label htmlFor="avatar">Фотография автора</label>

              <div className="avatar-preview profile-avatar-preview-redesign">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Новая фотография" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Фотография автора" />
                ) : (
                  <div className="avatar-placeholder">✒</div>
                )}
              </div>

              <input
                id="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) =>
                  setAvatarFile(event.target.files?.[0] || null)
                }
              />

              <p className="profile-field-hint">
                Подойдёт портрет или фотография, по которой читатели смогут тебя узнать.
              </p>
            </div>

            <div className="profile-form-fields">
              <div className="profile-form-field">
                <label htmlFor="displayName">Твоё имя</label>
                <input
                  id="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Например, Анастасия"
                  maxLength={60}
                />
                <p className="profile-field-hint">
                  Имя, которое увидят читатели на твоей странице.
                </p>
              </div>

              <div className="profile-form-field">
                <label htmlFor="username">Твой литературный псевдоним</label>
                <input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Например, nastya_poet"
                  maxLength={30}
                  required
                />
                <p className="profile-field-hint">
                  Он станет частью ссылки на твою авторскую страницу.
                  Используй английские буквы, цифры и нижнее подчёркивание.
                </p>
              </div>

              <div className="profile-form-field">
                <label htmlFor="email">Электронная почта</label>
                <input id="email" value={email} disabled />
                <p className="profile-field-hint">
                  Почта привязана к твоей учётной записи.
                </p>
              </div>

              <div className="profile-form-field">
                <label htmlFor="bio">Расскажи о себе</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="О чём ты пишешь? Что тебя вдохновляет? Расскажи читателям о себе..."
                  rows={6}
                  maxLength={1000}
                />
                <p className="profile-field-hint profile-bio-counter">
                  {bio.length}/1000 символов
                </p>
              </div>
            </div>

            <div className="profile-save-area">
              <p>
                Не бойся быть собой. Каждая авторская история начинается с нескольких строк.
              </p>

              <button type="submit" disabled={saving}>
                {saving ? "Сохраняем..." : "Сохранить визитку"}
              </button>
            </div>
          </form>
        </section>

        {message && (
          <p
            className={`profile-message ${
              messageError ? "profile-message-error" : "profile-message-success"
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        {username && (
          <Link
            href={`/authors/${encodeURIComponent(username)}`}
            className="profile-public-link"
          >
            Посмотреть мою публичную визитку →
          </Link>
        )}

        <footer className="profile-dashboard-footer">
          <span>Перо и Муза</span>
          <p>У каждого чувства однажды находятся слова.</p>
          <Link href="/" className="register-back">
            ← На главную
          </Link>
        </footer>
      </div>
    </main>
  );
}