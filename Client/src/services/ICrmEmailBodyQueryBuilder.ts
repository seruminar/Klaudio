export interface ICrmEmailBodyQueryBuilder extends PromiseLike<string> {
  id: (id: Guid) => ICrmEmailBodyQueryBuilder;
}
