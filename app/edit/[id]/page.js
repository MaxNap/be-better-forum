"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../_utils/firebase";
import { useUserAuth } from "../../../_utils/auth-context";

export default function EditPostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUserAuth();

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch post
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "posts", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.authorId !== user?.uid) {
            router.push("/profile"); // Prevent editing others' posts
            return;
          }

          setTitle(data.title);
          setTags(data.tags?.join(", ") || "");
          setBody(data.body);
        } else {
          router.push("/profile"); // Post doesn't exist
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && user) fetchPost();
  }, [id, user]);

  // Handle save
  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, {
        title,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t !== ""),
        body,
        updatedAt: serverTimestamp(),
      });

      router.push("/profile");
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  if (loading) return <p className="text-white p-8">Loading...</p>;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="bg-white text-black w-full max-w-2xl rounded-xl p-8 shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Edit Post</h1>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-1">
              Body
            </label>
            <textarea
              id="body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition"
          >
            Save Changes
          </button>
        </form>
      </div>
    </main>
  );
}
