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
import { FaHeart, FaRegHeart, FaClock, FaTimes } from "react-icons/fa";

export default function ForumFeedPage() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all"); // "all" | "liked"
  const [recentOnly, setRecentOnly] = useState(false); // last 7 days
  const [likedPostIds, setLikedPostIds] = useState([]);

  // ---- NEW: typeahead tag state (replaces activeTag) ----
  const [selectedTags, setSelectedTags] = useState([]); // string[]
  const [tagQuery, setTagQuery] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);

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

  // Build tag list from loaded posts
  const allTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [posts]);

  // ---- NEW: tag suggestions (filters out already-selected) ----
  const suggestions = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const base = allTags.filter((t) => !selectedTags.includes(t));
    if (!q) return base.slice(0, 10);
    return base.filter((t) => t.toLowerCase().includes(q)).slice(0, 10);
  }, [allTags, selectedTags, tagQuery]);

  // Apply filters: liked, recentOnly (7 days), AND over selected tags
  const filteredPosts = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return posts
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
        // AND logic: post must include every selected tag
        return selectedTags.every((t) => tags.includes(t));
      });
  }, [posts, filter, user, likedPostIds, recentOnly, selectedTags]);

  // ---- NEW: tag helpers ----
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
    <main className="min-h-screen bg-black text-white py-12 px-6 flex">
      {/* Fixed Left Filter Sidebar */}
      <aside className="w-60 h-fit sticky top-24 bg-white text-black p-6 rounded-xl shadow self-start">
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

        {/* ---- NEW: Searchable tag typeahead + chips ---- */}
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>

        {/* Selected tag chips */}
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

        {/* Input */}
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
      <section className="max-w-3xl mx-auto ml-[15rem]">
        <h1 className="text-3xl font-bold mb-8 text-center">Posts</h1>

        {filteredPosts.length === 0 ? (
          <p className="text-gray-400 text-center">
            No posts match these filters.
          </p>
        ) : (
          <ul className="space-y-6">
            {filteredPosts.map((post) => (
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

                <p className="mt-4 text-sm text-gray-500">
                  Posted by: {post.authorUsername}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
