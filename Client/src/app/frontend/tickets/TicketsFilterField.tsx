import React, { FC, useMemo } from 'react';

import { createStyles, makeStyles, TextField } from '@material-ui/core';
import { Autocomplete, createFilterOptions } from '@material-ui/lab';

interface ITicketsFilterFieldProps {
  options: { [key: string]: string };
  label: string;
  getCount?: (value: string) => number | undefined;
  value: string | null;
  setValue: (value: string | null) => void;
  getFilterOptionString?: (option: string) => string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    itemCount: { textAlign: "right", fontSize: ".75rem", lineHeight: ".75rem" },
    input: {
      flex: 1,
    },
  })
);
export const TicketsFilterField: FC<ITicketsFilterFieldProps> = ({ options, label, getCount, value, setValue, getFilterOptionString }) => {
  const styles = useStyles();

  const filterOptions = useMemo(
    () =>
      createFilterOptions({
        limit: 10,
        stringify: getFilterOptionString,
      }),
    [getFilterOptionString]
  );

  return (
    <Autocomplete
      classes={{ input: styles.input }}
      options={Object.keys(options)}
      getOptionLabel={(option) => options[option]}
      renderOption={
        getCount &&
        ((option) => {
          const count = getCount(option);

          return (
            <>
              <span className={styles.input}>{options[option]}</span>
              {count !== undefined && count > 0 && <span className={styles.itemCount}>{count}</span>}
            </>
          );
        })
      }
      value={value}
      onChange={(_event, value) => setValue(value)}
      filterOptions={filterOptions}
      renderInput={(params) => {
        const count = getCount && getCount(Object.keys(options).find((key) => options[key] === (params.inputProps as any).value)!);

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
