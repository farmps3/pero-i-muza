
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../lib/supabase";
import Header from "../components/Header";
import LikeButton from "./components/LikeButton";
import FavoriteButton from "./components/FavoriteButton";

type Poem = {
  id: string;
  title: string;
  content: string;
  language: string;
  category: string;
  author_id: string;
  created_at: string;
  authorName: string;
  username: string;
};

const categories = [
  "Все произведения",
  "Любовь",
  "О жизни",
  "Разлука",
  "Природа",
  "Философия",
  "Дружба",
  "Грусть",
  "Свободная тема",
];

export default function HomePage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState("Все произведения");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPoems() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("poems")
        .select(
          "id, title, content, language, category, author_id, created_at"
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Ошибка загрузки стихотворений:", error.message);
        setLoading(false);
        return;
      }

      const poemRows = data || [];
      const authorIds = [
        ...new Set(poemRows.map((poem) => poem.author_id)),
      ];

      let authors: {
        id: string;
        display_name: string | null;
        username: string | null;
      }[] = [];

      if (authorIds.length > 0) {
        const { data: authorData, error: authorError } =
          await supabase
            .from("profiles")
            .select("id, display_name, username")
            .in("id", authorIds);

        if (authorError) {
          console.error("Ошибка загрузки авторов:", authorError.message);
        } else {
          authors = authorData || [];
        }
      }

      const preparedPoems = poemRows.map((poem) => {
        const author = authors.find(
          (item) => item.id === poem.author_id
        );

        return {
          ...poem,
          authorName:
            author?.display_name || author?.username || "Автор",
          username: author?.username || "",
        };
      });

      setPoems(preparedPoems);
      setLoading(false);
    }

    loadPoems();
  }, []);

  const filteredPoems = poems.filter((poem) => {
    const matchesCategory =
      selectedCategory === "Все произведения" ||
      poem.category === selectedCategory;

    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      searchText === "" ||
      poem.title.toLowerCase().includes(searchText) ||
      poem.content.toLowerCase().includes(searchText) ||
      poem.authorName.toLowerCase().includes(searchText) ||
      poem.username.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  return (
    <main className="home-page">
      <Header />

      <section className="home-hero home-hero-refined">
        <div className="home-hero-ornament" aria-hidden="true">
          ✦
        </div>

        <p className="home-subtitle">
          МЕСТО, ГДЕ ЖИВУТ СЛОВА
        </p>

        <h1>
          У каждого сердца
          <br />
          есть своя поэзия
        </h1>

        <div className="home-hero-divider" aria-hidden="true">
          <span />
          <span>✧</span>
          <span />
        </div>

        <p className="home-intro">
          Международная литературная площадка для тех,
          кто пишет сердцем. Публикуй свои произведения,
          находи единомышленников и делись своим миром.
        </p>

        <Link href="/new-poem" className="home-write-button">
          Опубликовать стихотворение
          <span aria-hidden="true"> ↗</span>
        </Link>

        <p className="home-hero-note">
          Каждая история заслуживает быть услышанной
        </p>
      </section>

      <section className="home-poems-section home-poems-refined">
        <div className="home-section-heading">
          <p className="home-section-label">
            ЛИТЕРАТУРНОЕ ПРОСТРАНСТВО
          </p>

          <h2>Новые произведения</h2>

          <p className="home-section-description">
            Истории, чувства и мысли, которыми делятся авторы
          </p>
        </div>

        <div className="home-search">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти стихотворение или автора..."
            aria-label="Поиск стихотворений и авторов"
          />
        </div>

        <div className="home-category-list">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={
                selectedCategory === category
                  ? "home-category active"
                  : "home-category"
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="home-results-count">
            {filteredPoems.length === 1
              ? "Найдено 1 произведение"
              : `Найдено произведений: ${filteredPoems.length}`}
          </p>
        )}

        {loading ? (
          <p className="home-empty">
            Загружаем произведения...
          </p>
        ) : filteredPoems.length === 0 ? (
          <p className="home-empty">
            Ничего не найдено. Попробуй изменить запрос
            или выбрать другую категорию.
          </p>
        ) : (
          <div className="home-poems-grid">
            {filteredPoems.map((poem) => (
              <article className="home-poem-card" key={poem.id}>
                <div className="home-poem-card-top">
                  <p className="home-poem-language">
                    {poem.language === "ru"
                      ? "РУССКИЙ ЯЗЫК"
                      : "ENGLISH"}
                  </p>

                  <p className="home-poem-category">
                    {poem.category}
                  </p>
                </div>

                <h3>
                  <Link href={`/poems/${poem.id}`}>
                    {poem.title}
                  </Link>
                </h3>

                <div
                  className="home-poem-decoration"
                  aria-hidden="true"
                >
                  ✧
                </div>

                <p className="home-poem-content">
                  {poem.content}
                </p>

                <div className="home-poem-author">
                  <span
                    className="home-author-mark"
                    aria-hidden="true"
                  >
                    ✦
                  </span>

                  <span>
                    Автор:{" "}
                    {poem.username ? (
                      <Link
                        href={`/authors/${encodeURIComponent(
                          poem.username
                        )}`}
                      >
                        {poem.authorName}
                      </Link>
                    ) : (
                      poem.authorName
                    )}
                  </span>
                </div>

                <p className="home-poem-date">
                  {new Date(poem.created_at).toLocaleDateString(
                    "ru-RU"
                  )}
                </p>

                <div className="home-poem-actions">
                  <LikeButton poemId={poem.id} />
                  <FavoriteButton poemId={poem.id} />

                  <Link
                    href={`/poems/${poem.id}`}
                    className="home-poem-read"
                  >
                    Читать полностью →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="home-footer">
        <p>Перо и Муза © 2026</p>
        <p>Слова объединяют мир.</p>
      </footer>
    </main>
  );
}
