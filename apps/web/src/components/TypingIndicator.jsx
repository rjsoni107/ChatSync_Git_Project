const TypingIndicator = ({ users }) => {
    if (!users.length) return null;

    const names = users.map(u => u.name).join(", ");

    return (
        <div className="px-3 py-1 text-sm text-gray-500 italic flex items-center gap-2">
            <div className="flex gap-1">
                <span className="dot" />
                <span className="dot delay-1" />
                <span className="dot delay-2" />
            </div>
            {names} typing...
        </div>
    );
};

export default TypingIndicator;
