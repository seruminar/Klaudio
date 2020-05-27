import './app.scss';

import React, { createContext, lazy, Suspense, useMemo } from 'react';
import { boundary, useError } from 'react-boundary';
import { Helmet } from 'react-helmet';

import {
    createMuiTheme,
    createStyles,
    CssBaseline,
    makeStyles,
    PaletteType,
    ThemeProvider
} from '@material-ui/core';
import { navigate, Router } from '@reach/router';
import useLocalStorage from '@rehooks/local-storage';

import { errors, header } from '../terms.en-us.json';
import { LocalStorageKeys } from './frontend/LocalStorageKeys';
import { routes } from './routes';
import { Loading } from './shared/Loading';

const Frontend = lazy(() => import("./frontend/Frontend").then((module) => ({ default: module.Frontend })));
const Error = lazy(() => import("./shared/Error").then((module) => ({ default: module.Error })));

const useStyles = makeStyles((theme) =>
  createStyles({
    router: {
      "& *::-webkit-scrollbar": {
        width: theme.spacing(1),
        height: theme.spacing(1),
      },
      "& *::-webkit-scrollbar-track": {
        "-webkit-box-shadow": `inset 0 0 ${theme.spacing(1)}px rgba(0,0,0,0.00)`,
      },
      "& *::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(0,0,0,.1)",
        borderRadius: theme.spacing(0.5),
        outline: `${theme.spacing(0.125)}px solid slategrey`,
      },
    },
  })
);

interface IThemeContext {
  theme: PaletteType;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<IThemeContext>({ theme: "light", toggleTheme: () => {} });

export const App = boundary(() => {
  const styles = useStyles();

  const [error, info] = useError();

  const [theme, setTheme] = useLocalStorage<PaletteType>(LocalStorageKeys.Theme, "light");

  let hasError = error || info ? true : false;

  const appTheme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: theme,
          primary: {
            main: "#388e3c",
          },
          secondary: {
            main: "#9ccc65",
          },
          text: {
            primary: theme === "light" ? "rgba(0, 0, 0, 0.87)" : "rgba(255, 255, 255, 0.87)",
          },
        },
      }),
    [theme]
  );

  const themeContext = { theme, toggleTheme: () => (theme === "light" ? setTheme("dark") : setTheme("light")) };

  (async () => {
    const anchor = window.location.hash.substr(1);

    if (anchor.startsWith("id=")) {
      const [, simpleCrmEmailId] = anchor.split("=");

      if (simpleCrmEmailId) {
        await navigate(`${routes.base}${routes.byId}/${simpleCrmEmailId}`);
      }
    } else {
      const [simpleCrmTicketNumber, simpleCrmEmailId] = anchor.split("|");

      if (simpleCrmTicketNumber && simpleCrmEmailId) {
        await navigate(`${routes.base}${routes.tickets}/${simpleCrmTicketNumber}/${simpleCrmEmailId}`);
      } else if (simpleCrmTicketNumber) {
        await navigate(`${routes.base}${routes.tickets}/${simpleCrmTicketNumber}`);
      }
    }
  })();

  return (
    <ThemeContext.Provider value={themeContext}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Helmet titleTemplate={`%s | ${header.header}`} defaultTitle={header.header}>
          <meta name="description" content={header.description} />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {process.env.NODE_ENV !== "development" && <link rel="shortcut icon" href={chrome.runtime.getURL("favicon.ico")} />}
          <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
        </Helmet>
        <Suspense fallback={<Loading />}>
          {hasError && <Error stack={`${error && error.stack}${info && info.componentStack}`} />}
          {!hasError && (
            <Router basepath={routes.base} className={styles.router}>
              <Frontend path="*" />
              <Error path={routes.error} default message={errors.notFound} />
            </Router>
          )}
        </Suspense>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
});
