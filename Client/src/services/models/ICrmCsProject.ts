import { ICrmEntity } from './ICrmEntity';

enum ProjectType {
  CSEP = 281600000,
  CSP = 281600001,
  PE = 281600002,
  EMS = 281600003,
  KK = 281600004,
  KK_EMS = 281600005,
}
export enum ProductFamily {
  KK = 281600000,
  EMS = 281600001,
}

export interface ICrmCsProject extends ICrmEntity {
  ken_csprojecttype: ProjectType;
  ken_productfamily: ProductFamily;
  ken_name: string;
  ken_csprojectdetails: string;
  ken_csprojectstatus: unknown;
  ken_customersuccessprojectid: Guid;
  createdon: Date;
}
