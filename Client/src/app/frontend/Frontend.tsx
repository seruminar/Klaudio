import clsx from 'clsx';
import React, { lazy, Suspense, useContext, useMemo, useRef, useState } from 'react';

import {
    Box,
    createStyles,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    makeStyles,
    Theme,
    Tooltip
} from '@material-ui/core';
import { Brightness6, ChevronLeft, Mail, Menu } from '@material-ui/icons';
import { Link, Redirect, Router, useMatch } from '@reach/router';

import { experience } from '../../appSettings.json';
import { errors, header } from '../../terms.en-us.json';
import { deleteFrom } from '../../utilities/arrays';
import { wait } from '../../utilities/promises';
import { RoutedFC } from '../../utilities/routing';
import { ThemeContext } from '../App';
import { routes } from '../routes';
import { Loading } from '../shared/Loading';
import {
    IMessageContext,
    MessageContext,
    ShowErrorHandler,
    ShowInfoHandler,
    ShowInfoUntilHandler
} from './header/MessageContext';
import { Snack } from './header/Snack';
import { ISnack, showSnack } from './header/snacks';

const Tickets = lazy(() => import("./tickets/Tickets").then(module => ({ default: module.Tickets })));
const Error = lazy(() => import("../shared/Error").then(module => ({ default: module.Error })));

const sidebarWidth = 150;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      height: "100%"
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      })
    },
    appBarShift: {
      marginLeft: sidebarWidth,
      width: `calc(100% - ${sidebarWidth}px)`,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    menuButton: {
      marginRight: 24,
      marginLeft: -20
    },
    hide: {
      display: "none"
    },
    drawer: {
      width: sidebarWidth,
      flexShrink: 0,
      whiteSpace: "nowrap"
    },
    drawerOpen: {
      width: sidebarWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      overflowX: "hidden",
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(6.5)
      }
    },
    fill: {
      flex: 1
    },
    menuItem: { padding: theme.spacing(1.75) },
    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end"
    },
    content: {
      display: "flex",
      minWidth: 0,
      flexDirection: "column",
      flex: 1
    },
    router: {
      display: "flex",
      minHeight: 0,
      flex: 1
    }
  })
);

export const Frontend: RoutedFC = () => {
  const { snackTimeout } = experience;

  const showSuccess: ShowInfoHandler = (text, timeout) => showInfo(text, timeout, "success");

  const showInfo: ShowInfoHandler = (text, timeout, type = "info") => {
    showSnack(
      text,
      type,
      snack => setSnacks(snacks => [...snacks, snack]),
      wait(timeout || snackTimeout),
      snack => setSnacks(snacks => deleteFrom(snack, snacks))
    );
  };

  const showInfoUntil: ShowInfoUntilHandler = (text, isComplete, update?) => {
    showSnack(
      text,
      "update",
      snack => setSnacks(snacks => [...snacks, snack]),
      isComplete.then(() => wait(snackTimeout)),
      snack => setSnacks(snacks => deleteFrom(snack, snacks)),
      update
    );
  };

  const showWarning: ShowErrorHandler = (error, timeout) => {
    console.warn(error);

    const text = (error.body && error.body.message) || error.message;

    showInfo(text, timeout, "warning");
  };

  const showError: ShowErrorHandler = (error, timeout) => {
    console.error(error);

    const text = (error.body && error.body.message) || error.message;

    showInfo(text, timeout, "error");
  };

  const [snacks, setSnacks] = useState<ISnack[]>([]);

  const headerContext = useRef<IMessageContext>({
    showSuccess,
    showInfo,
    showInfoUntil,
    showWarning,
    showError
  });

  const styles = useStyles();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const context = useMatch(`${routes.base}/:route/*`);

  const themeContext = useContext(ThemeContext);

  const getThemeModeLabel = useMemo(() => (themeContext.theme === "light" ? header.darkMode : header.lightMode), [themeContext]);

  return (
    <MessageContext.Provider value={headerContext.current}>
      <div className={styles.root}>
        <div className="snack bar">
          {snacks.map(snack => (
            <Snack {...snack} />
          ))}
        </div>
        <Drawer
          variant="permanent"
          className={clsx(styles.drawer, drawerOpen ? styles.drawerOpen : styles.drawerClose)}
          classes={{
            paper: drawerOpen ? styles.drawerOpen : styles.drawerClose
          }}
        >
          <div className={styles.toolbar}>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>{drawerOpen ? <ChevronLeft /> : <Menu />}</IconButton>
          </div>
          <Divider />
          <List>
            <ListItem button className={styles.menuItem} selected={context !== null && `/${context.route}` === routes.tickets}>
              <ListItemIcon>
                <Link to={`${routes.base}${routes.tickets}`}>
                  <Mail color="action" />
                </Link>
              </ListItemIcon>
              <ListItemText primary={header.routes.tickets} />
            </ListItem>
          </List>
          <Divider />
          <div className={styles.fill}></div>
          <div className={styles.toolbar}>
            <Tooltip placement="right" title={getThemeModeLabel} aria-label={getThemeModeLabel}>
              <IconButton onClick={themeContext.toggleTheme} aria-label={getThemeModeLabel}>
                <Brightness6 />
              </IconButton>
            </Tooltip>
          </div>
        </Drawer>
        <Box className={styles.content}>
          <Suspense fallback={<Loading />}>
            <Router className={styles.router}>
              <Redirect from="/" to={`${routes.base}${routes.tickets}`} noThrow />
              <Tickets path={`${routes.tickets}/*`} />
              <Error path={routes.error} default message={errors.notFound} />
            </Router>
          </Suspense>
        </Box>
      </div>
    </MessageContext.Provider>
  );
};
