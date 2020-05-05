import { ICrmContact } from './ICrmContact';
import { ICrmEntity } from './ICrmEntity';
import { ParticipationType } from './ParticipationType';

export interface ICrmParty extends ICrmEntity {
  addressused: string;
  participationtypemask: ParticipationType;
  activitypartyid: Guid;
  partyid_contact?: ICrmContact;
}
