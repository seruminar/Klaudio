import { ContactPosition } from './ContactPosition';
import { ICrmEntity } from './ICrmEntity';
import { SupportLevel } from './SupportLevel';

export interface ICrmContact extends ICrmEntity {
  contactid: Guid;
  fullname: string;
  ken_position: ContactPosition;
  ken_supportlevel: SupportLevel;
  ken_comment: string | null;
}
