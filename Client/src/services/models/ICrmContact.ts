import { ICrmEntity } from './ICrmEntity';
import { SupportLevel } from './SupportLevel';

export enum ContactPosition {
  Unknown = 281600007,
  Developer = 281600000,
  Marketer = 281600001,
  ContentEditor = 281600002,
  FrontEndDev = 281600003,
  BackEndDeveloper = 281600004,
  SystemAdmin_IT = 281600005,
  Executive_Manager = 281600006
}

export interface ICrmContact extends ICrmEntity {
  contactid: Guid;
  fullname: string;
  ken_position: ContactPosition;
  ken_supportlevel: SupportLevel;
  ken_comment: string | null;
}
