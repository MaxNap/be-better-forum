"use client";

import { useEffect, useState } from "react";
import { db } from "../_utils/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { useUserAuth } from "../_utils/auth-context";
import { FaHeart, FaRegHeart, FaEdit } from "react-icons/fa";

export default function Comment({ id, author, text }) {
  const { user } = useUserAuth();
  const [likes, setLikes] = useState([]);
  const [hasLiked, setHasLiked] = useState(false);

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
        setLikes([]); // Fallback
      }
    };
    fetchLikes();
  }, [id, user]);

  const toggleLike = async () => {
    if (!user) return alert("You must log in to like comments.");

    const ref = doc(db, "comments", id);

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
  };

  return (
    <div className="bg-white text-black p-4 rounded-lg shadow-sm relative">
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

        {/* Optional: Placeholder for future edit icon */}
        {user?.email === author && (
          <button className="text-sm text-gray-600 hover:text-blue-600 transition flex items-center gap-1">
            <FaEdit />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
