"use client";

import { useState } from "react";

export default function CommentForm({ onSubmit }) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setComment("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <label
        htmlFor="comment"
        className="block text-sm font-medium mb-1 text-white"
      >
        Add a Comment
      </label>
      <textarea
        id="comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Write something thoughtful..."
        className="w-full px-4 py-2 rounded-lg bg-white text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
        required
        disabled={submitting}
      />

      <button
        type="submit"
        disabled={submitting}
        className={`mt-3 font-semibold px-4 py-2 rounded-lg transition ${
          submitting
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-white text-black hover:bg-gray-200"
        }`}
      >
        {submitting ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
}
