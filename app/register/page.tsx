"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setMessageError(false);
    setRegistered(false);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setMessageError(true);
      setMessage("Пожалуйста, укажи своё имя или псевдоним.");
      return;
    }

    if (cleanName.length > 60) {
      setMessageError(true);
      setMessage("Имя не должно превышать 60 символов.");
      return;
    }

    if (password.length < 8) {
      setMessageError(true);
      setMessage("Пароль должен содержать минимум 8 символов.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        throw error;
      }

      setMessage(
        "Почти готово! Проверь свою электронную почту и подтверди регистрацию."
      );

      setRegistered(true);
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessageError(true);
      setMessage(
        error instanceof Error
          ? "Не удалось зарегистрироваться: " + error.message
          : "Не удалось зарегистрироваться. Попробуй ещё раз."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page register-page-redesign">
      <section className="register-card register-card-redesign">
        <Link href="/" className="register-logo">
          Перо и Муза
        </Link>

        <div className="register-ornament">✦</div>

        <p className="register-label">
          ТВОЁ ЛИТЕРАТУРНОЕ ПРОСТРАНСТВО
        </p>

        <h1>Начни свою историю</h1>

        <p className="register-description">
          Создай авторскую страницу и поделись своими произведениями
          с читателями со всего мира. Возможно, именно твои строки
          кто-то давно хотел прочитать.
        </p>

        <div className="register-divider">
          <span>❧</span>
        </div>

        <form
          onSubmit={handleRegister}
          className="register-form-redesign"
        >
          <div className="register-field">
            <label htmlFor="name">Имя или псевдоним</label>
            <input
              id="name"
              type="text"
              placeholder="Как тебя будут называть читатели?"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              autoComplete="name"
              required
              disabled={loading || registered}
            />
          </div>

          <div className="register-field">
            <label htmlFor="email">Электронная почта</label>
            <input
              id="email"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading || registered}
            />
          </div>

          <div className="register-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              placeholder="Минимум 8 символов"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
              disabled={loading || registered}
            />
            <p className="register-field-hint">
              Используй не менее 8 символов.
            </p>
          </div>

          <button type="submit" disabled={loading || registered}>
            {loading
              ? "Создаём аккаунт..."
              : registered
                ? "Ожидаем подтверждения"
                : "Создать аккаунт"}
          </button>
        </form>

        {message && (
          <p
            className={`register-message register-message-redesign ${
              messageError
                ? "register-message-error"
                : "register-message-success"
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        {registered && (
          <div className="register-confirmation">
            <span>✉</span>
            <strong>Остался один шаг</strong>
            <p>
              Открой письмо от «Перо и Муза» и перейди по ссылке
              подтверждения. После этого сможешь войти в свой аккаунт.
            </p>
            <Link href="/login">Перейти ко входу</Link>
          </div>
        )}

        <div className="register-login register-login-redesign">
          <span>Уже есть аккаунт?</span>
          <Link href="/login">Войти</Link>
        </div>

        <Link href="/" className="register-back">
          ← Вернуться на главную
        </Link>

        <footer className="register-footer">
          У каждого чувства однажды находятся слова.
        </footer>
      </section>
    </main>
  );
}