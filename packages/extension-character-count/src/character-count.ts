import { Extension, getText } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Node as ProseMirrorNode } from 'prosemirror-model'

export const pluginKey = new PluginKey('characterLimit')

export interface CharacterCountOptions {
  limit: number,
  countLineBreaks: boolean,
}

export interface CharacterCountStorage {
  /**
   * Get the number of characters for the current document.
   */
  characters?: (options: {
    node?: ProseMirrorNode,
  }) => number,
}

export const CharacterCount = Extension.create<CharacterCountOptions, CharacterCountStorage>({
  name: 'characterCount',

  addOptions() {
    return {
      limit: 0,
      countLineBreaks: true,
    }
  },

  addStorage() {
    return {
      characters: undefined,
    }
  },

  onBeforeCreate() {
    this.storage.characters = ({ node } = {}) => {
      let text = getText(node || this.editor.state.doc, {
        blockSeparator: '\n',
        textSerializers: this.editor.extensionManager.textSerializers,
      })

      if (!this.options.countLineBreaks) {
        text = text.replace(/\n/g, '')
      }

      return text.length
    }
  },

  addProseMirrorPlugins() {
    const { limit } = this.options

    if (!limit) {
      return []
    }

    return [
      new Plugin({
        key: pluginKey,
        // appendTransaction: (transactions, oldState, newState) => {
        //   // const length = newState.doc.content.size
        //   if (!this.storage.characters) {
        //     return
        //   }

        //   const length = this.storage.characters({
        //     node: newState.doc,
        //   })

        //   if (length > limit) {
        //     return newState.tr.insertText('', limit + 1, length)
        //   }
        // },
      }),
    ]
  },
})
