import React, { FC, useState } from 'react';

import {
    createStyles,
    FormControl,
    IconButton,
    Input,
    InputLabel,
    makeStyles,
    Theme,
    Tooltip
} from '@material-ui/core';
import { NoteAdd } from '@material-ui/icons';

interface IMultilineInputProps {
  className?: string;
  placeholder?: string;

  actionLabel?: string;
  action?: (value: string) => Promise<string>;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      alignItems: "flex-start",
    },
    input: {
      flex: 1,
    },
  })
);

export const MultilineInput: FC<IMultilineInputProps> = ({ className, placeholder, actionLabel, action }) => {
  const styles = useStyles();

  const [value, setValue] = useState("");

  return (
    <FormControl className={className}>
      <div className={styles.root}>
        <InputLabel>{placeholder}</InputLabel>
        <Input className={styles.input} multiline rowsMax={6} value={value} onChange={(event) => setValue(event.target.value)} />
        {value !== "" && (
          <>
            {actionLabel ? (
              <Tooltip title={actionLabel} aria-label={actionLabel}>
                <IconButton
                  color="primary"
                  aria-label={actionLabel}
                  onClick={(_) => action && action(value).then((value) => setValue(value))}
                >
                  <NoteAdd />
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton color="primary">
                <NoteAdd />
              </IconButton>
            )}
          </>
        )}
      </div>
    </FormControl>
  );
};
