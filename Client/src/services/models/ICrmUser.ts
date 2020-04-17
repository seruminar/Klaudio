import { ICrmEntity } from './ICrmEntity';
import { UserAccessMode } from './UserAccessMode';
import { UserType } from './UserType';

export interface ICrmUser extends ICrmEntity {
  fullname?: string;
  domainname?: string;
  systemuserid: string;
  address1_telephone3?: UserType;
  dyn_signature?: string;
  ownerid: string;
  accessmode?: UserAccessMode;
  internalemailaddress?: string;
}
