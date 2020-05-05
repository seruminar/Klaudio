import { ICrmEntity } from './ICrmEntity';

export interface ICrmCurrentUser extends ICrmEntity {
  BusinessUnitId: Guid;
  UserId: Guid;
  OrganizationId: Guid;
}
