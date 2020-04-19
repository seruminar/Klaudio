import clsx from 'clsx';
import React, { FC, MutableRefObject, useContext, useEffect, useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';

import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { blue, grey } from '@material-ui/core/colors';

import { EmailContext } from './EmailView';

Quill.register(Quill.import("attributors/style/background"), true);
Quill.register(Quill.import("attributors/style/color"), true);
Quill.register(Quill.import("attributors/style/font"), true);

interface IEmailEditorProps {
  value: string;
  setValue: (content: string) => void;
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
      "& .ql-container": {
        minHeight: 0,
        padding: theme.spacing(1),
        width: "100%",
        border: "none !important",
        "& .ql-editor": {
          overflowX: "hidden",
          padding: theme.spacing(0, 1),
          "& p": {
            marginBottom: theme.spacing(0.5)
          },
          "& pre.ql-syntax": {
            backgroundColor: theme.palette.action.selected,
            color: theme.palette.text.primary
          }
        }
      },
      "& .ql-snow": {
        "& a": {
          color: theme.palette.type === "light" ? blue[500] : blue[200]
        },
        "&.ql-toolbar": {
          "& .ql-picker": {
            color: theme.palette.type === "light" ? grey[500] : grey[200]
          },
          "& .ql-stroke, .ql-fill, .ql-stroke.ql-fill": {
            stroke: theme.palette.type === "light" ? grey[500] : grey[200]
          },
          "& .ql-picker-label:hover": {
            color: theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.light
          },
          "& button:hover, button.ql-active, .ql-picker-label:hover, .ql-picker-label.ql-active, .ql-picker-item:hover, .ql-picker-item.ql-selected": {
            "& .ql-stroke": {
              stroke: theme.palette.type === "light" ? theme.palette.primary.main : theme.palette.primary.light
            }
          }
        }
      }
    },
    editorModeView: {
      "& .ql-disabled .ql-editor > *": {
        cursor: "default"
      }
    },
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
      },
      "& .ql-toolbar.ql-snow": {
        border: "none",
        borderBottom: `1px solid ${theme.palette.divider}`
      }
    }
  })
);

export const EmailEditor: FC<IEmailEditorProps> = ({ value, setValue, addHtmlRef }) => {
  const styles = useStyles();

  const editorRef = useRef<ReactQuill | null>(null);

  const { mode } = useContext(EmailContext);

  useEffect(() => {
    if (addHtmlRef) {
      addHtmlRef.current = (position, html) => {
        if (editorRef.current) {
          editorRef.current.getEditor().clipboard.dangerouslyPasteHTML(position, html, "api");
          editorRef.current.getEditor().setSelection(0, 0, "api");
        }
      };
    }
  }, [addHtmlRef]);

  const modules = {
    toolbar: [
      [{ font: [] }],
      ["bold", "italic", "underline", "strike", "blockquote", "code"],
      ["link"],
      [{ color: [] }, { background: [] }],
      ["code-block", { list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      ["clean"]
    ]
  };

  return (
    <ReactQuill
      ref={editorRef}
      readOnly={mode !== "edit"}
      theme="snow"
      className={clsx(styles.editor, mode === "edit" ? styles.editorModeEdit : styles.editorModeView)}
      value={value}
      onChange={setValue}
      modules={mode === "edit" ? modules : { toolbar: false }}
    />
  );
};
