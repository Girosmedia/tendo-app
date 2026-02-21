'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * NumericInput Component
 * 
 * Parte del Design System Tendo v1.0 - "Zimple Style"
 * Input optimizado para entrada numérica en móviles.
 * 
 * Características:
 * - Teclado numérico en móvil (inputMode="numeric")
 * - Formato automático de moneda chilena (opcional)
 * - Touch-friendly (h-11 mínimo)
 * - Validación de entrada solo números
 * 
 * @component
 */

interface NumericInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value?: number | string | null
  onChange?: (value: number | undefined) => void
  format?: 'currency' | 'number' | 'decimal'
  min?: number
  max?: number
  allowNegative?: boolean
}

export function NumericInput({
  value = '',
  onChange,
  format = 'number',
  min,
  max,
  allowNegative = false,
  className,
  ...props
}: NumericInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>('')

  // Formatear valor para display
  React.useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setDisplayValue('')
      return
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    if (isNaN(numValue)) {
      setDisplayValue('')
      return
    }

    if (format === 'currency') {
      setDisplayValue(numValue.toLocaleString('es-CL'))
    } else if (format === 'decimal') {
      setDisplayValue(numValue.toString())
    } else {
      setDisplayValue(Math.round(numValue).toLocaleString('es-CL'))
    }
  }, [value, format])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // Remover formato (puntos de miles)
    inputValue = inputValue.replace(/\./g, '')
    
    // Reemplazar coma por punto para decimales
    if (format === 'decimal') {
      inputValue = inputValue.replace(',', '.')
    }

    // Permitir solo números (y opcionalmente signo negativo)
    const regex = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/
    if (!regex.test(inputValue) && inputValue !== '') {
      return
    }

    // Convertir a número
    const numValue = inputValue === '' || inputValue === '-' ? undefined : parseFloat(inputValue)

    if (numValue === undefined) {
      onChange?.(undefined)
      return
    }

    // Validar rango
    if (min !== undefined && numValue < min) return
    if (max !== undefined && numValue > max) return

    // Llamar onChange con el valor numérico
    onChange?.(numValue)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al hacer focus, mostrar valor sin formato
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (numValue && !isNaN(numValue)) {
      e.target.value = numValue.toString()
    }
    props.onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Al perder focus, volver a formatear
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (numValue === undefined || numValue === null || isNaN(numValue)) {
      setDisplayValue('')
    } else {
      if (format === 'currency') {
        setDisplayValue(numValue.toLocaleString('es-CL'))
      } else if (format === 'decimal') {
        setDisplayValue(numValue.toString())
      } else {
        setDisplayValue(Math.round(numValue).toLocaleString('es-CL'))
      }
    }
    props.onBlur?.(e)
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode={format === 'decimal' ? 'decimal' : 'numeric'}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('h-11 text-right', format === 'currency' && 'text-lg font-semibold', className)}
    />
  )
}

/**
 * CurrencyInput Component
 * 
 * Input específico para entrada de moneda chilena (CLP).
 * Alias de NumericInput con format="currency".
 */
export function CurrencyInput(props: Omit<NumericInputProps, 'format'>) {
  return <NumericInput {...props} format="currency" />
}

/**
 * QuantityInput Component
 * 
 * Input específico para cantidades (sin decimales).
 * Con controles +/- para móvil.
 */
interface QuantityInputProps extends Omit<NumericInputProps, 'format'> {
  showControls?: boolean
}

export function QuantityInput({
  value = 0,
  onChange,
  min = 0,
  max,
  showControls = true,
  className,
  ...props
}: QuantityInputProps) {
  const numValue = typeof value === 'string' ? parseFloat(value) : value

  const increment = () => {
    const newValue = numValue + 1
    if (max === undefined || newValue <= max) {
      onChange?.(newValue)
    }
  }

  const decrement = () => {
    const newValue = numValue - 1
    if (min === undefined || newValue >= min) {
      onChange?.(newValue)
    }
  }

  if (!showControls) {
    return <NumericInput {...props} value={value} onChange={onChange} min={min} max={max} format="number" />
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrement}
        disabled={min !== undefined && numValue <= min}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-md border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-manipulation active:scale-95 transition-transform'
        )}
        aria-label="Disminuir"
      >
        <span className="text-xl font-bold">−</span>
      </button>
      
      <NumericInput
        {...props}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        format="number"
        className={cn('flex-1 text-center', className)}
      />
      
      <button
        type="button"
        onClick={increment}
        disabled={max !== undefined && numValue >= max}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-md border border-input bg-background',
          'hover:bg-accent hover:text-accent-foreground',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-manipulation active:scale-95 transition-transform'
        )}
        aria-label="Aumentar"
      >
        <span className="text-xl font-bold">+</span>
      </button>
    </div>
  )
}
