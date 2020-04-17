export const format = (source: string, ...replacements: string[]) =>
  source.replace(/{(\d+)}/g, (match, number) => (replacements[number] ? replacements[number] : match));
