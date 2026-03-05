import { describe, it, expect } from 'vitest'
import { formatDate, formatDateForBackend } from '../formatters'

describe('formatDate', () => {
  it('форматирует строку даты в DD.MM.YYYY', () => {
    expect(formatDate('2024-03-05')).toBe('05.03.2024')
  })

  it('форматирует объект Date', () => {
    expect(formatDate(new Date(2024, 2, 5))).toBe('05.03.2024')
  })

  it('добавляет ведущий ноль', () => {
    expect(formatDate('2024-01-09')).toBe('09.01.2024')
  })

  it('возвращает null при пустом значении', () => {
    expect(formatDate(null)).toBeNull()
    expect(formatDate(undefined)).toBeNull()
    expect(formatDate('')).toBeNull()
  })

  it('возвращает null для невалидной даты', () => {
    expect(formatDate('not-a-date')).toBeNull()
  })
})

describe('formatDateForBackend', () => {
  it('форматирует строку даты в YYYY-MM-DD', () => {
    expect(formatDateForBackend('2024-03-05')).toBe('2024-03-05')
  })

  it('форматирует объект Date', () => {
    const date = new Date(2024, 2, 5)
    expect(formatDateForBackend(date)).toBe('2024-03-05')
  })

  it('форматирует timestamp (число)', () => {
    const ts = new Date(2024, 2, 5).getTime()
    expect(formatDateForBackend(ts)).toBe('2024-03-05')
  })

  it('добавляет ведущий ноль для месяца и дня', () => {
    expect(formatDateForBackend('2024-01-09')).toBe('2024-01-09')
  })

  it('возвращает null при пустом значении', () => {
    expect(formatDateForBackend(null)).toBeNull()
    expect(formatDateForBackend(undefined)).toBeNull()
    expect(formatDateForBackend('')).toBeNull()
  })

  it('возвращает null для невалидной даты', () => {
    expect(formatDateForBackend('invalid')).toBeNull()
  })
})
