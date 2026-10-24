import React, { memo, useEffect, useRef } from "react";
import { Node, type Editor, type JSONContent } from "@tiptap/core";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { OrderedList } from "@tiptap/extension-list";
import { TableKit, TableCell, TableHeader } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "../ui/button";
import type { Field, Values } from "./types";
import "./editor.css";

const ContractList = OrderedList.extend({
  addAttributes() {
    const attributes = this.parent?.() || {};
    delete attributes["type"];

    return attributes;
  },
});

const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  parseHTML: () => [{ tag: "div[data-page-break]" }],
  renderHTML: () => [
    "div",
    { "data-page-break": "", class: "agreement-page-break" },
    "Page break",
  ],
});

const Toolbar = ({ editor }: { editor: Editor }) => {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      table: editor.isActive("table"),
      heading: editor.isActive("heading")
        ? String(editor.getAttributes("heading").level)
        : "paragraph",
      align:
        editor.getAttributes("heading").textAlign ||
        editor.getAttributes("paragraph").textAlign ||
        "left",
      undo: editor.can().undo(),
      redo: editor.can().redo(),
    }),
  });

  const button = (
    label: string,
    action: () => void,
    pressed?: boolean,
    disabled = false
  ) => (
    <Button
      key={label}
      size="sm"
      variant="ghost"
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={event => event.preventDefault()}
      onClick={action}
    >
      {label}
    </Button>
  );

  return (
    <div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-lg border-b border-border bg-card p-2"
      role="group"
      aria-label="Contract formatting"
    >
      {button(
        "Undo",
        () => {
          editor.chain().focus().undo().run();
        },
        undefined,
        !state.undo
      )}
      {button(
        "Redo",
        () => {
          editor.chain().focus().redo().run();
        },
        undefined,
        !state.redo
      )}
      <select
        className="agreement-select w-auto"
        aria-label="Paragraph style"
        value={state.heading}
        onChange={event =>
          event.target.value === "paragraph"
            ? editor.chain().focus().setParagraph().run()
            : editor
                .chain()
                .focus()
                .setHeading({ level: Number(event.target.value) as 1 | 2 | 3 })
                .run()
        }
      >
        <option value="paragraph">Paragraph</option>
        {[1, 2, 3].map(level => (
          <option value={level} key={level}>
            Heading {level}
          </option>
        ))}
      </select>
      {button(
        "Bold",
        () => {
          editor.chain().focus().toggleBold().run();
        },
        state.bold
      )}
      {button(
        "Italic",
        () => {
          editor.chain().focus().toggleItalic().run();
        },
        state.italic
      )}
      {button(
        "Underline",
        () => {
          editor.chain().focus().toggleUnderline().run();
        },
        state.underline
      )}
      {button(
        "Strike",
        () => {
          editor.chain().focus().toggleStrike().run();
        },
        state.strike
      )}
      <select
        className="agreement-select w-auto"
        aria-label="Text alignment"
        value={state.align}
        onChange={event =>
          editor.chain().focus().setTextAlign(event.target.value).run()
        }
      >
        {["left", "center", "right", "justify"].map(align => (
          <option key={align}>{align}</option>
        ))}
      </select>
      {button(
        "Bullet list",
        () => {
          editor.chain().focus().toggleBulletList().run();
        },
        state.bullet
      )}
      {button(
        "Numbered list",
        () => {
          editor.chain().focus().toggleOrderedList().run();
        },
        state.ordered
      )}
      {button("Insert table", () => {
        editor
          .chain()
          .focus()
          .insertTable({ rows: 2, cols: 3, withHeaderRow: true })
          .run();
      })}
      {state.table && (
        <>
          {button("Add row", () => {
            editor.chain().focus().addRowAfter().run();
          })}
          {button("Add column", () => {
            editor.chain().focus().addColumnAfter().run();
          })}
          {button("Delete row", () => {
            editor.chain().focus().deleteRow().run();
          })}
          {button("Delete column", () => {
            editor.chain().focus().deleteColumn().run();
          })}
          {button("Merge or split cells", () => {
            editor.chain().focus().mergeOrSplit().run();
          })}
          {button("Delete table", () => {
            editor.chain().focus().deleteTable().run();
          })}
        </>
      )}
      {button("Page break", () => {
        editor.chain().focus().insertContent({ type: "pageBreak" }).run();
      })}
      {button("Horizontal rule", () => {
        editor.chain().focus().setHorizontalRule().run();
      })}
    </div>
  );
};

