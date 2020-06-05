import React, { FC, useEffect, useRef, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { createStyles, InputAdornment, makeStyles, TextField } from '@material-ui/core';

import { experience } from '../../../appSettings.json';
import { Loading } from '../../shared/Loading';

interface ITicketsSearchFieldProps {
  label: string;
  searching: boolean;
  setFilter: (value: string) => void;
  resetValue: boolean;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    searchLoading: {
      height: "1em",
    },
  })
);

export const TicketsSearchField: FC<ITicketsSearchFieldProps> = ({ label, searching, setFilter, resetValue }) => {
  const styles = useStyles();

  const [value, setValue] = useState("");

  const searchTicketNumberStream = useRef(new Subject<string>());

  useEffect(() => {
    if (resetValue) {
      setValue("");
    }
  }, [resetValue]);

  useEffect(() => {
    const subscription = searchTicketNumberStream.current.pipe(debounceTime(experience.searchTimeout)).subscribe({
      next: async (value) => {
        setFilter(value);
      },
    });

    return () => subscription.unsubscribe();
  }, [setFilter]);

  return (
    <TextField
      label={label}
      fullWidth
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        searchTicketNumberStream.current.next(event.target.value);
      }}
      InputProps={
        searching
          ? {
              endAdornment: (
                <InputAdornment position="end" className={styles.searchLoading}>
                  <Loading small />
                </InputAdornment>
              ),
            }
          : undefined
      }
    />
  );
};
