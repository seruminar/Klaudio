import clsx from 'clsx';
import React, { FC, MutableRefObject, useContext, useEffect } from 'react';
import SunEditor from 'suneditor-react';

import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';

import { EmailContext } from './EmailView';

interface IEmailEditor2Props {
  value: string;
  addHtmlRef: MutableRefObject<((position: number, html: string) => void) | null>;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    editor: {
      flexDirection: "column",
      display: "flex",
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      background: theme.palette.type === "light" ? theme.palette.background.default : grey[700],
      borderRadius: theme.spacing(2),
      "& .sun-editor": {
        minHeight: 0,
        padding: theme.spacing(1),
        borderRadius: theme.spacing(2),
        width: "100%",
        border: "none",
        backgroundColor: theme.palette.type === "light" ? theme.palette.background.default : grey[700],
        "& .se-toolbar": { outline: "initial" },
        "& .se-btn-module-border": { border: "initial" },
        "& .se-container": {
          display: "flex",
          flexDirection: "column",
          "& .se-wrapper": {
            flex: 1,
            overflow: "initial",
            minHeight: 0,
            "& .se-wrapper-inner": {
              height: "100% !important",
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.type === "light" ? theme.palette.background.default : grey[700]
            }
          }
        }
      }
    },
    editorModeView: { "& .sun-editor": { "& .se-resizing-bar": { display: "none" } } },
    editorModeEdit: {
      border: `1px solid ${theme.palette.action.selected}`,
      transition: theme.transitions.create(["border", "box-shadow"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter
      }),
      "&:hover": {
        boxShadow: `0 1px ${theme.spacing(1)}px ${theme.spacing(1)}px ${theme.palette.action.hover}, 0 2px 6px 2px ${
          theme.palette.action.hover
        }`,
        border: "1px solid transparent"
      }
    }
  })
);

export const EmailEditor: FC<IEmailEditor2Props> = ({ value, addHtmlRef }) => {
  const styles = useStyles();

  const { mode } = useContext(EmailContext);

  useEffect(() => {
    if (addHtmlRef) {
      addHtmlRef.current = (position, html) => {
        // if (editorRef.current) {
        //   editorRef.current.getEditor().clipboard.dangerouslyPasteHTML(position, html, "api");
        //   editorRef.current.getEditor().setSelection(0, 0, "api");
        // }
      };
    }
  }, [addHtmlRef]);

  return (
    <div className={clsx(styles.editor, mode === "edit" ? styles.editorModeEdit : styles.editorModeView)}>
      <SunEditor
        enableToolbar={mode === "edit"}
        showToolbar={mode === "edit"}
        disable={mode !== "edit"}
        setContents={value}
        setOptions={{
          buttonList: [
            ["undo", "redo"],
            ["font", "fontSize", "formatBlock"],
            ["bold", "underline", "italic", "strike", "subscript", "superscript", "link"],
            ["blockquote", "list", "outdent", "indent"],
            ["fontColor", "hiliteColor"],
            ["horizontalRule", "table"],
            ["template", "fullScreen", "codeView", "removeFormat"]
          ]
        }}
      />
    </div>
  );
};
