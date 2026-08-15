import { TodoItem } from './TodoItem'
import type { Todo } from '../types'

type TodoListProps = {
  todos: Todo[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function TodoList({ todos, onToggle, onRemove }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <p className="empty">
        Nothing here yet. Add a task and give the cat something to be proud of.
      </p>
    )
  }

  // Open tasks first, but keep each group in the order it was created.
  const ordered = [...todos].sort(
    (a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt,
  )

  return (
    <ul className="todo-list">
      {ordered.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRemove={onRemove}
        />
      ))}
    </ul>
  )
}
