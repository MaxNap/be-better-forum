"use client"; // Required if you’ll later handle form submission in the browser

import { useState } from "react";

export default function CommentForm({ onSubmit }) {
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onSubmit(comment);
    setComment(""); // Clear after submit
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
        className="w-full px-4 py-2 rounded-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-black"
        required
      />
      <button
        type="submit"
        className="mt-3 bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
      >
        Post Comment
      </button>
    </form>
  );
}
