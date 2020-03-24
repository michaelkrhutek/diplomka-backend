export const getRoundedNumber = (n: number, precision: number): number => {
    return Math.round(n * (10 ** precision)) / (10 ** precision);
}

export const getUTCDate = (d: Date, zeroTime = true): Date => {
    const utcDate: Date = new Date((new Date(d)).toUTCString());
    if (zeroTime) {
        utcDate.setHours(0);
        utcDate.setMinutes(0);
        utcDate.setSeconds(0);
        utcDate.setUTCMilliseconds(0);
    } else {
        utcDate.setHours(23);
        utcDate.setMinutes(59);
        utcDate.setSeconds(59);
        utcDate.setUTCMilliseconds(999);
    }
    return utcDate;
}