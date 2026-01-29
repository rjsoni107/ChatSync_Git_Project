import { format } from 'date-fns';

export const formatDate = (date, formatStr = 'PPP') => {
    return format(new Date(date), formatStr);
};


export const formatLastSeen = (isoDate) => {
    if (!isoDate) return "Offline";

    const last = new Date(isoDate);
    const now = new Date();

    const lastDate = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate()
    );

    const todayDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

    const diffDays =
        (todayDate - lastDate) / (1000 * 60 * 60 * 24);

    const time = last.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (diffDays === 0) {
        return `Today at ${time}`;
    }

    if (diffDays === 1) {
        return `Yesterday at ${time}`;
    }

    const dateVal = last.toLocaleDateString("en-GB"); // dd/mm/yyyy
    return `${dateVal}, ${time}`;
};

export const getMessageDateLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
};