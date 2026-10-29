const oneDecimal = (n: number) => String(Math.round(n * 10) / 10);

export const hours = (h: number) => `${oneDecimal(h)} h`;
export const percent = (x: number) => `${oneDecimal(x * 100)}%`;
