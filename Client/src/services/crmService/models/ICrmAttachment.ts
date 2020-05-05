import { ICrmEntity } from './ICrmEntity';

export interface ICrmAttachment extends ICrmEntity {
  attachmentcontentid?: string;
  activitymimeattachmentid: Guid;
  filesize: number;
  _objectid_value?: Guid;
  mimetype?: string;
  filename?: string;
  body?: string;
}
