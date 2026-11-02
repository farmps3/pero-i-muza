
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

export default function NewPoemPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("ru");
  const [category, setCategory] = useState("Свободная тема");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!title.trim() || !content.trim()) {
      setMessage("Заполни название и текст стихотворения.");
      return;
    }

    setSaving(true);

    const supabase = createClient();

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setMessage("Сначала войди в свой аккаунт.");
      setSaving(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("poems").insert({
      author_id: authData.user.id,
      title: title.trim(),
      content: content.trim(),
      language,
      category,
      status: "approved",
    });

    if (error) {
      console.error("Ошибка публикации:", error.message);
      setMessage("Не удалось опубликовать стихотворение: " + error.message);
      setSaving(false);
      return;
    }

    setMessage("Твоё стихотворение опубликовано! Оно уже доступно читателям.");

    setTitle("");
    setContent("");
    setLanguage("ru");
    setCategory("Свободная тема");
    setSaving(false);
  }

  return (
    <main className="profile-page new-poem-page">
      <section className="profile-card new-poem-card">
        <header className="new-poem-header">
          <Link href="/" className="register-logo">
            Перо и Муза
          </Link>

          <button
            type="button"
            className="new-poem-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          <nav className={`new-poem-nav ${mobileMenuOpen ? "is-open" : ""}`}>
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              Главная
            </Link>

            <Link href="/authors" onClick={() => setMobileMenuOpen(false)}>
              Авторы
            </Link>

            <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
              Мой профиль
            </Link>

            <Link href="/my-poems" onClick={() => setMobileMenuOpen(false)}>
              Мои стихи
            </Link>
          </nav>
        </header>

        <div className="new-poem-heading">
          <h1 className="register-label">Новое стихотворение</h1>

          <p className="register-description">
            Поделись своим творчеством с читателями.
          </p>
        </div>

        {message && (
          <p className="register-message new-poem-message" role="status">
            {message}
          </p>
        )}

        <form className="new-poem-form" onSubmit={handleSubmit}>
          <label htmlFor="poem-language">Язык произведения</label>

          <select
            id="poem-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>

          <label htmlFor="poem-category">Категория стихотворения</label>

          <select
            id="poem-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Любовь">Любовь ❤️</option>
            <option value="О жизни">О жизни</option>
            <option value="Разлука">Разлука</option>
            <option value="Природа">Природа</option>
            <option value="Философия">Философия</option>
            <option value="Дружба">Дружба</option>
            <option value="Грусть">Грусть</option>
            <option value="Свободная тема">Свободная тема</option>
          </select>

          <label htmlFor="poem-title">Название стихотворения</label>

          <input
            id="poem-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, «Тихий вечер»"
            maxLength={150}
            required
          />

          <label htmlFor="poem-content">Текст стихотворения</label>

          <textarea
            id="poem-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Напиши здесь своё стихотворение..."
            rows={12}
            required
          />

          <button type="submit" disabled={saving}>
            {saving ? "Публикуем..." : "Опубликовать стихотворение"}
          </button>
        </form>

        <Link href="/" className="register-back">
          ← Вернуться на главную
        </Link>
      </section>
    </main>
  );
}
