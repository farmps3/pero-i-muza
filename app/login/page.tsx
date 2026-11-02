"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("Проверяем данные...");
    setMessageError(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(
          error.message === "Invalid login credentials"
            ? "Неверная электронная почта или пароль."
            : error.message
        );
      }

      setMessage("Вход выполнен. Добро пожаловать!");

      window.location.href = "/";
    } catch (error) {
      setMessageError(true);
      setMessage(
        "Не удалось войти: " +
          (error instanceof Error ? error.message : "Неизвестная ошибка")
      );
      setLoading(false);
    }
  }

  return (
    <main className="register-page login-page-redesign">
      <section className="register-card login-card-redesign">
        <Link href="/" className="register-logo">
          Перо и Муза
        </Link>

        <div className="login-ornament">✦</div>

        <p className="register-label">
          ТВОЁ ЛИТЕРАТУРНОЕ ПРОСТРАНСТВО
        </p>

        <h1>С возвращением!</h1>

        <p className="register-description">
          Твоя история продолжается. Войди в аккаунт и возвращайся
          к словам, которые ждут своего часа.
        </p>

        <div className="login-divider">
          <span>❧</span>
        </div>

        <form onSubmit={handleLogin} className="login-form-redesign">
          <div className="login-field">
            <label htmlFor="email">Электронная почта</label>

            <input
              id="email"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Пароль</label>

            <input
              id="password"
              type="password"
              placeholder="Твой пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <div className="login-forgot-wrapper">
              <Link
                href="/forgot-password"
                className="login-forgot-link"
              >
                Забыли пароль?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Входим в аккаунт..." : "Войти в аккаунт"}
          </button>
        </form>

        {message && (
          <p
            className={`register-message login-message-redesign ${
              messageError ? "login-message-error" : "login-message-success"
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        <div className="login-register-prompt">
          <span>Впервые у нас?</span>
          <p>
            Создай свою авторскую страницу и поделись творчеством с миром.
          </p>
          <Link href="/register">
            Зарегистрироваться
          </Link>
        </div>

        <Link href="/" className="register-back">
          ← На главную
        </Link>

        <footer className="login-footer">
          У каждого чувства однажды находятся слова.
        </footer>
      </section>
    </main>
  );
}