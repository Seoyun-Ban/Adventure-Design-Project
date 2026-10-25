import type { ReactNode } from 'react'

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      className={`action-button ${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}
