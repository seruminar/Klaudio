import { ICrmEntity } from './ICrmEntity';
import { ICrmUser } from './ICrmUser';

export interface ICrmNote extends ICrmEntity {
  subject: string | null;
  notetext: string;
  modifiedon?: Date;
  _modifiedby_value: Guid;
  annotationid: Guid;
  modifiedby?: ICrmUser;
  "objectid_incident@odata.bind"?: string;
}
