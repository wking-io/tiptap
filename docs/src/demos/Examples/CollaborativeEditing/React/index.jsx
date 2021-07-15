import React, {
  useMemo, useState, useCallback, useEffect,
} from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import CharacterCount from '@tiptap/extension-character-count'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'
import MenuBar from './MenuBar'
import './styles.scss'

const colors = [
  '#958DF1',
  '#F98181',
  '#FBBC88',
  '#FAF594',
  '#70CFF8',
  '#94FADB',
  '#B9F18D',
]

const rooms = [
  'room.4',
  'room.5',
  'room.6',
]

const names = [
  'Lea Thompson',
  'Cyndi Lauper',
  'Tom Cruise',
  'Madonna',
  'Jerry Hall',
  'Joan Collins',
  'Winona Ryder',
  'Christina Applegate',
  'Alyssa Milano',
  'Molly Ringwald',
  'Ally Sheedy',
  'Debbie Harry',
  'Olivia Newton-John',
  'Elton John',
  'Michael J. Fox',
  'Axl Rose',
  'Emilio Estevez',
  'Ralph Macchio',
  'Rob Lowe',
  'Jennifer Grey',
  'Mickey Rourke',
  'John Cusack',
  'Matthew Broderick',
  'Justine Bateman',
  'Lisa Bonet',
]

const getRandomElement = list => list[Math.floor(Math.random() * list.length)]

const getRandomRoom = () => getRandomElement(rooms)
const getRandomColor = () => getRandomElement(colors)
const getRandomName = () => getRandomElement(names)

const room = getRandomRoom()

export default () => {
  const [ydoc, setYdoc] = useState(null)
  const [provider, setProvider] = useState(null)
  const [status, setStatus] = useState('connecting')
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('currentUser')) || {
    name: getRandomName(),
    color: getRandomColor(),
  })

  // On mount
  // … create y.js doc
  // … bind websocket provider
  // … and store shared data persistently in browser to make offline editing possible
  useEffect(() => {
    const newYdoc = new Y.Doc()
    const indexdb = new IndexeddbPersistence(room, newYdoc)
    const newProvider = new WebsocketProvider('wss://websocket.tiptap.dev', room, newYdoc)
    newProvider.on('status', event => {
      setStatus(event.status)
    })

    setYdoc(newYdoc)
    setProvider(newProvider)
  }, [])

  // Once y.js doc and websocket provider are initialised, compose editor options
  const editorOptions = useMemo(() => {
    return (ydoc && provider) ? {
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Highlight,
        TaskList,
        TaskItem,
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider,
          // user: currentUser, // Set in useEffect bellow
          onUpdate: updatedUsers => {
            setUsers(updatedUsers)
          },
        }),
        CharacterCount.configure({
          limit: 10000,
        }),
      ],
    } : null
  }, [ydoc, provider])

  const editor = useEditor(editorOptions, [editorOptions])

  // Destroy instances on unmount
  useEffect(() => {
    return () => {
      if (editor && provider) {
        editor.destroy()
        provider.destroy()
      }
    }
  }, [editor, provider])

  // Save current user in local storage and emit to editor
  useEffect(() => {
    if (editor && currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
      editor.chain().focus().user(currentUser).run()
    }
  }, [editor, currentUser])

  const setName = useCallback(
    () => {
      const name = (window.prompt('Name') || '')
        .trim()
        .substring(0, 32)

      if (name) {
        return setCurrentUser({ ...currentUser, name })
      }
    }, [currentUser],
  )

  const isInitialized = !!(editor && ydoc && provider)

  return (isInitialized) && (
    <div className="editor">
      <MenuBar className="editor__header" editor={editor} />
      <EditorContent className="editor__content" editor={editor} />
      <div className="editor__footer">
        <div className={`editor__status editor__status--${status}`}>
          {status === 'connected' ? `${users.length} user${users.length === 1 ? '' : 's'} online in ${room}` : 'offline'}
        </div>
        <div className="editor__name">
          <button onClick={setName}>
            {currentUser.name}
          </button>
        </div>
      </div>
    </div>
  )
}
