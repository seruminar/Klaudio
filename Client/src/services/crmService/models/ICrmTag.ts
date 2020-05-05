import { ICrmEntity } from './ICrmEntity';

export interface ICrmTag extends ICrmEntity {
  dyn_name: string;
  dyn_tagid: Guid;
}
