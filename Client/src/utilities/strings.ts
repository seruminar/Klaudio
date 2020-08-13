export const format = (source: string, ...replacements: string[]) => source.replace(/{(\d+)}/g, (_match, number) => replacements[number]);
