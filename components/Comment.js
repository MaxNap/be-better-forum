"use client";

import { useEffect, useState } from "react";
import { db } from "../_utils/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";
import { useUserAuth } from "../_utils/auth-context";
import { FaHeart, FaRegHeart, FaEdit, FaTrash } from "react-icons/fa";

export default function Comment({ id, author, text }) {
  const { user } = useUserAuth();
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const ref = doc(db, "comments", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const likesList = Array.isArray(data.likes) ? data.likes : [];
          setLikes(likesList);
          setHasLiked(user ? likesList.includes(user.uid) : false);
        }
      } catch (err) {
        console.error("Failed to fetch likes:", err);
        setLikes([]);
      }
    };
    fetchLikes();
  }, [id, user]);

  const toggleLike = async () => {
    if (!user) return alert("You must log in to like comments.");
    const ref = doc(db, "comments", id);

    try {
      if (hasLiked) {
        await updateDoc(ref, {
          likes: arrayRemove(user.uid),
        });
        setLikes((prev) => prev.filter((uid) => uid !== user.uid));
        setHasLiked(false);
      } else {
        await updateDoc(ref, {
          likes: arrayUnion(user.uid),
        });
        setLikes((prev) => [...prev, user.uid]);
        setHasLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const saveEdit = async () => {
    const ref = doc(db, "comments", id);
    try {
      await updateDoc(ref, { text: editText.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this comment?");
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "comments", id));
    } catch (error) {
      console.error("Failed to delete comment:", error);
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
          <div className="text-xs text-gray-500 mt-2">by {author}</div>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={toggleLike}
              className="text-sm text-gray-600 flex items-center gap-1 hover:text-red-600 transition"
            >
              {hasLiked ? <FaHeart className="text-red-600" /> : <FaRegHeart />}
              <span>{likes.length}</span>
            </button>

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
