import React, {
    FC,
    MouseEvent,
    ReactElement,
    ReactNode,
    useCallback,
    useMemo,
    useState
} from 'react';

import { createStyles, IconButton, makeStyles, Popover, Tooltip } from '@material-ui/core';

interface IEmailEditorMenuProps {
  className?: string;
  icon: ReactElement;
  tooltip: string;
  set?: (closeMenu: () => void) => ReactNode;
  unset?: () => void;
  active?: boolean;
}

const useStyles = makeStyles((theme) => createStyles({ button: { padding: theme.spacing(1) } }));

export const EmailEditorMenu: FC<IEmailEditorMenuProps> = ({ className, icon, tooltip, set, unset, active }) => {
  const styles = useStyles();

  const [popoverEl, setPopoverEl] = useState<null | HTMLElement>(null);

  const popoverIsOpen = useMemo(() => Boolean(popoverEl), [popoverEl]);

  const openMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setPopoverEl(event.currentTarget);
  }, []);

  const closeMenu = useCallback(() => {
    setPopoverEl(null);
  }, []);

  const toggle = useCallback((event: MouseEvent<HTMLButtonElement>) => (unset ? (active ? unset() : openMenu(event)) : openMenu(event)), [
    active,
    unset,
    openMenu,
  ]);

  if (toggle || set) {
    return (
      <>
        <Tooltip title={tooltip} aria-label={tooltip}>
          <IconButton
            className={className}
            aria-controls="long-menu"
            aria-haspopup="true"
            onClick={toggle}
            color={active ? "primary" : undefined}
          >
            {icon}
          </IconButton>
        </Tooltip>
        <Popover
          keepMounted
          classes={{ paper: styles.button }}
          anchorEl={popoverEl}
          open={popoverIsOpen}
          onClose={closeMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          {popoverIsOpen && set && set(() => closeMenu())}
        </Popover>
      </>
    );
  }

  return (
    <Tooltip title={tooltip} aria-label={tooltip}>
      {icon}
    </Tooltip>
  );
};
