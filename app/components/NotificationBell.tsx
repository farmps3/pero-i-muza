
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function loadUnreadCount() {
      const { data: authData } = await supabase.auth.getUser();

      if (!active) return;

      if (!authData.user) {
        setUnreadCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", authData.user.id)
        .eq("is_read", false);

      if (active && !error) {
        setUnreadCount(count || 0);
      }
    }

    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link href="/notifications" className="notification-bell">
      <span className="notification-bell-icon">🔔</span>
      <span className="notification-bell-text">Уведомления</span>

      {unreadCount > 0 && (
        <span className="notification-bell-count">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
