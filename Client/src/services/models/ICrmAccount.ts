import { ICrmEntity } from './ICrmEntity';
import { SupportLevel } from './SupportLevel';

export interface ICrmAccount extends ICrmEntity {
  accountid: Guid;
  name: string;
  ken_customernote: string | null;
  ken_supportlevel: SupportLevel | null;
  _dyn_accountexecutiveid_value: Guid;
  _owninguser_value: Guid;
  _dyn_accountmanagerid_value: Guid;
}
