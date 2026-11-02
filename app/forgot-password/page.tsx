
"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setErrorMessage(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(true);
      setMessage("Укажи электронную почту.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setSent(true);
      setMessage(
        "Если аккаунт с таким адресом существует, мы отправили письмо со ссылкой для восстановления пароля."
      );
    } catch (error) {
      setErrorMessage(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось отправить письмо. Попробуй ещё раз."
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
          ВОЗВРАЩЕНИЕ К СВОИМ СЛОВАМ
        </p>

        <h1>Забыл пароль?</h1>

        <p className="register-description">
          Такое случается. Укажи электронную почту, с которой
          регистрировался, и мы отправим тебе ссылку для создания
          нового пароля.
        </p>

        <div className="register-divider">
          <span>❧</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="register-form-redesign"
        >
          <div className="register-field">
            <label htmlFor="email">
              Электронная почта
            </label>

            <input
              id="email"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading || sent}
            />
          </div>

          <button type="submit" disabled={loading || sent}>
            {loading
              ? "Отправляем письмо..."
              : sent
                ? "Письмо отправлено"
                : "Восстановить пароль"}
          </button>
        </form>

        {message && (
          <p
            className={`register-message register-message-redesign ${
              errorMessage
                ? "register-message-error"
                : "register-message-success"
            }`}
            role="status"
          >
            {message}
          </p>
        )}

        <div className="register-login register-login-redesign">
          <span>Вспомнил пароль?</span>
          <Link href="/login">Вернуться ко входу</Link>
        </div>

        <Link href="/" className="register-back">
          ← Вернуться на главную
        </Link>

        <footer className="register-footer">
          У каждого слова есть дорога домой.
        </footer>
      </section>
    </main>
  );
}
