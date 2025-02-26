import React, { useCallback, useEffect, useState } from "react";
import { $getSelection, $isRangeSelection, $createTextNode } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $createQuoteNode } from "@lexical/rich-text";
import { FaBold, FaItalic, FaUnderline, FaLink, FaQuoteLeft, FaQuoteRight, FaListUl, FaListOl } from "react-icons/fa";
import "./Toolbar.css";

const Toolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
      }
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(updateToolbar);
    });
  }, [editor, updateToolbar]);

  const insertLink = () => {
    if (linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
      setLinkUrl("");
    }
  };

  const insertQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const textNode = selection.extract();
        const quoteNode = $createQuoteNode();
        quoteNode.append(...textNode);
        selection.insertNodes([quoteNode]);
      }
    });
  };

  const wrapSelectionWithQuotes = (quoteType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const textNodes = selection.extract();
        const wrappedNodes = [$createTextNode(quoteType), ...textNodes, $createTextNode(quoteType)];
        selection.insertNodes(wrappedNodes);
      }
    });
  };

  return (
    <div className="toolbar">
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} className={isBold ? "active" : ""}>
        <FaBold />
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} className={isItalic ? "active" : ""}>
        <FaItalic />
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} className={isUnderline ? "active" : ""}>
        <FaUnderline />
      </button>
      <input
        type="text"
        className="link-input"
        placeholder="Enter URL..."
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        onBlur={insertLink}
      />
      <button type="button" onClick={insertLink}>
        <FaLink />
      </button>
      <button type="button" onClick={insertQuote}>
        <FaQuoteLeft />
      </button>
      <button type="button" onClick={() => wrapSelectionWithQuotes(`"`)}> {/* Double Quotes */}
        <FaQuoteRight />
      </button>
      <button type="button" onClick={() => wrapSelectionWithQuotes(`'`)}> {/* Single Quotes */}
        <FaQuoteLeft />
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>
        <FaListUl />
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>
        <FaListOl />
      </button>
    </div>
  );
};

export default Toolbar;
