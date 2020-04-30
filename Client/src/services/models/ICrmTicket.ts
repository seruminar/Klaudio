import { ICrmAccount } from './ICrmAccount';
import { ICrmContact } from './ICrmContact';
import { ICrmEntity } from './ICrmEntity';
import { ICrmUser } from './ICrmUser';
import { TicketGroup } from './TicketGroup';
import { TicketPriority } from './TicketPriority';
import { TicketStatus } from './TicketStatus';

export interface ICrmTicket extends ICrmEntity {
  incidentid: Guid;
  title?: string;
  createdon?: Date;
  ken_sladuedate?: Date;
  modifiedon?: Date;
  _ownerid_value?: Guid;
  ticketnumber?: string;
  dyn_accountlevelgl?: unknown;
  dyn_issla?: boolean;
  dyn_is2level?: boolean;
  prioritycode?: TicketPriority;
  statuscode?: TicketStatus;
  ken_documentationlinks?: string | null;
  dyn_ticket_group?: TicketGroup;
  _customerid_value?: Guid;
  _ken_latestcontact_value?: Guid;
  primarycontactid?: ICrmContact | null;
  customerid_account?: ICrmAccount | null;
  owninguser?: ICrmUser;
}
