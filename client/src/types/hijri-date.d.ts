declare module 'hijri-date' {
  export default class HijriDate {
    constructor(date?: Date | number | string);
    static now(): number;
    getFullYear(): number;
    getMonth(): number;
    getDate(): number;
    toDateString(): string;
    toString(): string;
    format?(pattern: string): string;
  }
}
