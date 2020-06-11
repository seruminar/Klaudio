import { ICrmEntity } from './ICrmEntity';
import { ProductFamily } from './ProductFamily';
import { ServiceTaskStatus } from './ServiceTaskStatus';
import { ServiceTaskStatusReason } from './ServiceTaskStatusReason';

export interface ICrmAccountServiceTask extends ICrmEntity {
  activityid: Guid;
  modifiedon: Date;
  actualend?: Date;
  createdon?: Date;
  isregularactivity?: boolean;
  isworkflowcreated?: boolean;
  ken_credits?: number;
  ken_date?: Date;
  ken_productfamily?: ProductFamily;
  ken_taskactualtime?: number;
  statecode?: ServiceTaskStatus;
  statuscode?: ServiceTaskStatusReason;
  subject?: string;
  _createdby_value?: Guid;
  _ken_case_value?: Guid | null;
  _ken_taskconsultantid_value?: Guid;
  _modifiedby_value?: Guid;
  _ownerid_value?: Guid;
  _owningbusinessunit_value?: Guid;
  _owninguser_value?: Guid;
  _regardingobjectid_value?: Guid;
  "ken_taskconsultantid_ken_servicetask@odata.bind"?: string;
  "ownerid@odata.bind"?: string;
  "regardingobjectid_ken_service@odata.bind"?: string;
  "ken_Case_ken_servicetask@odata.bind"?: string;
}
