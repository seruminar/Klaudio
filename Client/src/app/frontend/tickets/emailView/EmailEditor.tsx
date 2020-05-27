import clsx from 'clsx';
import DOMPurify from 'dompurify';
import React, { FC, useContext, useEffect, useMemo, useState } from 'react';
import Squire from 'squire-rte/build/squire.js';

import {
    ButtonBase,
    createStyles,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    makeStyles
} from '@material-ui/core';
import { blue, grey, lightGreen, orange, red, teal, yellow } from '@material-ui/core/colors';
import {
    Clear,
    Code,
    FormatBold,
    FormatClear,
    FormatColorFill,
    FormatIndentDecrease,
    FormatIndentIncrease,
    FormatItalic,
    FormatListBulleted,
    FormatListNumbered,
    FormatPaint,
    FormatQuote,
    FormatStrikethrough,
    FormatUnderlined,
    InsertLink,
    Link,
    PostAdd,
    Redo,
    Undo
} from '@material-ui/icons';

import { ICrmService } from '../../../../services/crmService/CrmService';
import { useDependency } from '../../../../services/dependencyContainer';
import { editor as editorTerms, email as emailTerms } from '../../../../terms.en-us.json';
import { useSubscription, useSubscriptionEffect } from '../../../../utilities/observables';
import { Loading } from '../../../shared/Loading';
import { MultilineInput } from '../../../shared/MultilineInput';
import { EmailEditorButton } from './EmailEditorButton';
import { EmailEditorMenu } from './EmailEditorMenu';
import { EmailContext } from './EmailView';

interface IEmailEditorProps {
  value: string;
}

const useStyles = makeStyles((theme) =>
  createStyles({
    editor: {
      flexDirection: "column",
      display: "flex",
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      background: theme.palette.type === "light" ? theme.palette.background.default : grey[700],
      borderRadius: theme.spacing(2),
    },
    toolbar: { margin: theme.spacing(0, 2), width: "initial" },
    customButton: { fontWeight: 700, fontSize: theme.spacing(2.5) },
    customIcon: { display: "initial" },
    divider: { margin: theme.spacing(0, 2) },
    colorMenu: { maxWidth: theme.spacing(20) },
    color: {
      width: theme.spacing(4),
      height: theme.spacing(4),
      minWidth: "initial",
      padding: 0,
      margin: theme.spacing(0.5),
    },
    cannedResponsesList: {
      maxHeight: theme.spacing(40),
      overflowY: "scroll",
    },
    spacer: {
      flex: 1,
    },
    editorArea: {
      flex: 1,
      margin: theme.spacing(2),
      minHeight: 0,
      overflowY: "scroll",
      outline: "none",
    },
    editorModeView: {},
    editorModeEdit: {
      border: `1px solid ${theme.palette.action.selected}`,
      transition: theme.transitions.create(["border", "box-shadow"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter,
      }),
      "&:hover": {
        boxShadow: `0 1px ${theme.spacing(1)}px ${theme.spacing(1)}px ${theme.palette.action.hover}, 0 2px 6px 2px ${
          theme.palette.action.hover
        }`,
        border: "1px solid transparent",
      },
    },
  })
);

const editorRootId = "emailEditor";

