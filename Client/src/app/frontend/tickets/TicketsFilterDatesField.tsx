import { Moment } from 'moment';
import React, { FC } from 'react';

import MomentUtils from '@date-io/moment';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';

interface ITicketsFilterDatesFieldProps {
  labels: [string, string];
  value: [Moment | null, Moment | null];
  setValue: (value: [Moment | null, Moment | null]) => void;
}

export const TicketsFilterDatesField: FC<ITicketsFilterDatesFieldProps> = ({ labels, value, setValue }) => {
  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <KeyboardDatePicker
        disableToolbar
        disableFuture
        autoOk
        variant="inline"
        format="LL"
        label={labels[0]}
        value={value[0]}
        onChange={(valueStart) => setValue([valueStart, value[1]])}
        KeyboardButtonProps={{
          "aria-label": labels[0],
        }}
      />
      <KeyboardDatePicker
        disableToolbar
        disableFuture
        autoOk
        variant="inline"
        format="LL"
        margin="dense"
        label={labels[1]}
        value={value[1]}
        onChange={(valueEnd) => setValue([value[0], valueEnd])}
        KeyboardButtonProps={{
          "aria-label": labels[1],
        }}
      />
    </MuiPickersUtilsProvider>
  );
};
