
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

type LikeButtonProps = {
  poemId: string;
};

export default function LikeButton({ poemId }: LikeButtonProps) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadLikes() {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id ?? null;

      if (!active) return;
      setUserId(currentUserId);

      const { count: likesCount, error: countError } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("poem_id", poemId);

      if (!active) return;

      if (!countError) {
        setCount(likesCount ?? 0);
      }

      if (currentUserId) {
        const { data, error } = await supabase
          .from("likes")
          .select("id")
          .eq("poem_id", poemId)
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (!active) return;

        if (!error) {
          setLiked(!!data);
        }
      }

      if (active) setLoading(false);
    }

    loadLikes();

    return () => {
      active = false;
    };
  }, [poemId]);

  async function toggleLike() {
    if (!userId) {
      alert("Чтобы поставить лайк, сначала войдите в аккаунт.");
      return;
    }

    if (busy) return;

    setBusy(true);
    const supabase = createClient();

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("poem_id", poemId)
        .eq("user_id", userId);

      if (!error) {
        setLiked(false);
        setCount((current) => Math.max(0, current - 1));
      } else {
        alert("Не удалось убрать лайк. Попробуйте ещё раз.");
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({
          poem_id: poemId,
          user_id: userId,
        });

      if (!error) {
        setLiked(true);
        setCount((current) => current + 1);
      } else {
        alert("Не удалось поставить лайк. Попробуйте ещё раз.");
      }
    }

    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={loading || busy}
      aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
      aria-pressed={liked}
      className={`like-button ${liked ? "liked" : ""}`}
    >
      <span className="like-heart">{liked ? "❤️" : "🤍"}</span>
      <span>{loading ? "…" : count}</span>
    </button>
  );
}
