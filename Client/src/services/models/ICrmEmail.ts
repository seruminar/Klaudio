import { ICrmAttachment } from './ICrmAttachment';
import { ICrmEntity } from './ICrmEntity';
import { ICrmTicket } from './ICrmTicket';

export enum EmailStatus {
  Draft = 1,
  Completed = 2,
  Sent = 3,
  Received = 4,
  Canceled = 5,
  PendingSend = 6,
  Sending = 7,
  Failed = 8
}

export interface ICrmEmail extends ICrmEntity {
  activityid: Guid;
  _ownerid_value?: Guid;
  createdon?: Date;
  modifiedon?: Date;
  senton?: Date | null;
  subject?: string;
  statuscode?: EmailStatus;
  directioncode?: boolean;
  sender?: string;
  torecipients?: string;
  attachmentcount?: number;
  trackingtoken?: string;
  description?: string;
  email_activity_mime_attachment: ICrmAttachment[];
  regardingobjectid_incident: ICrmTicket;
}
