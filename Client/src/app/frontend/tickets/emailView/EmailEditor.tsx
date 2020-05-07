import clsx from 'clsx';
import React, { FC, useContext, useEffect, useState } from 'react';
import suneditor from 'suneditor';
import SunEditor from 'suneditor/src/lib/core';
import { ButtonListDefaults } from 'suneditor/src/options';
import {
    blockquote,
    font,
    fontColor,
    fontSize,
    formatBlock,
    hiliteColor,
    horizontalRule,
    link,
    list,
    table,
    template
} from 'suneditor/src/plugins/';

import { createStyles, makeStyles, Theme } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';

import { ICrmService } from '../../../../services/crmService/CrmService';
import { useDependency } from '../../../../services/dependencyContainer';
import { email as emailTerms } from '../../../../terms.en-us.json';
import { useSubscriptionEffect } from '../../../../utilities/observables';
import { EmailContext } from './EmailView';

interface IEmailEditor2Props {
  value: string;
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
        width: "100% !important",
        height: "100%",
        border: "none",
        backgroundColor: theme.palette.type === "light" ? theme.palette.background.default : grey[700],
        "& .se-toolbar": { outline: "initial" },
        "& .se-btn-module-border": { border: "initial" },
        "& .se-container": {
          display: "flex",
          flexDirection: "column",
          "& .se-line-breaker": {
            display: "none !important"
          },
          "& .se-wrapper": {
            flex: 1,
            overflow: "initial",
            minHeight: 0,
            "& .se-wrapper-inner": {
              height: "100% !important",
              wordBreak: "initial",
              wordWrap: "initial",
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.type === "light" ? theme.palette.background.default : grey[700],
              "& img": { maxWidth: "100%" },
              "& table": {
                border: "initial",
                width: "initial",
                maxWidth: "initial",
                margin: "initial",
                backgroundColor: "initial",
                "& tr": {
                  border: "initial"
                },
                "& td": {
                  border: "initial",
                  padding: "initial"
                },
                "& th": {
                  border: "initial",
                  padding: "initial"
                }
              }
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

const editorId = "sunEditor";

export const EmailEditor: FC<IEmailEditor2Props> = ({ value }) => {
  const styles = useStyles();

  const [editor, setEditor] = useState<SunEditor>();

  const { mode, setMode } = useContext(EmailContext);

  const crmService = useDependency(ICrmService);

  const currentUser = useSubscriptionEffect(() => {
    if (mode === "newReply") {
      return crmService.currentUser().getObservable();
    }
  }, [mode]);

  const signature = useSubscriptionEffect(() => {
    if (currentUser?.UserId) {
      return crmService
        .users()
        .id(currentUser.UserId)
        .select("dyn_signature")
        .getObservable();
    }
  }, [currentUser])?.dyn_signature;

  useEffect(() => {
    if (editor && signature && mode === "newReply") {
      editor.setContents(`${signature.replace("\n", "")}${emailTerms.signatureDivider}` + editor.getContents(true));

      setMode("edit");
    }
  }, [editor, signature, mode, setMode]);

  useEffect(() => {
    if (!editor) {
      const editor = suneditor.create(document.getElementById(editorId) || editorId, {
        plugins: [font, fontSize, formatBlock, link, blockquote, list, fontColor, hiliteColor, horizontalRule, table, template],
        buttonList: [
          ["undo", "redo"],
          ["font", "fontSize", "formatBlock"],
          ["bold", "underline", "italic", "strike", "subscript", "superscript", "link"],
          ["blockquote" as ButtonListDefaults, "list", "outdent", "indent"],
          ["fontColor", "hiliteColor"],
          ["horizontalRule", "table"],
          ["template", "fullScreen", "codeView", "removeFormat"]
        ]
      });

      mode === "edit" ? editor.enabled() : editor.disabled();
      mode === "edit" ? editor.toolbar.show() : editor.toolbar.hide();

      setEditor(editor);
    }
  }, [editor, mode]);

  useEffect(() => {
    if (editor) {
      mode === "edit" ? editor.enabled() : editor.disabled();
      mode === "edit" ? editor.toolbar.show() : editor.toolbar.hide();
    }
  }, [editor, mode]);

  useEffect(() => {
    if (editor) {
      editor.setContents(value);
    }
  }, [editor, value]);

  return (
    <div className={clsx(styles.editor, mode === "edit" ? styles.editorModeEdit : styles.editorModeView)}>
      <textarea id={editorId} />
    </div>
  );
};
