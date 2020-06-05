import React, { FC, useEffect, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
    createStyles,
    makeStyles,
    Slider,
    Tooltip,
    Typography,
    ValueLabelProps
} from '@material-ui/core';

import { experience } from '../../../appSettings.json';

interface ITicketsSearchRangeFieldProps {
  label: string;
  searching: boolean;
  range: [number, number];
  valueLabelFormat: string | ((value: number, index: number) => React.ReactNode);
  setFilter: (value: [number, number]) => void;
  resetValue: boolean;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    label: {
      marginBottom: theme.spacing(4.5),
    },
  })
);

export const TicketsSearchRangeField: FC<ITicketsSearchRangeFieldProps> = ({
  label,
  searching,
  range,
  valueLabelFormat,
  setFilter,
  resetValue,
}) => {
  const styles = useStyles();

  const [value, setValue] = useState(range);

  const searchTicketNumberStream = useRef(new Subject<[number, number]>());

  useEffect(() => {
    if (resetValue) {
      setValue(range);
    }
  }, [resetValue, range]);

  useEffect(() => {
    const subscription = searchTicketNumberStream.current.pipe(debounceTime(experience.searchTimeout)).subscribe({
      next: async (value) => {
        setFilter(value);
      },
    });

    return () => subscription.unsubscribe();
  }, [setFilter]);

  return (
    <>
      <Typography className={styles.label} variant="caption">
        {label}
      </Typography>
      <Slider
        valueLabelDisplay="on"
        min={range[0]}
        max={range[1]}
        value={value}
        onChange={(_event, value) => {
          setValue(value as [number, number]);
          searchTicketNumberStream.current.next(value as [number, number]);
        }}
        valueLabelFormat={valueLabelFormat}
        ValueLabelComponent={TicketSearchRangeLabel}
      />
    </>
  );
};

const TicketSearchRangeLabel: FC<ValueLabelProps> = ({ children, open, value }) => (
  <Tooltip open={open} enterTouchDelay={0} placement="bottom" title={value}>
    {children}
  </Tooltip>
);
