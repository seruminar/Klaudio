import { CrmEmailBodyQuery } from './CrmEmailBodyQuery';
import { CrmIdQuery } from './CrmIdQuery';
import { CrmQuery } from './CrmQuery';
import { ICrmEmailBodyQueryBuilder } from './ICrmEmailBodyQueryBuilder';
import { ICrmIdQueryBuilder } from './ICrmIdQueryBuilder';
import { ICrmQueryBuilder } from './ICrmQueryBuilder';
import { ICrmAccount } from './models/ICrmAccount';
import { ICrmAccountService } from './models/ICrmAccountService';
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
  users: () => ICrmQueryBuilder<ICrmUser> = () => new CrmQuery<ICrmUser>("systemusers");

  accounts: () => ICrmQueryBuilder<ICrmAccount> = () => new CrmQuery<ICrmAccount>("accounts");

  notes: () => ICrmQueryBuilder<ICrmNote> = () => new CrmQuery<ICrmNote>("annotations");

  connections: () => ICrmQueryBuilder<ICrmConnection> = () => new CrmQuery<ICrmConnection>("connections");

  contacts: () => ICrmQueryBuilder<ICrmContact> = () => new CrmQuery<ICrmContact>("contacts");

  tags: () => ICrmQueryBuilder<ICrmTag> = () => new CrmQuery<ICrmTag>("dyn_tags");

  emails: () => ICrmQueryBuilder<ICrmEmail> = () => new CrmQuery<ICrmEmail>("emails");

  emailBody: () => ICrmEmailBodyQueryBuilder = () => new CrmEmailBodyQuery();

  services: () => ICrmQueryBuilder<ICrmAccountService> = () => new CrmQuery<ICrmAccountService>("ken_services");

  csProjects: () => ICrmQueryBuilder<ICrmCsProject> = () => new CrmQuery<ICrmCsProject>("ken_customersuccessprojects");

  tickets: () => ICrmQueryBuilder<ICrmTicket> = () => new CrmQuery<ICrmTicket>("incidents");

  cannedResponses: () => ICrmQueryBuilder<ICrmCannedResponse> = () => new CrmQuery<ICrmCannedResponse>("templates");

  currentUser: () => ICrmIdQueryBuilder<ICrmCurrentUser> = () => new CrmIdQuery<ICrmCurrentUser>("WhoAmI", "");
}
