import { useState, type FormEvent } from 'react'

type TodoInputProps = {
  onAdd: (text: string) => void
}

export function TodoInput({ onAdd }: TodoInputProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  return (
    <form className="input-row" onSubmit={handleSubmit}>
      <input
        className="input-row__field"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs doing?"
        aria-label="New task"
        autoComplete="off"
      />
      <button className="input-row__add" type="submit" disabled={!text.trim()}>
        Add
      </button>
    </form>
  )
}
