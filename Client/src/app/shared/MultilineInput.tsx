import React, { FC, ReactNode, useState } from 'react';

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
import { Check } from '@material-ui/icons';

interface IMultilineInputProps {
  className?: string;
  placeholder?: string;

  value?: string;
  actionLabel?: string;
  action?: (value: string) => Promise<string | void>;

  actionButton?: ReactNode;
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

export const MultilineInput: FC<IMultilineInputProps> = ({
  className,
  placeholder,
  value: defaultValue,
  actionLabel,
  action,
  actionButton,
}) => {
  const styles = useStyles();

  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <FormControl className={className}>
      <div className={styles.root}>
        {placeholder && <InputLabel>{placeholder}</InputLabel>}
        <Input className={styles.input} multiline rowsMax={6} value={value} onChange={(event) => setValue(event.target.value)} />
        {value !== "" && action && (
          <>
            {actionLabel ? (
              <Tooltip title={actionLabel} aria-label={actionLabel}>
                <IconButton
                  color="primary"
                  aria-label={actionLabel}
                  onClick={(_) => action(value).then((value) => value !== undefined && setValue(value))}
                >
                  {actionButton ? actionButton : <Check />}
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton color="primary" onClick={(_) => action(value).then((value) => value !== undefined && setValue(value))}>
                {actionButton ? actionButton : <Check />}
              </IconButton>
            )}
          </>
        )}
      </div>
    </FormControl>
  );
};
