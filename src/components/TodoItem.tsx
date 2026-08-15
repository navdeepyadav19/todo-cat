import type { Todo } from '../types'

type TodoItemProps = {
  todo: Todo
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TodoItem({ todo, onToggle, onRemove }: TodoItemProps) {
  return (
    <li className={`todo ${todo.done ? 'todo--done' : ''}`}>
      {/*
        A real checkbox, visually hidden and replaced by the styled box next to
        it. Keeps keyboard navigation, focus, and screen-reader semantics for
        free — restyling a native control beats reimplementing one with divs.
      */}
      <label className="todo__label">
        <input
          className="todo__checkbox"
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
        />
        <span className="todo__box" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="todo__tick">
            <path d="M 3 8.5 L 6.5 12 L 13 4.5" />
          </svg>
        </span>
        <span className="todo__text">{todo.text}</span>
      </label>

      <button
        className="todo__remove"
        onClick={() => onRemove(todo.id)}
        aria-label={`Delete "${todo.text}"`}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M 4 4 L 12 12 M 12 4 L 4 12" />
        </svg>
      </button>
    </li>
  )
}
