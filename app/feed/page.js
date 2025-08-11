"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { db } from "../../_utils/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useUserAuth } from "../../_utils/auth-context";
import {
  FaHeart,
  FaRegHeart,
  FaClock,
  FaTimes,
  FaComment,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function ForumFeedPage() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "liked"
  const [recentOnly, setRecentOnly] = useState(false); // last 7 days
  const [likedPostIds, setLikedPostIds] = useState([]);

  // ---- existing typeahead tag state ----
  const [selectedTags, setSelectedTags] = useState([]); // string[]
  const [tagQuery, setTagQuery] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);

  // ---- NEW: search + sort state ----
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "liked" | "commented"

  // ---- NEW: maps for likes & comment counts (for sorting) ----
  const [likesCountMap, setLikesCountMap] = useState({});
  const [commentCountMap, setCommentCountMap] = useState({});

  // ---- NEW: pagination state ----
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const { user } = useUserAuth();

  // Fetch user's liked post IDs
  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!user) return;
      const q = query(
        collection(db, "likes"),
        where("userId", "==", user.uid),
        where("type", "==", "post")
      );
      const snapshot = await getDocs(q);
      setLikedPostIds(snapshot.docs.map((d) => d.data().postId));
    };
    fetchLikedPosts();
  }, [user]);

  // Fetch posts (+ author usernames)
  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const postsWithUsernames = await Promise.all(
        snapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();
          let username = "Unknown";
          if (postData.authorId) {
            const userDocRef = doc(db, "users", postData.authorId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              username = userDoc.data().username || "Unknown";
            }
          }
          return {
            id: postDoc.id,
            ...postData,
            authorUsername: username,
          };
        })
      );

      setPosts(postsWithUsernames);
    };

    fetchPosts();
  }, []);

  // ---- NEW: fetch likes counts for posts (for "Most Liked") ----
  useEffect(() => {
    const fetchLikeCounts = async () => {
      const q = query(collection(db, "likes"), where("type", "==", "post"));
      const snapshot = await getDocs(q);
      const map = {};
      snapshot.docs.forEach((d) => {
        const pid = d.data().postId;
        if (pid) map[pid] = (map[pid] || 0) + 1;
      });
      setLikesCountMap(map);
    };
    fetchLikeCounts();
  }, []);

  // ---- NEW: fetch comment counts (for "Most Commented") ----
  useEffect(() => {
    const fetchCommentCounts = async () => {
      const snapshot = await getDocs(collection(db, "comments"));
      const map = {};
      snapshot.docs.forEach((d) => {
        const pid = d.data().postId;
        if (pid) map[pid] = (map[pid] || 0) + 1;
      });
      setCommentCountMap(map);
    };
    fetchCommentCounts();
  }, []);

  // Build tag list from loaded posts
  const allTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  // tag suggestions
  const suggestions = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const base = allTags.filter((t) => !selectedTags.includes(t));
    if (!q) return base.slice(0, 10);
    return base.filter((t) => t.toLowerCase().includes(q)).slice(0, 10);
  }, [allTags, selectedTags, tagQuery]);

  // Apply filters: liked, recentOnly (7 days), selected tags, search; then sort
  const filteredPosts = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const q = search.trim().toLowerCase();

    const list = posts
      .filter((p) => {
        if (filter === "liked" && user) {
          return likedPostIds.includes(p.id);
        }
        return true;
      })
      .filter((p) => {
        if (!recentOnly) return true;
        const ts = p.createdAt?.toDate ? p.createdAt.toDate().getTime() : 0;
        return ts >= sevenDaysAgo;
      })
      .filter((p) => {
        if (!selectedTags.length) return true;
        const tags = p.tags || [];
        return selectedTags.every((t) => tags.includes(t));
      })
      .filter((p) => {
        if (!q) return true;
        const title = (p.title || "").toLowerCase();
        const body = (p.body || "").toLowerCase();
        return title.includes(q) || body.includes(q);
      });

    // sort
    const sorted = [...list].sort((a, b) => {
      if (sortBy === "liked") {
        const la = likesCountMap[a.id] ?? (a.likes || 0);
        const lb = likesCountMap[b.id] ?? (b.likes || 0);
        return lb - la;
      }
      if (sortBy === "commented") {
        const ca = commentCountMap[a.id] || 0;
        const cb = commentCountMap[b.id] || 0;
        return cb - ca;
      }
      // newest (desc)
      const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tb - ta;
    });

    return sorted;
  }, [
    posts,
    filter,
    user,
    likedPostIds,
    recentOnly,
    selectedTags,
    search,
    sortBy,
    likesCountMap,
    commentCountMap,
  ]);

  // ---- NEW: pagination computed values ----
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE)),
    [filteredPosts]
  );

  const currentPagePosts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, recentOnly, selectedTags, search, sortBy]);

  const goTo = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  // tag helpers
  const addTag = (t) => {
    if (!selectedTags.includes(t)) setSelectedTags((s) => [...s, t]);
    setTagQuery("");
    setOpenSuggest(false);
  };
  const removeTag = (t) => setSelectedTags((s) => s.filter((x) => x !== t));

  const onTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cand = tagQuery.trim();
      if (!cand) return;
      if (allTags.includes(cand) && !selectedTags.includes(cand)) addTag(cand);
    }
    if (e.key === "Escape") setOpenSuggest(false);
  };

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6 grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)_15rem]">
      {/* Fixed Left Filter Sidebar */}
      <aside className="hidden lg:block w-60 h-fit sticky top-24 bg-white text-black p-6 rounded-xl shadow self-start">
        <h2 className="text-xl font-bold mb-4">Filters</h2>

        <ul className="space-y-2 mb-6">
          <li>
            <button
              onClick={() => setFilter("all")}
              className={`block w-full text-left px-3 py-2 rounded ${
                filter === "all"
                  ? "bg-gray-100 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              All Posts
            </button>
          </li>

          {user && (
            <li>
              <button
                onClick={() => setFilter("liked")}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded ${
                  filter === "liked"
                    ? "bg-gray-100 font-semibold"
                    : "hover:bg-gray-100"
                }`}
                aria-label="Show liked posts"
              >
                {filter === "liked" ? (
                  <FaHeart className="text-red-600" />
                ) : (
                  <FaRegHeart className="text-gray-600" />
                )}
                Liked Posts
              </button>
            </li>
          )}

          <li>
            <button
              onClick={() => setRecentOnly((v) => !v)}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded ${
                recentOnly ? "bg-gray-100 font-semibold" : "hover:bg-gray-100"
              }`}
              aria-label="Toggle recent posts filter"
            >
              <FaClock />
              Recent (7 days)
            </button>
          </li>
        </ul>

        {/* Tags (typeahead + chips) */}
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-full text-sm"
              >
                #{t}
                <button
                  onClick={() => removeTag(t)}
                  className="text-gray-500 hover:text-black"
                  aria-label={`Remove ${t}`}
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-gray-500 hover:text-black underline"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="relative">
          <input
            value={tagQuery}
            onChange={(e) => {
              setTagQuery(e.target.value);
              setOpenSuggest(true);
            }}
            onFocus={() => setOpenSuggest(true)}
            onKeyDown={onTagKeyDown}
            placeholder="Filter by tag…"
            className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-black"
          />
          {openSuggest && suggestions.length > 0 && (
            <div
              className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-56 overflow-auto"
              onMouseLeave={() => setOpenSuggest(false)}
            >
              {suggestions.map((t) => (
                <button
                  key={t}
                  onClick={() => addTag(t)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Centered Posts */}
      <section className="w-full max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Posts</h1>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
          {/* Search with quick-clear */}
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or body…"
              className="w-full px-3 py-2 h-10 border border-gray-300 rounded text-white outline-none focus:ring-2 focus:ring-black"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto px-3 pr-8 py-2 h-10 border border-gray-300 rounded text-white outline-none focus:ring-2 focus:ring-black appearance-none bg-black"
              aria-label="Sort posts"
            >
              <option value="newest">Newest</option>
              <option value="liked">Most Liked</option>
              <option value="commented">Most Commented</option>
            </select>
            <FaChevronDown
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white pointer-events-none"
              size={14}
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <p className="text-gray-400 text-center">
            No posts match these filters.
          </p>
        ) : (
          <>
            <ul className="space-y-6">
              {currentPagePosts.map((post) => (
                <li
                  key={post.id}
                  className="bg-white text-black p-6 rounded-xl shadow"
                >
                  <Link
                    href={`/post/${post.id}`}
                    className="text-xl font-bold hover:underline"
                  >
                    {post.title}
                  </Link>

                  <p className="text-sm text-gray-600 mt-1">
                    {(post.tags || []).join(", ")} •{" "}
                    {post.createdAt?.toDate
                      ? new Date(post.createdAt.toDate()).toLocaleDateString()
                      : ""}
                  </p>

                  <p className="mt-2 text-gray-800">
                    {post.body?.length > 150
                      ? post.body.slice(0, 150) + "..."
                      : post.body}
                  </p>

                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span className="text-gray-500">
                      Posted by: {post.authorUsername}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <FaHeart className="text-gray-600" />
                        {likesCountMap[post.id] ?? (post.likes || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaComment className="text-gray-600" />
                        {commentCountMap[post.id] ?? 0}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2">
                {/* Prev button */}
                <button
                  onClick={() => goTo(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-600 rounded disabled:opacity-50 hover:bg-gray-800"
                  aria-label="Previous page"
                >
                  <FaChevronLeft /> {/* <-- icon instead of text */}
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => goTo(n)}
                      className={`px-3 py-2 rounded border ${
                        n === page
                          ? "bg-white text-black border-white font-semibold"
                          : "border-gray-600 hover:bg-gray-800"
                      }`}
                      aria-current={n === page ? "page" : undefined}
                    >
                      {n}
                    </button>
                  )
                )}

                {/* Next button */}
                <button
                  onClick={() => goTo(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 border border-gray-600 rounded disabled:opacity-50 hover:bg-gray-800"
                  aria-label="Next page"
                >
                  <FaChevronRight /> {/* <-- icon instead of text */}
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Fixed Right Q&A / Rules Sidebar */}
      <aside className="hidden lg:block w-60 h-fit sticky top-24 bg-white text-black p-6 rounded-xl shadow self-start">
        <h2 className="text-xl font-bold mb-4">Forum Q&A</h2>

        <details className="mb-3">
          <summary className="cursor-pointer font-semibold">
            Can I use swear words?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            No—please avoid swearing or offensive language.
          </p>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-semibold">
            What’s the tone I should keep?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            Be respectful. No personal attacks or harassment.
          </p>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-semibold">
            Is hate speech allowed?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            No. Discrimination or hate speech is not tolerated.
          </p>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-semibold">
            Where should I post?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            Stay on topic and use the correct category. No spam.
          </p>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-semibold">
            What content is prohibited?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            No explicit/NSFW or illegal content of any kind.
          </p>
        </details>

        <details className="mb-3">
          <summary className="cursor-pointer font-semibold">
            Can I share personal info?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            Protect privacy—don’t share sensitive info.
          </p>
        </details>

        <details>
          <summary className="cursor-pointer font-semibold">
            How do I report issues?
          </summary>
          <p className="mt-2 text-sm text-gray-700">
            Use the report button or contact the moderators.
          </p>
        </details>
      </aside>
    </main>
  );
}
