import React, { FC } from 'react';

import { Typography } from '@material-ui/core';

import { ICrmParty } from '../../../../services/crmService/models/ICrmParty';
import { ParticipationType } from '../../../../services/crmService/models/ParticipationType';

interface IEmailSenderLineProps {
  parties: ICrmParty[];
}
export const EmailSenderLine: FC<IEmailSenderLineProps> = ({ parties }) => {
  const sender = parties.find(party => party.participationtypemask === ParticipationType.Sender);

  if (sender) {
    return <Typography variant="caption">{sender.partyid_contact?.fullname ?? sender.addressused}</Typography>;
  }

  return null;
};
