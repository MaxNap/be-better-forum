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
} from "firebase/firestore";

export default function ForumFeedPage() {
  const [posts, setPosts] = useState([]);

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

  return (
    <main className="min-h-screen bg-black text-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Posts</h1>

        {posts.length === 0 ? (
          <p className="text-gray-400 text-center">No posts yet.</p>
        ) : (
          <ul className="space-y-6">
            {posts.map((post) => (
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
      </div>
    </main>
  );
}
