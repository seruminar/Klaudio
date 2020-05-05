import React, { FC } from 'react';

import { createStyles, makeStyles, TextField, Theme } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

interface ITicketsFilterFieldProps {
  options: { [key: string]: string };
  label: string;
  getCount?: (value: string) => number | undefined;
  value: string | null;
  setValue: (value: string | null) => void;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    itemCount: { flex: 1, textAlign: "right", fontSize: ".75rem" },
    input: {
      minWidth: "100% !important"
    }
  })
);

export const TicketsFilterField: FC<ITicketsFilterFieldProps> = ({ options, label, getCount, value, setValue }) => {
  const styles = useStyles();

  return (
    <Autocomplete
      classes={{ input: styles.input }}
      options={Object.keys(options)}
      getOptionLabel={option => options[option]}
      renderOption={
        getCount &&
        (option => {
          const count = getCount(option);

          return (
            <>
              <span>{options[option]}</span>
              {count !== undefined && count > 0 && <span className={styles.itemCount}>{count}</span>}
            </>
          );
        })
      }
      value={value}
      onChange={(_event: any, newValue: string | null) => setValue(newValue)}
      renderInput={params => {
        const count = getCount ? getCount((params.inputProps as any).value) : 0;

        params.InputProps.endAdornment = (
          <span className={styles.itemCount}>
            {count !== undefined && count > 0 && count}
            {params.InputProps.endAdornment}
          </span>
        );

        return <TextField {...params} label={label} />;
      }}
    />
  );
};
