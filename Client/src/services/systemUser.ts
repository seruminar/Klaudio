import { entityNames } from '../terms.en-us.json';
import { ICrmUser } from './crmService/models/ICrmUser';
import { UserAccessMode } from './crmService/models/UserAccessMode';

export const systemUser: ICrmUser = {
  systemuserid: "d87c1051-28c1-e511-8112-3863bb34b9b0",
  fullname: entityNames.systemUser,
  accessmode: UserAccessMode.ReadWrite,
  internalemailaddress: "svc-CRM-System@kentico.com",
  domainname: "svc-CRM-System@kenticosoftware.onmicrosoft.com"
};
