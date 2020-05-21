import { CrmChildMap } from './CrmChildMap';
import { CrmEndpoint } from './CrmEndpoint';

type CacheKeys = keyof CrmEndpoint | keyof CrmChildMap;

export const cacheDurations: { [key in CacheKeys]: number } = {
  WhoAmI: 0,
  systemusers: 0,
  contacts: 90,
  dyn_tags: 0,
  emails: 90,
  emailbody: 5,
  activitymimeattachments: 0,
  ken_services: 90,
  ken_customersuccessprojects: 90,
  incidents: 30,
  connections: 0,
  annotations: 120,
  templates: 0,
  accounts: 0,
  Incident_Emails: 90,
  Incident_Annotation: 120,
  email_activity_parties: 0,
  incident_connections1: 0,
  email_activity_mime_attachment: 0,
};
