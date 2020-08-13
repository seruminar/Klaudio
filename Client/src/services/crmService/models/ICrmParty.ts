import { ICrmContact } from './ICrmContact';
import { ICrmEntity } from './ICrmEntity';
import { ICrmQueue } from './ICrmQueue';
import { ICrmTicket } from './ICrmTicket';
import { ICrmUser } from './ICrmUser';
import { ParticipationType } from './ParticipationType';

export interface ICrmParty extends ICrmEntity {
  addressused: string;
  participationtypemask: ParticipationType;
  activitypartyid: Guid;
  partyid_contact?: ICrmContact;
  "partyid_contact@odata.bind"?: string;
  partyid_queue?: ICrmQueue;
  "partyid_queue@odata.bind"?: string;
  partyid_incident?: ICrmTicket;
  "partyid_incident@odata.bind"?: string;
  partyid_systemuser?: ICrmUser;
  "partyid_systemuser@odata.bind"?: string;
}
