"use client";

import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "../_utils/firebase";
import { useUserAuth } from "../_utils/auth-context";
import { useRouter } from "next/navigation";

export default function LikeButton({ type, id }) {
  const { user } = useUserAuth();
  const router = useRouter();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const ref = doc(db, type === "post" ? "posts" : "comments", id);

  useEffect(() => {
    const fetchLikes = async () => {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const likedBy = data.likedBy || [];
        setLiked(user ? likedBy.includes(user.uid) : false);
        setLikeCount(data.likes || 0);
      }
    };
    fetchLikes();
  }, [ref, user]);

  const handleToggleLike = async () => {
    if (!user) return router.push("/login");

    const snap = await getDoc(ref);
    const data = snap.data();
    const likedBy = data.likedBy || [];

    if (likedBy.includes(user.uid)) {
      await updateDoc(ref, {
        likedBy: arrayRemove(user.uid),
        likes: increment(-1),
      });
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      await updateDoc(ref, {
        likedBy: arrayUnion(user.uid),
        likes: increment(1),
      });
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      className={`flex items-center gap-2 ${
        liked ? "text-red-600" : "text-gray-600 hover:text-red-500"
      }`}
    >
      {liked ? <FaHeart /> : <FaRegHeart />} {likeCount}
    </button>
  );
}
