/**
 * Remove caracteres não numéricos e retorna apenas os dígitos.
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "")
}

/**
 * Verifica se a string tem exatamente 11 dígitos.
 */
export function hasCorrectLength(digits: string): boolean {
  return digits.length === 11
}

/**
 * Valida os dígitos verificadores do CPF (algoritmo oficial).
 * Assume que digits tem 11 caracteres numéricos.
 */
function validCheckDigits(digits: string): boolean {
  if (/^(\d)\1{10}$/.test(digits)) return false // rejeita 111.111.111-11 etc.

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits[10], 10)) return false

  return true
}

/**
 * Retorna true se o valor (com ou sem máscara) é um CPF válido:
 * 11 dígitos e dígitos verificadores corretos.
 */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value)
  return hasCorrectLength(digits) && validCheckDigits(digits)
}

/**
 * Formata até 11 dígitos como 999.999.999-99 para exibição.
 */
export function formatCpfDisplay(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/**
 * Retorna o CPF apenas com dígitos para enviar à API (11 caracteres).
 */
export function cpfForApi(value: string): string {
  return onlyDigits(value).slice(0, 11)
}
