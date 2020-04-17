import React, { FC, MouseEvent, ReactNode, useCallback, useMemo, useState } from 'react';

import { IconButton, MenuItem, Popover, Tooltip } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';

interface IMenuProps {
  tooltip: string;
  icon?: ReactNode;
  className?: string;
  options: ReactNode[];
}

export const Menu: FC<IMenuProps> = ({ tooltip, icon, className, options }) => {
  const [popoverEl, setPopoverEl] = useState<null | HTMLElement>(null);

  const openMenu = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setPopoverEl(event.currentTarget);
  }, []);

  const closeMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setPopoverEl(null);
  }, []);

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
        onClose={closeMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left"
        }}
      >
        {options.map((option, index) => (
          <MenuItem onClick={closeMenu} key={index}>
            {option}
          </MenuItem>
        ))}
      </Popover>
    </>
  );
};
