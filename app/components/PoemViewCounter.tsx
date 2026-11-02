
"use client";

import { useEffect } from "react";
import { createClient } from "../../lib/supabase";

type PoemViewCounterProps = {
  poemId: string;
};

export default function PoemViewCounter({
  poemId,
}: PoemViewCounterProps) {
  useEffect(() => {
    async function recordView() {
      try {
        const supabase = createClient();

        let sessionId = sessionStorage.getItem("pero_i_muza_viewer_id");

        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem("pero_i_muza_viewer_id", sessionId);
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const { error } = await supabase
          .from("poem_views")
          .insert({
            poem_id: poemId,
            viewer_id: user?.id ?? null,
            session_id: sessionId,
          });

        // Повторный просмотр в той же сессии не считается.
        // Ошибка 23505 означает, что такой просмотр уже записан.
        if (error && error.code !== "23505") {
          console.error("Не удалось записать просмотр:", error.message);
        }
      } catch (error) {
        console.error("Ошибка подсчёта просмотров:", error);
      }
    }

    if (poemId) {
      recordView();
    }
  }, [poemId]);

  return null;
}
