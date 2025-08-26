import PostCard from "../components/PostCard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          Be Better
          <br />
          Together
          <br />
          New
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Share your story. Get support. Stay consistent.
        </p>
        <button className="mt-8 bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition">
          Join the Forum
        </button>
      </section>

      {/* Post Preview Grid */}
      <section className="mt-20 grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
        <PostCard title="Morning Routine Tips" tags="#habits" comments={12} />
        <PostCard title="Staying Motivated" tags="#motivation" comments={8} />
        <PostCard
          title="Breaking Bad Eating Habits"
          tags="#health"
          comments={3}
        />
        <PostCard title="Achieving Your Goals" tags="#goals" comments={5} />
      </section>
    </main>
  );
}
