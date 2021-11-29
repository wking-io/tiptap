---
title: LiveView WYSIWYG
tableOfContents: true
---

# Phoenix LiveView

## Introduction
The following guide describes how to integrate Tiptap with your [Phoenix LiveView](https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html) project.

## index.js
```js
import { Editor, generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';



function updateButtonState(buttons, editor) {
  buttons.forEach((btn) => {
      btn.classList.toggle('is-active', editor.isActive(btn.dataset.editorAction));
  });
}

function updateContent(root, editor) {
  const input = root.querySelector('[phx-ref="content"]');
  if (input) input.value = JSON.stringify(editor.getJSON());
}

function setupEditor() {
  let instance;
  let actionListener;

  return {
    mounted() {
      const root = this.el;
      const element = root.querySelector('[phx-ref="element"]');
      const editorActions = root.querySelectorAll('[data-editor-action]');

      if (element) {
        instance = new Editor({
          editorProps: {
            attributes: {
              class: 'prose',
            },
          },
          element,
          extensions: [ StarterKit, Highlight, Underline ],
          content: JSON.parse(root.dataset.content),
          onUpdate({ editor }) {
            updateButtonState(editorActions, editor);
            updateContent(root, editor);
          },
          onSelectionUpdate({ editor }) {
            updateButtonState(editorActions, editor);
          },
        });

        actionListener = window.addEventListener('editor-button:action', (e) => {
          instance.chain()[e.detail.action]().focus().run();
        });
      }
    },
    updated() {
      updateContent(root, instance);
    },
    destroyed() {
      instance.destroy();
      instance = null;
      window.removeEventListener('editor-button:action', actionListener);
    },
  };
}

Hooks.Editor = setupEditor();

let liveSocket = new LiveSocket('/live', Socket, {
  params: { _csrf_token: csrfToken },
  hooks: Hooks,
});
```

## editor.ex

```elixir
defmodule WithoutCeasingWeb.Components.Editor do
  use Phoenix.Component

  alias Phoenix.LiveView.JS

  def editor(assigns) do
    ~H"""
      <div
        id="editor-root"
        phx-hook="Editor"
        data-content={Jason.encode!(@content)}
      >
        <div>
          <.editor_button
            name="Bold"
            action={:bold}
            icon="M8 11h4.5a2.5 2.5 0 1 0 0-5H8v5zm10 4.5a4.5 4.5 0 0 1-4.5 4.5H6V4h6.5a4.5 4.5 0 0 1 3.256 7.606A4.498 4.498 0 0 1 18 15.5zM8 13v5h5.5a2.5 2.5 0 1 0 0-5H8z"
          />
          <.editor_button
            name="Italic"
            action={:italic}
            icon="M15 20H7v-2h2.927l2.116-12H9V4h8v2h-2.927l-2.116 12H15z"
          />
        </div>
        <div
          id="editor-element"
          phx-ref="element"
          phx-update="ignore"
        ></div>
      </div>
    """
  end

  def editor_button(assigns) do
    ~H"""
    <button
      phx-click={editor_action(@action)}
      data-editor-action
      aria-label={@name}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
      >
        <path d={@icon} />
      </svg>
    </button>
    """
  end

  defp editor_action(:bold) do
    JS.dispatch("editor-button:action", detail: %{action: "toggleBold"})
  end

  defp editor_action(:italic) do
    JS.dispatch("editor-button:action", detail: %{action: "toggleItalic"})
  end
end
```