const DocumentEditor = memo(
  ({
    document: initial,
    fields,
    values,
    onReady,
    onChange,
    onError,
    readOnly = false,
  }: {
    document: JSONContent;
    fields: Field[];
    values: Values;
    onReady?: (editor: Editor) => void;
    onChange?: (document: JSONContent) => void;
    onError?: (message: string) => void;
    readOnly?: boolean;
  }) => {
    const current = useRef({ fields, values, onChange, onError });
    current.current = { fields, values, onChange, onError };
    const fieldViews = useRef(new Set<() => void>());
    const editor = useEditor(
      {
        shouldRerenderOnTransaction: false,
        editable: !readOnly,
        enableContentCheck: true,
        extensions: [
          StarterKit.configure({
            blockquote: false,
            code: false,
            codeBlock: false,
            link: false,
            orderedList: false,
            heading: { levels: [1, 2, 3] },
          }),
          ContractList,
          TableKit.configure({ tableCell: false, tableHeader: false }),
          ...[TableCell, TableHeader].map(cell =>
            cell.extend({
              addAttributes() {
                const attributes = this.parent?.() || {};
                delete attributes["align"];

                return attributes;
              },
            })
          ),
          TextAlign.configure({
            types: ["heading", "paragraph"],
            defaultAlignment: "left",
          }),
          PageBreak,
          Node.create({
            name: "mergeField",
            group: "inline",
            inline: true,
            atom: true,
            addAttributes: () => ({ key: { default: "" } }),
            parseHTML: () => [
              {
                tag: "span[data-merge-field]",
                getAttrs: element => ({
                  key: element.getAttribute("data-merge-field"),
                }),
              },
            ],
            renderHTML: ({ node }) => [
              "span",
              { "data-merge-field": node.attrs.key },
              `{{${node.attrs.key}}}`,
            ],
            addNodeView:
              () =>
              ({ node }) => {
                const dom = window.document.createElement("span");
                dom.className = "agreement-field";
                dom.contentEditable = "false";
                const render = () => {
                  const field = current.current.fields.find(
                    field => field.key === node.attrs.key
                  );
                  const value = current.current.values[node.attrs.key];
                  dom.textContent =
                    value == null || value === ""
                      ? `[${field?.label || node.attrs.key}]`
                      : value === true
                      ? "Yes"
                      : value === false
                      ? "No"
                      : value;
                  dom.dataset.mergeField = node.attrs.key;
                  dom.title = field
                    ? `${field.label} · ${field.role} · ${field.type}`
                    : node.attrs.key;
                };
                render();
                fieldViews.current.add(render);

                return {
                  dom,
                  ignoreMutation: () => true,
                  destroy: () => {
                    fieldViews.current.delete(render);
                  },
                };
              },
          }),
        ],
        content: initial,
        editorProps: {
          attributes: {
            "aria-label": readOnly
              ? "Imported contract preview"
              : "Contract body",
            role: "textbox",
            "aria-multiline": "true",
            class: "agreement-document",
          },
        },
        onCreate: ({ editor }) => onReady?.(editor),
        onUpdate: ({ editor }) => current.current.onChange?.(editor.getJSON()),
        onContentError: ({ error }) =>
          current.current.onError?.(
            `Document could not be loaded safely: ${error.message}`
          ),
      },
      []
    );

    useEffect(() => {
      fieldViews.current.forEach(render => render());
    }, [fields, values]);

    return (
      <div className="min-w-0 rounded-lg border border-border bg-card">
        {editor && !readOnly && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    );
  }
);
DocumentEditor.displayName = "DocumentEditor";
export default DocumentEditor;
