import clsx from 'clsx';
import React, { FC, ReactElement, useMemo } from 'react';

import { createStyles, IconButton, makeStyles, Tooltip } from '@material-ui/core';

interface IEmailEditorButtonProps {
  className?: string;
  icon: ReactElement;
  tooltip?: string;
  set?: () => void;
  unset?: () => void;
  active?: boolean;
}

const useStyles = makeStyles((theme) => createStyles({ button: {} }));

export const EmailEditorButton: FC<IEmailEditorButtonProps> = ({ className, icon, tooltip, set, unset, active }) => {
  const styles = useStyles();

  const toggle = useMemo(() => set && unset && (() => (active ? unset() : set())), [active, set, unset]);

  const button = useMemo(
    () => (
      <IconButton
        className={clsx(className, styles.button)}
        color={active ? "primary" : undefined}
        onClick={toggle ? toggle : set && (() => set())}
      >
        {icon}
      </IconButton>
    ),
    [className, styles.button, active, toggle, set, icon]
  );

  if (toggle || set) {
    return tooltip ? (
      <Tooltip title={tooltip} aria-label={tooltip}>
        {button}
      </Tooltip>
    ) : (
      button
    );
  }

  return icon;
};
