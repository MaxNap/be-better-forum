import Comment from "../../../components/Comment";
import CommentForm from "../../../components/CommentForm";

// You can extract the post ID from params (Next.js App Router)
export default function PostPage({ params }) {
  const { id } = params;

  // Fake/mock post data for now
  const mockPost = {
    title: "How I Built Discipline in 30 Days",
    author: "john@example.com",
    createdAt: "July 20, 2025",
    tags: ["#discipline", "#habits"],
    body: `Discipline is a muscle. I started waking up at 6am, journaling, and removing distractions. Here's what worked for me...`,
  };

  const mockComments = [
    {
      id: 1,
      author: "sara@example.com",
      text: "This really helped me, thank you!",
    },
    {
      id: 2,
      author: "leo@example.com",
      text: "Waking up early changed my life too.",
    },
  ];
  const handleNewComment = (newCommentText) => {
    // For now, just log it or simulate a new comment
    console.log("New comment submitted:", newCommentText);
  };

  return (
    <main className="min-h-screen bg-black text-white px-4 py-12 max-w-3xl mx-auto">
      {/* Post Header */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-2">{mockPost.title}</h1>
        <div className="text-sm text-gray-400 mb-1">
          By {mockPost.author} • {mockPost.createdAt}
        </div>
        <div className="text-sm text-gray-500 space-x-2">
          {mockPost.tags.map((tag, idx) => (
            <span key={idx}>{tag}</span>
          ))}
        </div>
      </section>

      {/* Post Body */}
      <section className="text-lg leading-relaxed text-gray-200 mb-12">
        {mockPost.body}
      </section>

      {/* Comments */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        <div className="space-y-4">
          {mockComments.map((comment) => (
            <Comment
              key={comment.id}
              author={comment.author}
              text={comment.text}
            />
          ))}
        </div>
        <CommentForm onSubmit={handleNewComment} />
      </section>
    </main>
  );
}
