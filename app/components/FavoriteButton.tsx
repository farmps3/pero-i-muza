
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type FavoriteButtonProps = {
  poemId: string;
};

export default function FavoriteButton({
  poemId,
}: FavoriteButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadFavorite() {
      const supabase = createClient();

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("poem_id", poemId)
        .maybeSingle();

      if (error) {
        console.error("Ошибка загрузки избранного:", error.message);
      } else {
        setIsFavorite(!!data);
      }

      setLoading(false);
    }

    loadFavorite();
  }, [poemId]);

  async function toggleFavorite() {
    if (!userId) {
      setMessage("Войди в аккаунт, чтобы сохранять стихи.");
      return;
    }

    if (saving) return;

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("poem_id", poemId);

      if (error) {
        setMessage("Не удалось удалить из избранного.");
        console.error(error.message);
      } else {
        setIsFavorite(false);
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({
          user_id: userId,
          poem_id: poemId,
        });

      if (error) {
        setMessage("Не удалось добавить в избранное.");
        console.error(error.message);
      } else {
        setIsFavorite(true);
      }
    }

    setSaving(false);
  }

  return (
    <div className="favorite-button-wrapper">
      <button
        type="button"
        className={`favorite-button ${
          isFavorite ? "favorite-active" : ""
        }`}
        onClick={toggleFavorite}
        disabled={loading || saving}
      >
        {loading
          ? "Загрузка..."
          : saving
          ? "Сохраняем..."
          : isFavorite
          ? "★ В избранном"
          : "☆ В избранное"}
      </button>

      {message && (
        <p className="favorite-message">{message}</p>
      )}
    </div>
  );
}
