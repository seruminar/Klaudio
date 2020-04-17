import { ICrmEntity } from './ICrmEntity';

export interface ICrmCannedResponse extends ICrmEntity {
  title: string;
  templateid: Guid;
  presentationxml: string;
}
