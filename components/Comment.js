export default function Comment({ author, text }) {
  return (
    <div className="bg-white text-black p-4 rounded-lg shadow-sm">
      <p className="text-sm text-gray-800">{text}</p>
      <div className="text-xs text-gray-500 mt-2">by {author}</div>
    </div>
  );
}
