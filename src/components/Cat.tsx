import type { CatMood } from '../types'

type CatProps = {
  mood: CatMood
}

/**
 * The cat, drawn as inline SVG so it stays crisp at any size, recolors from
 * CSS custom properties, and needs no image assets.
 *
 * This component is intentionally dumb: it renders paths and puts a mood class
 * on the root. Every bit of motion lives in styles.css, keyed off that class.
 * Draw order matters — ears and tail are declared before the body/head so they
 * sit behind them and their bases stay hidden.
 */
export function Cat({ mood }: CatProps) {
  const celebrating = mood !== 'idle'

  return (
    <svg
      className={`cat cat--${mood}`}
      viewBox="0 0 200 200"
      role="img"
      aria-label={celebrating ? 'A very pleased cat' : 'A cat, waiting'}
    >
      <g className="cat__all">
        {/* Tail — sways gently at rest, wags hard while celebrating */}
        <path
          className="cat__tail"
          d="M 138 172 C 174 178 188 148 176 120"
          fill="none"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Ears (behind the head) */}
        <g className="cat__ears">
          <path className="cat__ear cat__ear--l" d="M 60 62 L 54 20 L 96 44 Z" />
          <path className="cat__ear cat__ear--r" d="M 140 62 L 146 20 L 104 44 Z" />
          <path className="cat__ear-inner" d="M 67 57 L 64 33 L 87 47 Z" />
          <path className="cat__ear-inner" d="M 133 57 L 136 33 L 113 47 Z" />
        </g>

        {/* Body */}
        <path
          className="cat__body"
          d="M 100 110 C 130 110 149 146 149 182 Q 149 193 138 193 L 62 193 Q 51 193 51 182 C 51 146 70 110 100 110 Z"
        />
        <ellipse className="cat__paw" cx="77" cy="187" rx="14" ry="8" />
        <ellipse className="cat__paw" cx="123" cy="187" rx="14" ry="8" />

        {/* Head */}
        <g className="cat__head">
          <ellipse className="cat__face" cx="100" cy="84" rx="48" ry="43" />

          {/* Whiskers */}
          <g className="cat__whiskers">
            <path d="M 64 99 L 30 93" />
            <path d="M 64 105 L 28 107" />
            <path d="M 65 111 L 32 120" />
            <path d="M 136 99 L 170 93" />
            <path d="M 136 105 L 172 107" />
            <path d="M 135 111 L 168 120" />
          </g>

          {/* Blush — only visible when the cat is pleased */}
          <ellipse className="cat__blush" cx="64" cy="99" rx="11" ry="6.5" />
          <ellipse className="cat__blush" cx="136" cy="99" rx="11" ry="6.5" />

          {/*
            Two eye treatments, swapped rather than morphed: round and open at
            rest, squinted into happy arcs while celebrating. Swapping is both
            simpler and more readable than trying to tween one path into the
            other.
          */}
          {celebrating ? (
            <g className="cat__eyes cat__eyes--happy">
              <path d="M 72 82 Q 82 69 92 82" />
              <path d="M 108 82 Q 118 69 128 82" />
            </g>
          ) : (
            <g className="cat__eyes cat__eyes--open">
              <ellipse className="cat__eye" cx="82" cy="79" rx="8" ry="10.5" />
              <ellipse className="cat__eye" cx="118" cy="79" rx="8" ry="10.5" />
              <circle className="cat__glint" cx="79" cy="75" r="3" />
              <circle className="cat__glint" cx="115" cy="75" r="3" />
            </g>
          )}

          {/* Nose + mouth */}
          <path className="cat__nose" d="M 93 97 L 107 97 L 100 105 Z" />
          <g className="cat__mouth">
            <path d="M 100 105 L 100 109" />
            <path d="M 100 109 Q 91 118 84 109" />
            <path d="M 100 109 Q 109 118 116 109" />
          </g>
        </g>
      </g>
    </svg>
  )
}
