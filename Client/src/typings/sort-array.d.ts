declare module "sort-array" {
  type CustomOrders = { [key: string]: string[] };
  type Computed<T> = { [key: string]: (item: T) => string | number | boolean | undefined };

  declare function sortArray<T>(
    arr: T[],
    options?: {
      by?: keyof T | Array<keyof T>;
      order?: "asc" | "desc" | Array<"asc" | "desc">;
      nullRank?: 1 | -1;
      undefinedRank?: 1 | -1;
    }
  ): T[];

  declare function sortArray<T, C1 extends CustomOrders>(
    arr: T[],
    options?: {
      by?: keyof T | Array<keyof T>;
      order?: "asc" | "desc" | keyof C1 | Array<"asc" | "desc" | keyof C1>;
      customOrders: C1;
      nullRank?: 1 | -1;
      undefinedRank?: 1 | -1;
    }
  ): T[];

  declare function sortArray<T, C2 extends Computed<T>>(
    arr: T[],
    options?: {
      by?: keyof T | keyof C2 | Array<keyof T | keyof C2>;
      order?: "asc" | "desc" | Array<"asc" | "desc">;
      computed: C2;
      nullRank?: 1 | -1;
      undefinedRank?: 1 | -1;
    }
  ): T[];

  declare function sortArray<T, C1 extends CustomOrders, C2 extends Computed<T>>(
    arr: T[],
    options?: {
      by?: keyof T | keyof C2 | Array<keyof T | keyof C2>;
      order?: "asc" | "desc" | keyof C1 | Array<"asc" | "desc" | keyof C1>;
      customOrders: C1;
      computed: C2;
      nullRank?: 1 | -1;
      undefinedRank?: 1 | -1;
    }
  ): T[];

  export = sortArray;
}
