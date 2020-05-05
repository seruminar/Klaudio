import { ICrmAttachment } from './models/ICrmAttachment';
import { ICrmConnection } from './models/ICrmConnection';
import { ICrmEmail } from './models/ICrmEmail';
import { ICrmNote } from './models/ICrmNote';
import { ICrmParty } from './models/ICrmParty';

export type CrmChildMap = {
  Incident_Emails: ICrmEmail;
  Incident_Annotation: ICrmNote;
  email_activity_parties: ICrmParty;
  incident_connections1: ICrmConnection;
  email_activity_mime_attachment: ICrmAttachment;
};
