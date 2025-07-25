export default function PostCard({ title, tags, comments }) {
  return (
    <div className="bg-white text-black p-6 rounded-xl hover:bg-gray-100 transition">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm mt-2 text-gray-600">{tags}</p>
      <p className="text-sm mt-2 text-gray-400">{comments} comments</p>
    </div>
  );
}
