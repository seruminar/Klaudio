export interface ICrmUrlBuilder {
  id: (id: Guid) => ICrmUrlBuilder;
  build: () => string;
  open: () => void;
}
