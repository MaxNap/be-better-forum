"use client";

import { useState, useEffect } from "react";
import { db } from "../_utils/firebase";
import {
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useUserAuth } from "../_utils/auth-context";
import { FaEdit, FaTrash } from "react-icons/fa";
import LikeButton from "./LikeButton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Comment({ id, author, text }) {
  const { user } = useUserAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const [createdAt, setCreatedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const fetchTimestamps = async () => {
      const ref = doc(db, "comments", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setCreatedAt(data.createdAt?.toDate());
        setUpdatedAt(data.updatedAt?.toDate());
      }
    };

    fetchTimestamps();
  }, [id]);

  const saveEdit = async () => {
    const ref = doc(db, "comments", id);
    try {
      await updateDoc(ref, {
        text: editText.trim(),
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
      toast.success("Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this comment?");
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "comments", id));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="bg-white text-black p-4 rounded-lg shadow-sm relative">
      {isEditing ? (
        <>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-2 border rounded text-black mb-2"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800 text-sm"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditText(text); // Reset
              }}
              className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-800">{text}</p>

          <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-2 items-center">
            <span>by {author}</span>
            {createdAt && (
              <span>
                • {formatDistanceToNow(createdAt, { addSuffix: true })}
              </span>
            )}
            {updatedAt && updatedAt > createdAt && (
              <span className="text-blue-500 font-semibold">• Edited</span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2">
            {/* ✅ Like button */}
            <LikeButton type="comment" id={id} />

            {/* ✅ Edit & Delete buttons (only for comment owner) */}
            {user?.displayName === author && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-gray-600 hover:text-blue-600 transition flex items-center gap-1"
                >
                  <FaEdit />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm text-gray-600 hover:text-red-600 transition flex items-center gap-1"
                >
                  <FaTrash />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
