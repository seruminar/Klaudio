import { ICrmEntity } from './ICrmEntity';
import { ICrmTag } from './ICrmTag';
import { ICrmTicket } from './ICrmTicket';

export interface ICrmConnection extends ICrmEntity {
  connectionid: Guid;
  name?: string;
  record1id_incident?: ICrmTicket;
  record2id_dyn_tag?: ICrmTag;

  "record1id_incident@odata.bind"?: string;
  "record2id_dyn_tag@odata.bind"?: string;
}
