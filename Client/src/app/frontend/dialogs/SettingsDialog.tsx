import React, { Dispatch, FC, SetStateAction, useContext, useMemo } from 'react';

import {
    Box,
    createStyles,
    Dialog,
    Grid,
    IconButton,
    makeStyles,
    Slider,
    Tooltip,
    Typography
} from '@material-ui/core';
import { Brightness6, FormatSize } from '@material-ui/icons';

import { experience } from '../../../appSettings.json';
import { header, settings } from '../../../terms.en-us.json';
import { ThemeContext } from '../../App';

interface ISettingsDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onClose: (event: {}, reason: "backdropClick" | "escapeKeyDown") => void;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    fields: {
      padding: theme.spacing(2),
      width: theme.spacing(60),
    },
    field: {
      width: "100%",
      padding: theme.spacing(0.5, 1),
    },
    icon: {
      padding: 0,
    },
  })
);

export const SettingsDialog: FC<ISettingsDialogProps> = ({ open, onClose }) => {
  const styles = useStyles();

  const { themeColor, toggleThemeColor: toggleTheme, themeSize, setThemeSize } = useContext(ThemeContext);

  const getThemeModeLabel = useMemo(() => (themeColor === "light" ? header.darkMode : header.lightMode), [themeColor]);

  return (
    <Dialog open={open} onClose={onClose}>
      <Grid className={styles.fields} container direction="column">
        <Typography variant="h6">{settings.title}</Typography>
        <Box className={styles.field}>
          <Grid container spacing={2}>
            <Grid item>
              <Tooltip placement="left" title={settings.size} aria-label={settings.size}>
                <FormatSize />
              </Tooltip>
            </Grid>
            <Grid item xs>
              <Slider
                marks
                step={1}
                min={experience.theme.size.min}
                max={experience.theme.size.max}
                valueLabelDisplay="auto"
                value={themeSize}
                onChange={(_event, value) => setThemeSize(value as number)}
              />
            </Grid>
          </Grid>
        </Box>
        <Box className={styles.field}>
          <Grid container>
            <Grid item>
              <Tooltip placement="left" title={getThemeModeLabel} aria-label={getThemeModeLabel}>
                <IconButton className={styles.icon} aria-label={getThemeModeLabel} onClick={toggleTheme}>
                  <Brightness6 />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      </Grid>
    </Dialog>
  );
};
