export const getRoundedNumber = (n: number, precision: number): number => {
    return Math.round(n * (10 ** precision)) / (10 ** precision);
}

export const getUTCDate = (d: Date, endDay = false): Date => {
    if (endDay) {
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()), 23, 59, 59, 999);
    } else {
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()), 0, 0, 0, 0);
    }
}