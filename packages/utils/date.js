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

    const time = format(last, 'hh:mm a');

    if (diffDays === 0) {
        return `Today at ${time}`;
    }

    if (diffDays === 1) {
        return `Yesterday at ${time}`;
    }

    const dateVal = format(last, 'dd/MM/yyyy');
    return `${dateVal}, ${time}`;
};

export const getMessageDateLabel = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return format(date, 'd MMMM yyyy');
};