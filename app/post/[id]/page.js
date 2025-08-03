"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getDoc,
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../_utils/firebase";
import { useUserAuth } from "../../../_utils/auth-context";
import Comment from "../../../components/Comment";
import CommentForm from "../../../components/CommentForm";

export default function PostPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUserAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchPost = async () => {
      const postRef = doc(db, "posts", id);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) setPost({ id: postSnap.id, ...postSnap.data() });
    };

    const fetchComments = async () => {
      const q = query(collection(db, "comments"), where("postId", "==", id));
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(result);
    };

    fetchPost();
    fetchComments();
  }, [id]);

  const handleNewComment = async (text) => {
    if (!user) return router.push("/login");

    await addDoc(collection(db, "comments"), {
      postId: id,
      author: user.email,
      authorId: user.uid,
      text,
      createdAt: serverTimestamp(),
    });

    // Reload comments
    const snapshot = await getDocs(
      query(collection(db, "comments"), where("postId", "==", id))
    );
    const result = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setComments(result);
  };

  if (!post) return <p className="text-white p-8">Loading post...</p>;

  return (
    <main className="min-h-screen bg-black text-white flex justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Back to Feed Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/feed")}
            className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
          >
            ← Back to Feed
          </button>
        </div>

        {/* Post Header */}
        <section className="mb-10">
          <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
          <div className="text-sm text-gray-400 mb-2">
            By{" "}
            <span className="text-white">{post.authorName || "Anonymous"}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags?.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-700 text-white px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <hr className="border-gray-700 mb-10" />

        {/* Post Body */}
        <section className="text-lg leading-relaxed text-gray-200 mb-12 whitespace-pre-line">
          {post.body}
        </section>

        <hr className="border-gray-700 mb-10" />

        {/* Comments Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Comments</h2>

          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                author={comment.author}
                text={comment.text}
              />
            ))}
          </div>

          {user ? (
            <CommentForm onSubmit={handleNewComment} />
          ) : (
            <p className="mt-4 text-sm text-gray-400">
              You must{" "}
              <span
                onClick={() => router.push("/login")}
                className="text-blue-500 underline cursor-pointer"
              >
                log in
              </span>{" "}
              to comment.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
