import { ICrmEntity } from './ICrmEntity';
import { TagGroup } from './TagGroup';
import { TagStatus } from './TagStatus';

export interface ICrmTag extends ICrmEntity {
  dyn_tagid: Guid;
  dyn_name?: string;
  statuscode?: TagStatus;
  ken_taggroup?: TagGroup;
}
