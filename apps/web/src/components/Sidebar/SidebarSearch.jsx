import { IoSearchOutline } from "react-icons/io5";

export default function SidebarSearch({ searchTerm, onSearchChange, activeFilter, onFilterChange }) {
    const filters = ["All", "Unread", "Favourites", "Groups"];

    return (
        <div className="px-4 pb-2 space-y-3 bg-[#111b21]">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors">
                    <IoSearchOutline size={18} />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search or start new chat"
                    className="w-full bg-[#202c33] border-none rounded-lg py-1.5 pl-12 pr-4 text-sm text-white placeholder-gray-400 focus:ring-0 focus:outline-none"
                />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => onFilterChange(f.toLowerCase())}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${activeFilter === f.toLowerCase()
                            ? "bg-blue-600 text-white"
                            : "bg-[#202c33] text-gray-400 hover:bg-[#2a3942]"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>
        </div>
    );
}
