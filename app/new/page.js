"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import { db } from "../../_utils/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// ✅ Load TipTap only on the client; no @tiptap/* imports here
const TipTapEditor = dynamic(() => import("../../components/TipTapEditor"), {
  ssr: false,
});

export default function NewPostPage() {
  const { user } = useUserAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [body, setBody] = useState(""); // will hold HTML from TipTap
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- Hashtag validation rules ---
    const TAG_REGEX = /^#[A-Za-z0-9]+$/;

    const parts = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const invalid = parts.find((t) => {
      if (/\s/.test(t)) return true;
      if (!t.startsWith("#")) return true;
      if (!TAG_REGEX.test(t)) return true;
      return false;
    });

    if (invalid) {
      toast.error(
        'Invalid tag. Use "#habits" or "#focus" (letters/numbers only, no spaces).'
      );
      return;
    }

    // require non-empty HTML content (strip tags quickly)
    const plainText = body.replace(/<[^>]+>/g, "").trim();
    if (!plainText) {
      toast.error("Post content is required.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "posts"), {
        title,
        body, // HTML from TipTap
        tags: parts,
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        createdAt: serverTimestamp(),
      });

      router.push("/profile");
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to publish post.");
    } finally {
      setLoading(false);
    }
  };

  if (user === null) return null;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="bg-white text-black w-full max-w-2xl rounded-xl p-8 shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Create a New Post
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Morning Routine"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#habits, #focus"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-1">
              Your Story
            </label>
            {/* TipTap returns { html, json, text } — we save HTML like before */}
            <TipTapEditor
              valueHTML={body}
              onChange={(data) => setBody(data?.html ?? "")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition"
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </form>
      </div>
    </main>
  );
}
