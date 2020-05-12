import { ICrmEntity } from './ICrmEntity';

export enum ServiceStatus {
  Purchased = 1,
  Expired = 2,
  Completed = 281600000,
  InProgress = 281600001,
  Cancelled = 281600003,
}

export enum ServiceType {
  Training = 281600000,
  Credits = 281600001,
  Audit = 281600002,
  CustomerSuccess = 281600003,
}

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
