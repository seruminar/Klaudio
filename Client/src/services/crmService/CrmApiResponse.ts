interface ICrmApiResponse {
  "@odata.context": string;
}

export type CrmApiResponse<T> = T extends any[] ? ICrmApiResponse & { value: T } : T extends string ? T : ICrmApiResponse & T;
