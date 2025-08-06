"use client";

import { useEffect, useState } from "react";
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

export default function ForumFeedPage() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [likedPostIds, setLikedPostIds] = useState([]);

  const { user } = useUserAuth();

  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!user) return;

      const q = query(
        collection(db, "likes"),
        where("userId", "==", user.uid),
        where("type", "==", "post")
      );
      const snapshot = await getDocs(q);
      const ids = snapshot.docs.map((doc) => doc.data().postId);
      setLikedPostIds(ids);
    };

    fetchLikedPosts();
  }, [user]);

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

  const filteredPosts =
    filter === "liked" && user
      ? posts.filter((post) => likedPostIds.includes(post.id))
      : posts;

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6 relative">
      {/* Fixed Filter Sidebar */}
      <aside className="w-60 fixed left-6 top-24 bg-white text-black p-6 rounded-xl shadow h-fit">
        <h2 className="text-xl font-bold mb-4">Filters</h2>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setFilter("all")}
              className={`block w-full text-left px-3 py-2 rounded ${
                filter === "all"
                  ? "bg-blue-100 font-semibold"
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
                className={`block w-full text-left px-3 py-2 rounded ${
                  filter === "liked"
                    ? "bg-blue-100 font-semibold"
                    : "hover:bg-gray-100"
                }`}
              >
                ❤️ Liked Posts
              </button>
            </li>
          )}
        </ul>
      </aside>

      {/* Posts Container */}
      <section className="ml-64 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Posts</h1>

        {filteredPosts.length === 0 ? (
          <p className="text-gray-400 text-center">No posts yet.</p>
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
                  {post.tags?.join(", ")} •{" "}
                  {post.createdAt?.toDate
                    ? new Date(post.createdAt.toDate()).toLocaleDateString()
                    : ""}
                </p>

                <p className="mt-2 text-gray-800">
                  {post.body.length > 150
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
