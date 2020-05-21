import { ICrmEntity } from './ICrmEntity';
import { ServiceStatus } from './ServiceStatus';
import { ServiceType } from './ServiceType';

export interface ICrmAccountService extends ICrmEntity {
  ken_serviceid: Guid;
  ken_name?: string;
  ken_credits: number;
  ken_remainingcredits: number;
  ken_servicetype: ServiceType;
  ken_expireson: Date;
  statuscode: ServiceStatus;
  createdon: Date;
}
