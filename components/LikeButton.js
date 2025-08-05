"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  onSnapshot,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../_utils/firebase";
import { useUserAuth } from "../_utils/auth-context";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from "sonner";
import clsx from "clsx";

export default function LikeButton({ type, id }) {
  const { user } = useUserAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeDocId, setLikeDocId] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "likes"),
      where("type", "==", type),
      where(type === "post" ? "postId" : "commentId", "==", id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLikeCount(snapshot.size);

      if (user) {
        const userLike = snapshot.docs.find(
          (doc) => doc.data().userId === user.uid
        );
        if (userLike) {
          setLiked(true);
          setLikeDocId(userLike.id);
        } else {
          setLiked(false);
          setLikeDocId(null);
        }
      }
    });

    return () => unsubscribe();
  }, [type, id, user]);

  const handleLike = async () => {
    if (!user) return toast.error("You must log in to like.");

    const likesRef = collection(db, "likes");

    try {
      if (liked && likeDocId) {
        await deleteDoc(doc(db, "likes", likeDocId));
        setLiked(false);
      } else {
        await addDoc(likesRef, {
          userId: user.uid,
          type,
          createdAt: serverTimestamp(),
          ...(type === "post" ? { postId: id } : { commentId: id }),
        });
        setLiked(true);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300); // End animation
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to toggle like.");
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={!user}
      className={clsx(
        "text-sm flex items-center gap-1 transition",
        liked ? "text-red-600" : "text-gray-600 hover:text-red-600",
        animating && "animate-heart"
      )}
    >
      <span className={clsx(animating && "animate-heart")}>
        {liked ? <FaHeart className="text-red-600" /> : <FaRegHeart />}
      </span>
      <span>{likeCount}</span>
    </button>
  );
}
