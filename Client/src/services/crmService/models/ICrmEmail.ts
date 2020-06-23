import { EmailStatus } from './EmailStatus';
import { ICrmAttachment } from './ICrmAttachment';
import { ICrmEntity } from './ICrmEntity';
import { ICrmParty } from './ICrmParty';
import { ICrmTicket } from './ICrmTicket';

export interface ICrmEmail extends ICrmEntity {
  activityid: Guid;
  _ownerid_value?: Guid;
  createdon?: Date;
  modifiedon?: Date;
  senton?: Date | null;
  subject?: string;
  description?: string;
  statuscode?: EmailStatus;
  directioncode?: boolean;
  sender?: string;
  torecipients?: string;
  attachmentcount?: number;
  trackingtoken?: string;
  email_activity_parties?: ICrmParty[];
  email_activity_mime_attachment: ICrmAttachment[];
  _regardingobjectid_value?: Guid;
  regardingobjectid_incident?: ICrmTicket;
  "regardingobjectid_incident@odata.bind"?: string;
  "parentactivityid@odata.bind"?: string;
}
