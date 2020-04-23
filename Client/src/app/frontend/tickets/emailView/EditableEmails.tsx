import React, { Dispatch, FC, SetStateAction } from 'react';

import { TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import { getRecipientLabel } from '../ticketUtilities';
import { IEmailRecipient } from './IEmailRecipient';

interface IEditableEmailsProps {
  value: IEmailRecipient[];
  setValue: Dispatch<SetStateAction<IEmailRecipient[]>>;
  label: string;
  className?: string;
}

export const EditableEmails: FC<IEditableEmailsProps> = ({ value, setValue, label, className }) => {
  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      className={className}
      options={[] as IEmailRecipient[]}
      getOptionLabel={getRecipientLabel}
      value={value}
      onChange={(_event: any, newValue: IEmailRecipient[] | null) => {
        if (newValue) {
          setValue(
            newValue.map((recipient: IEmailRecipient | string) =>
              recipient.hasOwnProperty("email") ? (recipient as IEmailRecipient) : { email: recipient as string }
            )
          );
        }
      }}
      renderInput={params => <TextField label={label} {...params} />}
    />
  );
};
