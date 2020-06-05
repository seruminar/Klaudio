import React, { FC, MouseEvent, ReactNode, useCallback, useMemo, useState } from 'react';

import {
    createStyles,
    Grid,
    IconButton,
    Link,
    makeStyles,
    MenuItem,
    Popover,
    Tooltip
} from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';

interface IMenuOption {
  icon?: ReactNode;
  label: ReactNode;
  target?: string;
  onClick?: () => void;
}

interface IMenuProps {
  tooltip: string;
  icon?: ReactNode;
  className?: string;
  options: (IMenuOption | false)[];
}

const useStyles = makeStyles((theme) =>
  createStyles({
    item: { padding: theme.spacing(1) },
    icon: {
      lineHeight: 0,
      marginRight: theme.spacing(0.5),
    },
  })
);

export const Menu: FC<IMenuProps> = ({ tooltip, icon, className, options }) => {
  const styles = useStyles();

  const [popoverEl, setPopoverEl] = useState<null | HTMLElement>(null);

  const openMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setPopoverEl(event.currentTarget);
  }, []);

  const closeMenu = useCallback(
    (onClick?: () => void) => (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setPopoverEl(null);
      onClick && onClick();
    },
    []
  );

  const popoverIsOpen = useMemo(() => Boolean(popoverEl), [popoverEl]);

  return (
    <>
      <Tooltip className={className} title={tooltip} aria-label={tooltip}>
        <IconButton aria-controls="long-menu" aria-haspopup="true" onClick={openMenu}>
          {icon ? icon : <MoreVert />}
        </IconButton>
      </Tooltip>
      <Popover
        keepMounted
        anchorEl={popoverEl}
        open={popoverIsOpen}
        onClose={closeMenu()}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {options.map(
          (option, index) =>
            option && (
              <MenuItem className={styles.item} onClick={closeMenu(option.onClick)} key={index}>
                <Link href={option.target} underline="none" color="textPrimary" target="_blank" rel="noreferrer noopener">
                  <Grid container alignItems="center">
                    {option.icon && (
                      <Grid item className={styles.icon}>
                        {option.icon}
                      </Grid>
                    )}
                    <Grid item>{option.label}</Grid>
                  </Grid>
                </Link>
              </MenuItem>
            )
        )}
      </Popover>
    </>
  );
};
