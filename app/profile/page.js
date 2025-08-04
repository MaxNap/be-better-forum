"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAuth } from "../../_utils/auth-context";
import Link from "next/link";
import { db } from "../../_utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useUserAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (!user.displayName) {
      router.push("/set-username");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.uid) {
      const fetchPosts = async () => {
        const q = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPosts(results);
        setLoading(false);
      };

      fetchPosts();
    }
  }, [user]);

  const checkUsernameAvailability = async (inputUsername) => {
    setNewUsername(inputUsername.trim());
    setUpdateSuccess("");
    setUpdateError("");

    if (!inputUsername.trim()) {
      setUsernameAvailable(null);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("username", "==", inputUsername.trim())
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty || snapshot.docs[0]?.id === user.uid) {
      setUsernameAvailable(true);
    } else {
      setUsernameAvailable(false);
    }
  };

  const handleUsernameUpdate = async () => {
    setUpdateError("");
    setUpdateSuccess("");

    if (!newUsername.trim()) {
      setUpdateError("Username cannot be empty.");
      return;
    }

    if (usernameAvailable === false) {
      setUpdateError("Username is already taken.");
      return;
    }

    try {
      await updateProfile(user, { displayName: newUsername });

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, { username: newUsername });
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          username: newUsername,
          createdAt: new Date(),
        });
      }

      setUpdateSuccess("Username updated successfully!");
      setEditMode(false);
    } catch (error) {
      console.error("Update error:", error);
      setUpdateError("Failed to update username.");
    }
  };

  const handleDelete = async (postId) => {
    toast(
      (t) => (
        <div className="flex flex-col">
          <p className="mb-2">Are you sure you want to delete this post?</p>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                toast.dismiss(t);

                try {
                  await deleteDoc(doc(db, "posts", postId));
                  setPosts((prev) => prev.filter((p) => p.id !== postId));
                  toast.success("Post deleted successfully");
                } catch (error) {
                  console.error("Failed to delete post:", error);
                  toast.error("Failed to delete post");
                }
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1 bg-gray-300 text-black rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, // user must confirm or cancel
      }
    );
  };

  if (user === null) return null;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="bg-white text-black rounded-xl p-8 w-full max-w-2xl shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">Your Profile</h1>

        {/* Username Section */}
        <div className="mb-4 text-center">
          <div className="text-gray-700">
            Username:{" "}
            {!editMode ? (
              <span className="font-semibold">{user.displayName}</span>
            ) : (
              <>
                <input
                  type="text"
                  className="border px-2 py-1 rounded w-2/3 mt-2"
                  value={newUsername}
                  onChange={(e) => checkUsernameAvailability(e.target.value)}
                  placeholder="Enter new username"
                />
                {newUsername && (
                  <div className="mt-1 text-sm">
                    {usernameAvailable === true && (
                      <span className="text-green-600">
                        ✅ Username is available
                      </span>
                    )}
                    {usernameAvailable === false && (
                      <span className="text-red-600">❌ Username is taken</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          {!editMode ? (
            <button
              onClick={() => {
                setEditMode(true);
                setNewUsername(user.displayName || "");
              }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Edit Username
            </button>
          ) : (
            <div className="flex flex-col items-center mt-2 space-y-2">
              <button
                onClick={handleUsernameUpdate}
                className="bg-black text-white px-4 py-1 rounded hover:bg-gray-800 transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          {updateError && (
            <p className="text-red-600 text-sm mt-2">{updateError}</p>
          )}
          {updateSuccess && (
            <p className="text-green-600 text-sm mt-2">{updateSuccess}</p>
          )}
        </div>

        {/* Email */}
        <p className="text-gray-700 mb-6 text-center">Email: {user.email}</p>

        {/* New Post Button */}
        <div className="flex justify-center mb-8">
          <Link
            href="/new"
            className="inline-block bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            + Create New Post
          </Link>
        </div>

        {/* Posts List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Posts</h2>

          {loading ? (
            <p>Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500">You have not written any posts yet.</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                >
                  <Link
                    href={`/post/${post.id}`}
                    className="text-lg font-bold text-black hover:underline"
                  >
                    {post.title}
                  </Link>
                  <p className="text-sm text-gray-600 mt-1">
                    {post.tags?.join(", ")}
                  </p>
                  <p className="text-gray-700 mt-2">
                    {post.body.length > 150
                      ? post.body.slice(0, 150) + "..."
                      : post.body}
                  </p>
                  {post.createdAt?.toDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Posted on:{" "}
                      {post.createdAt.toDate().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/edit/${post.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
