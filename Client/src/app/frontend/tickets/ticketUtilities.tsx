import React from 'react';

import {
    Archive,
    Code,
    Description,
    Image,
    InsertDriveFile,
    Movie,
    PictureAsPdf,
    Slideshow
} from '@material-ui/icons';

import { IEmailRecipient } from './emailView/IEmailRecipient';

export const getFileIcon = (mimeType: string) => {
  switch (mimeType) {
    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/tiff":
      return <Image />;
    case "video/mp4":
    case "video/x-msvideo":
      return <Movie />;
    case "application/pdf":
      return <PictureAsPdf />;
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.ms-excel":
    case "text/plain":
      return <Description />;
    case "application/json":
    case "application/xml":
    case "text/xml":
    case "text/javascript":
      return <Code />;
    case "application/x-zip-compressed":
      return <Archive />;
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return <Slideshow />;
    case "application/x-msdownload":
    case "application/octet-stream":
    default:
      return <InsertDriveFile />;
  }
};

export const getRecipientLabel = (recipient: IEmailRecipient) => {
  if (recipient.name && recipient.email) {
    return `${recipient.name} <${recipient.email}>`;
  }

  return recipient.email;
};
