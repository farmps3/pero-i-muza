
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../../lib/supabase";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setValidSession(false);
      } else {
        setValidSession(true);
      }

      setChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setValidSession(true);
        setChecking(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setErrorMessage(false);

    if (password.length < 8) {
      setErrorMessage(true);
      setMessage("Новый пароль должен содержать минимум 8 символов.");
      return;
    }

    if (password !== repeatPassword) {
      setErrorMessage(true);
      setMessage("Пароли не совпадают. Проверь оба поля.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setUpdated(true);
      setMessage("Пароль успешно изменён. Теперь можешь войти в аккаунт.");
      setPassword("");
      setRepeatPassword("");
    } catch (error) {
      setErrorMessage(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Не удалось изменить пароль. Запроси новую ссылку для восстановления."
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
          НОВАЯ ГЛАВА ТВОЕЙ ИСТОРИИ
        </p>

        <h1>Новый пароль</h1>

        <p className="register-description">
          Придумай новый пароль, чтобы снова получить доступ
          к своей авторской странице и произведениям.
        </p>

        <div className="register-divider">
          <span>❧</span>
        </div>

        {checking ? (
          <p className="register-message register-message-redesign">
            Проверяем ссылку восстановления...
          </p>
        ) : !validSession ? (
          <div className="register-confirmation">
            <strong>Ссылка недействительна или устарела</strong>
            <p>
              Запроси новое письмо для восстановления пароля
              и перейди по ссылке из последнего письма.
            </p>
            <Link href="/forgot-password">
              Запросить новую ссылку
            </Link>
          </div>
        ) : updated ? (
          <div className="register-confirmation">
            <span>✓</span>
            <strong>Пароль изменён!</strong>
            <p>
              Теперь ты можешь войти в свой аккаунт с новым паролем.
            </p>
            <Link href="/login">Перейти ко входу</Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="register-form-redesign"
          >
            <div className="register-field">
              <label htmlFor="password">Новый пароль</label>
              <input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            <div className="register-field">
              <label htmlFor="repeatPassword">
                Повтори новый пароль
              </label>
              <input
                id="repeatPassword"
                type="password"
                placeholder="Введи пароль ещё раз"
                value={repeatPassword}
                onChange={(event) => setRepeatPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Сохраняем пароль..." : "Сохранить новый пароль"}
            </button>
          </form>
        )}

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
          <span>Уже вспомнил пароль?</span>
          <Link href="/login">Вернуться ко входу</Link>
        </div>

        <Link href="/" className="register-back">
          ← Вернуться на главную
        </Link>

        <footer className="register-footer">
          Каждая история заслуживает продолжения.
        </footer>
      </section>
    </main>
  );
}
