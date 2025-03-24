const convert = (value: number) => {
    let s = value;
    const months = Math.floor(s / (30 * 24 * 3600));
    s %= 30 * 24 * 3600;

    const days = Math.floor(s / (24 * 3600));
    s %= 24 * 3600;

    const hours = Math.floor(s / 3600);
    s %= 3600;

    const minutes = Math.floor(s / 60);
    s %= 60;

    const sec = s ? `${s} sec` : '';
    const min = minutes ? `${minutes} min` : '';
    const hour = hours ? `${hours} hr` : '';
    const day = days ? `${days} ds` : '';
    const month = months ? `${months} mn` : '';

    const timeParts = [month, day, hour, min, sec].filter(Boolean);
    return timeParts[0];
}

export default convert;