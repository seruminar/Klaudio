export const deleteFrom = <T>(items: T[] | T, array: T[]) => {
  let itemsToDelete = ensureArray(items);

  return array.filter(item => !itemsToDelete.includes(item));
};

export const ensureArray = <T>(arrayOrSingle: T[] | T) => {
  if (Array.isArray(arrayOrSingle)) {
    return arrayOrSingle;
  } else {
    return [arrayOrSingle];
  }
};
