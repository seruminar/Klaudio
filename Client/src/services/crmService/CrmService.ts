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
  currentUser: () => ICrmIdQueryBuilder<ICrmCurrentUser> = () => new CrmIdQuery<ICrmCurrentUser>("WhoAmI", 0, "");

  users: () => ICrmQueryBuilder<ICrmUser> = () => new CrmQuery<ICrmUser>("systemusers", 0);

  contacts: () => ICrmQueryBuilder<ICrmContact> = () => new CrmQuery<ICrmContact>("contacts", 90);

  tags: () => ICrmQueryBuilder<ICrmTag> = () => new CrmQuery<ICrmTag>("dyn_tags", 0);

  emails: () => ICrmQueryBuilder<ICrmEmail> = () => new CrmQuery<ICrmEmail>("emails", 90);

  attachments: () => ICrmQueryBuilder<ICrmAttachment> = () => new CrmQuery<ICrmAttachment>("activitymimeattachments", 0);

  emailBody: () => ICrmEmailBodyQueryBuilder = () => new CrmEmailBodyQuery();

  services: () => ICrmQueryBuilder<ICrmAccountService> = () => new CrmQuery<ICrmAccountService>("ken_services", 90);

  csProjects: () => ICrmQueryBuilder<ICrmCsProject> = () => new CrmQuery<ICrmCsProject>("ken_customersuccessprojects", 90);

  tickets: () => ICrmQueryBuilder<ICrmTicket> = () => new CrmQuery<ICrmTicket>("incidents", 30);

  connections: () => ICrmQueryBuilder<ICrmConnection> = () => new CrmQuery<ICrmConnection>("connections", 0);

  notes: () => ICrmQueryBuilder<ICrmNote> = () => new CrmQuery<ICrmNote>("annotations", 0);

  cannedResponses: () => ICrmQueryBuilder<ICrmCannedResponse> = () => new CrmQuery<ICrmCannedResponse>("templates", 0);

  accounts: () => ICrmQueryBuilder<ICrmAccount> = () => new CrmQuery<ICrmAccount>("accounts", 0);

  crmUrl: (type: CrmEntity) => ICrmUrlBuilder = (type: CrmEntity) => new CrmUrl(type);
}
