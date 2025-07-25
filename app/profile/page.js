"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import Link from "next/link";
import { db } from "../../_utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function ProfilePage() {
  const { user } = useUserAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user]);

  // Fetch user posts
  useEffect(() => {
    if (user?.uid) {
      const fetchPosts = async () => {
        const q = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPosts(results);
        setLoading(false);
      };

      fetchPosts();
    }
  }, [user]);

  // Handle delete
  const handleDelete = async (postId) => {
    const confirmDelete = confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  if (user === null) return null;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="bg-white text-black rounded-xl p-8 w-full max-w-2xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>
        <p className="text-gray-700 mb-2 text-center">
          Name: {user.displayName || "Anonymous"}
        </p>
        <p className="text-gray-700 mb-6 text-center">Email: {user.email}</p>

        {/* New Post Button */}
        <div className="flex justify-center mb-8">
          <Link
            href="/new"
            className="inline-block bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            + Create New Post
          </Link>
        </div>

        {/* Posts List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Posts</h2>

          {loading ? (
            <p>Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500">You haven't written any posts yet.</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                >
                  <Link
                    href={`/post/${post.id}`}
                    className="text-lg font-bold text-black hover:underline"
                  >
                    {post.title}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {post.tags?.join(", ")}
                  </p>
                  <p className="text-gray-700 mt-2">
                    {post.body.length > 150
                      ? post.body.slice(0, 150) + "..."
                      : post.body}
                  </p>
                  {post.createdAt?.toDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Posted on:{" "}
                      {post.createdAt.toDate().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/edit/${post.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