export const EmailEditor: FC<IEmailEditorProps> = ({ value }) => {
  const styles = useStyles();

  const [editor, setEditor] = useState<Squire>();
  const [, setRerender] = useState(false);
  const [cannedResponseId, setCannedResponseId] = useState<Guid>();

  const { mode, setMode, ticket, email } = useContext(EmailContext);

  const crmService = useDependency(ICrmService);

  const currentUser = useSubscriptionEffect(() => {
    if (mode === "newReply") {
      return crmService.currentUser().getObservable();
    }
  }, [mode]);

  const signature = useSubscriptionEffect(() => {
    if (currentUser?.UserId) {
      return crmService.users().id(currentUser.UserId).select("dyn_signature").getObservable();
    }
  }, [currentUser])?.dyn_signature;

  const cannedResponses = useSubscription(
    crmService.cannedResponses().select("title", "templateid").filter("startswith(title,'Support -')").orderBy("title asc").getObservable()
  );

  const cannedResponse = useSubscriptionEffect(() => {
    if (cannedResponseId) {
      return crmService.cannedResponses().id(cannedResponseId).select("presentationxml").getObservable();
    }
  }, [cannedResponseId]);

  const amUser = useSubscriptionEffect(() => {
    if (ticket?.customerid_account?._dyn_accountmanagerid_value) {
      return crmService.users().id(ticket.customerid_account._dyn_accountmanagerid_value).select("fullname", "domainname").getObservable();
    }
  }, [ticket]);

  useEffect(() => {
    if (!editor) {
      const editorRoot = document.getElementById(editorRootId);

      if (editorRoot) {
        const editor = new Squire(editorRoot, {
          sanitizeToDOMFragment: (html, _, self) => {
            const frag = DOMPurify.sanitize(html, {
              ALLOW_UNKNOWN_PROTOCOLS: true,
              WHOLE_DOCUMENT: false,
              RETURN_DOM: true,
              RETURN_DOM_FRAGMENT: true,
            });

            return self.getDocument().importNode(frag, true);
          },
        });

        editor.setHTML(value);

        editor.addEventListener("pathChange", () => setRerender((rerender) => !rerender));
        editor.addEventListener("input", () => setRerender((rerender) => !rerender));

        setEditor(editor);
      }
    }
  }, [editor, value, mode]);

  useEffect(() => {
    if (editor) {
      switch (mode) {
        case "view":
        case "viewDraft":
          editor.getRoot().contentEditable = "false";
          break;
        default:
          editor.getRoot().contentEditable = "true";
          break;
      }
    }
  }, [editor, mode]);

  useEffect(() => {
    if (editor && signature && mode === "newReply") {
      setMode("edit");

      editor.moveCursorToStart();
      editor.insertHTML(`${signature.replace("\n", "")}${emailTerms.signatureDivider}`);
      editor.moveCursorToStart();
      editor.focus();
    }
  }, [editor, signature, mode, setMode]);

  useEffect(() => {
    if (editor && cannedResponse && cannedResponse.templateid === cannedResponseId && mode === "editLoading" && ticket && email && amUser) {
      const matchedContent = cannedResponse.presentationxml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
      let cannedResponseContent = matchedContent && matchedContent[1];

      if (cannedResponseContent) {
        if (email?.trackingtoken) {
          cannedResponseContent = cannedResponseContent.replace("{% ticket number %}", email.trackingtoken.split(":")[1]);
        }

        if (ticket?.customerid_account?.name) {
          cannedResponseContent = cannedResponseContent.replace(
            "<entity>account</entity><attribute>name</attribute>",
            ticket.customerid_account.name
          );
        }

        if (amUser?.fullname) {
          cannedResponseContent = cannedResponseContent.replace(
            "<entity>account</entity><attribute>dyn_accountmanagerid/@name</attribute>",
            amUser.fullname
          );
        }

        if (amUser?.domainname) {
          cannedResponseContent = cannedResponseContent.replace("{% account manager email %}", amUser.domainname);
          cannedResponseContent = cannedResponseContent.replace("&lt;email of account manager&gt;", amUser.domainname);
        }

        editor.insertHTML(cannedResponseContent + "<p></p>");
      }

      setCannedResponseId(undefined);
      setMode("edit");
      editor.focus();
    }
  }, [editor, cannedResponseId, cannedResponse, mode, setMode, ticket, email, amUser]);

  const colors = useMemo(() => [blue[500], teal[500], lightGreen[500], yellow[600], orange[800], red[500], "black"], []);

  const path = editor?.getPath();
  console.log(path);

  return (
    <div className={clsx(styles.editor, mode === "edit" || mode === "editLoading" ? styles.editorModeEdit : styles.editorModeView)}>
      {editor && path && (mode === "edit" || mode === "editLoading") && (
        <>
          <Grid container alignItems="center" className={styles.toolbar}>
            <EmailEditorButton icon={<Undo />} tooltip={editorTerms.undo} set={() => editor.undo()} />
            <EmailEditorButton icon={<Redo />} tooltip={editorTerms.redo} set={() => editor.redo()} />
            <EmailEditorButton icon={<Divider orientation="vertical" flexItem />} />
            <EmailEditorButton
              icon={<Code />}
              tooltip={editorTerms.code}
              set={() => editor.code()}
              unset={() => editor.removeCode()}
              active={/PRE|>CODE\b/.test(path)}
            />
            <EmailEditorButton
              icon={<FormatBold />}
              tooltip={editorTerms.bold}
              set={() => editor.bold()}
              unset={() => editor.removeBold()}
              active={/>B\b/.test(path)}
            />
            <EmailEditorButton
              icon={<FormatItalic />}
              tooltip={editorTerms.italic}
              set={() => editor.italic()}
              unset={() => editor.removeItalic()}
              active={/>I\b/.test(path)}
            />
            <EmailEditorMenu
              icon={<Link />}
              tooltip={editorTerms.link}
              set={(closeMenu) => (
                <MultilineInput
                  placeholder={editorTerms.link}
                  action={(link: string) => {
                    editor.makeLink(link);
                    closeMenu();
                  }}
                  actionButton={<InsertLink />}
                />
              )}
              unset={() => editor.removeLink()}
              active={/>A\b/.test(path)}
            />
            <EmailEditorButton
              icon={<FormatUnderlined />}
              tooltip={editorTerms.underline}
              set={() => editor.underline()}
              unset={() => editor.removeUnderline()}
              active={/U\b/.test(path)}
            />
            <EmailEditorButton
              icon={<FormatStrikethrough />}
              tooltip={editorTerms.strikethrough}
              set={() => editor.strikethrough()}
              unset={() => editor.removeStrikethrough()}
              active={/S\b/.test(path)}
            />
            <EmailEditorButton
              className={styles.customButton}
              icon={
                <span className={styles.customIcon}>
                  A<sup>S</sup>
                </span>
              }
              tooltip={editorTerms.superscript}
              set={() => editor.superscript()}
              unset={() => editor.removeSuperscript()}
              active={/SUP\b/.test(path)}
            />
            <EmailEditorButton
              className={styles.customButton}
              icon={
                <span className={styles.customIcon}>
                  A<sub>S</sub>
                </span>
              }
              tooltip={editorTerms.subscript}
              set={() => editor.subscript()}
              unset={() => editor.removeSubscript()}
              active={/SUB\b/.test(path)}
            />
            <EmailEditorButton icon={<Divider orientation="vertical" flexItem />} />
            <EmailEditorButton
              icon={<FormatListNumbered />}
              tooltip={editorTerms.orderedList}
              set={() => editor.makeOrderedList()}
              unset={() => editor.removeList()}
              active={/>OL(?!>UL)\b/.test(path)}
            />
            <EmailEditorButton
              icon={<FormatListBulleted />}
              tooltip={editorTerms.unorderedList}
              set={() => editor.makeUnorderedList()}
              unset={() => editor.removeList()}
              active={/>UL(?!>OL)\b/.test(path)}
            />
            <EmailEditorButton
              icon={<FormatIndentIncrease />}
              tooltip={editorTerms.increaseIndent}
              set={() => editor.increaseListLevel()}
            />
            <EmailEditorButton
              icon={<FormatIndentDecrease />}
              tooltip={editorTerms.decreaseIndent}
              set={() => editor.decreaseListLevel()}
            />
            <EmailEditorButton
              icon={<FormatQuote />}
              tooltip={editorTerms.quote}
              set={() => editor.increaseQuoteLevel()}
              unset={() => editor.decreaseQuoteLevel()}
              active={/BLOCKQUOTE\b/.test(path)}
            />
            <EmailEditorButton icon={<Divider orientation="vertical" flexItem />} />
            <EmailEditorMenu
              icon={<FormatPaint />}
              tooltip={editorTerms.fontColor}
              set={(closeMenu) => (
                <Grid container className={styles.colorMenu}>
                  {colors.map((color) => (
                    <Grid item key={color}>
                      <ButtonBase
                        onClick={() => {
                          editor.setTextColour(color);
                          editor.focus();
                          closeMenu();
                        }}
                        classes={{ root: styles.color }}
                        style={{ backgroundColor: color }}
                      />
                    </Grid>
                  ))}
                  <Grid item>
                    <IconButton
                      classes={{ root: styles.color }}
                      onClick={() => {
                        editor.changeFormat(
                          null,
                          {
                            tag: "SPAN",
                            attributes: { class: editor._config.classNames.colour },
                          },
                          editor.getSelection(),
                          true
                        );
                        editor.focus();
                        closeMenu();
                      }}
                    >
                      <Clear />
                    </IconButton>
                  </Grid>
                </Grid>
              )}
            />
            <EmailEditorMenu
              icon={<FormatColorFill />}
              tooltip={editorTerms.backgroundColor}
              set={(closeMenu) => (
                <Grid container className={styles.colorMenu}>
                  {colors.map((color) => (
                    <Grid item key={color}>
                      <ButtonBase
                        onClick={() => {
                          editor.setHighlightColour(color);
                          editor.focus();
                          closeMenu();
                        }}
                        classes={{ root: styles.color }}
                        style={{ backgroundColor: color }}
                      />
                    </Grid>
                  ))}
                  <Grid item>
                    <IconButton
                      classes={{ root: styles.color }}
                      onClick={() => {
                        editor.changeFormat(
                          null,
                          {
                            tag: "SPAN",
                            attributes: { class: editor._config.classNames.highlight },
                          },
                          editor.getSelection(),
                          true
                        );
                        editor.focus();
                        closeMenu();
                      }}
                    >
                      <Clear />
                    </IconButton>
                  </Grid>
                </Grid>
              )}
            />
            <EmailEditorButton icon={<Divider orientation="vertical" flexItem />} />
            <EmailEditorMenu
              icon={cannedResponses ? <PostAdd /> : <Loading small />}
              tooltip={editorTerms.cannedResponse}
              set={(closeMenu) =>
                cannedResponses && (
                  <List dense className={styles.cannedResponsesList}>
                    {cannedResponses.map((cannedResponse) => (
                      <ListItem
                        button
                        key={cannedResponse.templateid}
                        onClick={() => {
                          setCannedResponseId(cannedResponse.templateid);
                          setMode("editLoading");
                          closeMenu();
                        }}
                      >
                        <ListItemText primary={cannedResponse.title.replace("Support - ", "")} />
                      </ListItem>
                    ))}
                  </List>
                )
              }
            />
            <div className={styles.spacer} />
            <EmailEditorButton icon={<FormatClear />} tooltip={editorTerms.clearFormat} set={() => editor.removeAllFormatting()} />
          </Grid>
          <Divider className={styles.divider} />
        </>
      )}
      <div id={editorRootId} className={styles.editorArea} />
    </div>
  );
};
