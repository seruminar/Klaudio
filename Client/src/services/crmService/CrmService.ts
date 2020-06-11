import { CrmEmailBodyQuery } from './CrmEmailBodyQuery';
import { CrmEntity } from './CrmEntity';
import { CrmIdQuery } from './CrmIdQuery';
import { CrmQuery } from './CrmQuery';
import { CrmUrl } from './CrmUrl';
import { ICrmEmailBodyQueryBuilder } from './ICrmEmailBodyQueryBuilder';
import { ICrmIdQueryBuilder } from './ICrmIdQueryBuilder';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmUrlBuilder } from './ICrmUrlBuilder';
import { ICrmAccount } from './models/ICrmAccount';
import { ICrmAccountService } from './models/ICrmAccountService';
import { ICrmAccountServiceTask } from './models/ICrmAccountServiceTask';
import { ICrmAttachment } from './models/ICrmAttachment';
import { ICrmCannedResponse } from './models/ICrmCannedResponse';
import { ICrmConnection } from './models/ICrmConnection';
import { ICrmContact } from './models/ICrmContact';
import { ICrmCsProject } from './models/ICrmCsProject';
import { ICrmCurrentUser } from './models/ICrmCurrentUser';
import { ICrmEmail } from './models/ICrmEmail';
import { ICrmNote } from './models/ICrmNote';
import { ICrmTag } from './models/ICrmTag';
import { ICrmTicket } from './models/ICrmTicket';
import { ICrmUser } from './models/ICrmUser';

export const ICrmService = "ICrmService";

export class CrmService {
  currentUser: () => ICrmIdQueryBuilder<ICrmCurrentUser> = () => new CrmIdQuery<ICrmCurrentUser>("WhoAmI", "");
  users: () => ICrmQueryBuilder<ICrmUser> = () => new CrmQuery<ICrmUser>("systemusers");
  contacts: () => ICrmQueryBuilder<ICrmContact> = () => new CrmQuery<ICrmContact>("contacts");
  tags: () => ICrmQueryBuilder<ICrmTag> = () => new CrmQuery<ICrmTag>("dyn_tags");
  emails: () => ICrmQueryBuilder<ICrmEmail> = () => new CrmQuery<ICrmEmail>("emails");
  attachments: () => ICrmQueryBuilder<ICrmAttachment> = () => new CrmQuery<ICrmAttachment>("activitymimeattachments");
  emailBody: () => ICrmEmailBodyQueryBuilder = () => new CrmEmailBodyQuery();
  services: () => ICrmQueryBuilder<ICrmAccountService> = () => new CrmQuery<ICrmAccountService>("ken_services");
  serviceTasks: () => ICrmQueryBuilder<ICrmAccountServiceTask> = () => new CrmQuery<ICrmAccountServiceTask>("ken_servicetasks");
  csProjects: () => ICrmQueryBuilder<ICrmCsProject> = () => new CrmQuery<ICrmCsProject>("ken_customersuccessprojects");
  tickets: () => ICrmQueryBuilder<ICrmTicket> = () => new CrmQuery<ICrmTicket>("incidents");
  connections: () => ICrmQueryBuilder<ICrmConnection> = () => new CrmQuery<ICrmConnection>("connections");
  notes: () => ICrmQueryBuilder<ICrmNote> = () => new CrmQuery<ICrmNote>("annotations");
  cannedResponses: () => ICrmQueryBuilder<ICrmCannedResponse> = () => new CrmQuery<ICrmCannedResponse>("templates");
  accounts: () => ICrmQueryBuilder<ICrmAccount> = () => new CrmQuery<ICrmAccount>("accounts");
  crmUrl: (type: CrmEntity) => ICrmUrlBuilder = (type: CrmEntity) => new CrmUrl(type);
}
