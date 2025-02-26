import React, { useCallback, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot } from "lexical";

import { LinkNode, AutoLinkNode } from "@lexical/link";
import { QuoteNode } from "@lexical/rich-text";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ListItemNode, ListNode } from "@lexical/list";

import Toolbar from "./Toolbar";
import "./RichTextEditor.css";

const editorConfig = {
  theme: {}, 
  onError(error) {
    console.error("Editor Error:", error);
  },
  nodes: [LinkNode, AutoLinkNode, QuoteNode, ListNode, ListItemNode],
};

const RichTextEditor = ({ onContentChange }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleChange = useCallback((editorState) => {
    editorState.read(() => {
      const textContent = $getRoot().getTextContent();
      onContentChange(textContent);
    });
  }, [onContentChange]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className={`editor-container ${isFullscreen ? "fullscreen" : ""}`}>
        <Toolbar toggleFullscreen={() => setIsFullscreen(!isFullscreen)} />
        <div className="editor-wrapper">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder">Start writing...</div>}
          />
          <ListPlugin />
          <HistoryPlugin />
          <OnChangePlugin onChange={handleChange} />
        </div>
      </div>
    </LexicalComposer>
  );
};

export default RichTextEditor;
