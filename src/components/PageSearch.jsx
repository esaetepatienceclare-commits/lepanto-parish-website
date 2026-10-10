import { Search, X } from "lucide-react";

export default function PageSearch({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="max-w-md mx-auto relative mb-10">
      <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white shadow-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder:text-gray-400"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
