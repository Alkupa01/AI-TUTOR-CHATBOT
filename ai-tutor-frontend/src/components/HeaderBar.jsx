export default function HeaderBar({ level }) {
  return (
    <div className="w-full p-4 bg-white border-b flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-700">
        Tutor AI — {level}
      </h2>

      <span className="text-sm text-gray-500">
        Belajar jadi lebih mudah 📚
      </span>
    </div>
  );
}
