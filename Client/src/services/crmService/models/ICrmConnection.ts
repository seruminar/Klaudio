import { ICrmEntity } from './ICrmEntity';

export interface ICrmConnection extends ICrmEntity {
  name: string;
  connectionid: Guid;
}
