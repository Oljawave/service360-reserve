import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseLocalDate,
  getTodayStart,
  getDaysDifference,
  isOverdue,
  formatDate,
  formatDateHuman,
  isToday,
  addDays,
  isValidDate,
} from '../dateHelpers'

describe('parseLocalDate', () => {
  it('парсит строку YYYY-MM-DD', () => {
    const result = parseLocalDate('2024-03-15')
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(2) // март = 2
    expect(result.getDate()).toBe(15)
  })

  it('парсит строку с временем ISO', () => {
    const result = parseLocalDate('2024-03-15T10:30:00')
    expect(result.getFullYear()).toBe(2024)
    expect(result.getDate()).toBe(15)
  })

  it('возвращает null при пустой строке', () => {
    expect(parseLocalDate('')).toBeNull()
    expect(parseLocalDate(null)).toBeNull()
    expect(parseLocalDate(undefined)).toBeNull()
  })
})

describe('getDaysDifference', () => {
  it('возвращает положительное число если date1 > date2', () => {
    const d1 = new Date(2024, 2, 20)
    const d2 = new Date(2024, 2, 15)
    expect(getDaysDifference(d1, d2)).toBe(5)
  })

  it('возвращает отрицательное число если date1 < date2', () => {
    const d1 = new Date(2024, 2, 10)
    const d2 = new Date(2024, 2, 15)
    expect(getDaysDifference(d1, d2)).toBe(-5)
  })

  it('возвращает 0 для одинаковых дат', () => {
    const d = new Date(2024, 2, 15)
    expect(getDaysDifference(d, d)).toBe(0)
  })
})

describe('isOverdue', () => {
  it('возвращает true если дата в прошлом', () => {
    const past = '2020-01-01'
    const today = new Date(2024, 2, 15)
    today.setHours(0, 0, 0, 0)
    expect(isOverdue(past, today)).toBe(true)
  })

  it('возвращает false если дата в будущем', () => {
    const future = '2099-12-31'
    const today = new Date(2024, 2, 15)
    today.setHours(0, 0, 0, 0)
    expect(isOverdue(future, today)).toBe(false)
  })

  it('возвращает false при пустой строке', () => {
    expect(isOverdue('')).toBe(false)
    expect(isOverdue(null)).toBe(false)
  })
})

describe('formatDate', () => {
  it('форматирует дату в YYYY-MM-DD', () => {
    const date = new Date(2024, 2, 5) // 5 марта 2024
    expect(formatDate(date)).toBe('2024-03-05')
  })

  it('добавляет ведущий ноль для месяца и дня', () => {
    const date = new Date(2024, 0, 9) // 9 января
    expect(formatDate(date)).toBe('2024-01-09')
  })

  it('возвращает пустую строку для null/undefined', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
})

describe('formatDateHuman', () => {
  it('форматирует в DD.MM.YYYY', () => {
    expect(formatDateHuman('2024-03-05')).toBe('05.03.2024')
  })

  it('принимает объект Date', () => {
    const date = new Date(2024, 2, 5)
    expect(formatDateHuman(date)).toBe('05.03.2024')
  })

  it('возвращает пустую строку для null', () => {
    expect(formatDateHuman(null)).toBe('')
    expect(formatDateHuman('')).toBe('')
  })
})

describe('isToday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 2, 15)) // 15 марта 2024
  })

  it('возвращает true для сегодняшней даты', () => {
    expect(isToday(new Date(2024, 2, 15))).toBe(true)
    expect(isToday('2024-03-15')).toBe(true)
  })

  it('возвращает false для другой даты', () => {
    expect(isToday(new Date(2024, 2, 14))).toBe(false)
    expect(isToday('2024-03-16')).toBe(false)
  })

  it('возвращает false для null', () => {
    expect(isToday(null)).toBe(false)
  })
})

describe('addDays', () => {
  it('добавляет дни к дате', () => {
    const date = new Date(2024, 2, 10)
    const result = addDays(date, 5)
    expect(result.getDate()).toBe(15)
  })

  it('переходит через конец месяца', () => {
    const date = new Date(2024, 2, 29) // 29 марта
    const result = addDays(date, 3)
    expect(result.getMonth()).toBe(3) // апрель
    expect(result.getDate()).toBe(1)
  })

  it('не мутирует оригинальную дату', () => {
    const date = new Date(2024, 2, 10)
    addDays(date, 5)
    expect(date.getDate()).toBe(10)
  })
})

describe('isValidDate', () => {
  it('возвращает true для валидной строки', () => {
    expect(isValidDate('2024-03-15')).toBe(true)
  })

  it('возвращает false для невалидной строки', () => {
    expect(isValidDate('not-a-date')).toBe(false)
    expect(isValidDate('')).toBe(false)
    expect(isValidDate(null)).toBe(false)
  })
})
