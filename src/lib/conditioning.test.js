import { describe, it, expect } from 'vitest'
import { formatDuration, computeAvgPace, formatPace, modalityLabel } from './conditioning'

describe('formatDuration', () => {
  it('zero seconds → "0:00"', () => {
    expect(formatDuration(0)).toBe('0:00')
  })
  it('seconds-only → m:ss', () => {
    expect(formatDuration(45)).toBe('0:45')
    expect(formatDuration(90)).toBe('1:30')
  })
  it('drops hours when zero', () => {
    expect(formatDuration(2550)).toBe('42:30')
  })
  it('shows hours when nonzero', () => {
    expect(formatDuration(3930)).toBe('1:05:30')
    expect(formatDuration(7200)).toBe('2:00:00')
  })
  it('null/undefined/negative → em dash', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(undefined)).toBe('—')
    expect(formatDuration(-1)).toBe('—')
  })
})

describe('computeAvgPace', () => {
  it('30 min over 4 mi → 7:30/mi pace (450 s/mi)', () => {
    // 1800 s / 4 mi = 450 s/mi
    expect(computeAvgPace(1800, 4)).toBe(450)
  })
  it('25 min over 5 km → 5:00/km pace (300 s/km)', () => {
    expect(computeAvgPace(1500, 5)).toBe(300)
  })
  it('rounds to integer seconds', () => {
    // 1000s / 3 = 333.33 → 333
    expect(computeAvgPace(1000, 3)).toBe(333)
  })
  it('returns null when either input is missing or zero', () => {
    expect(computeAvgPace(null, 4)).toBeNull()
    expect(computeAvgPace(1800, null)).toBeNull()
    expect(computeAvgPace(0, 4)).toBeNull()
    expect(computeAvgPace(1800, 0)).toBeNull()
    expect(computeAvgPace(undefined, undefined)).toBeNull()
  })
})

describe('formatPace', () => {
  it('450 s/mi → "7:30/mi"', () => {
    expect(formatPace(450, 'mi')).toBe('7:30/mi')
  })
  it('300 s/km → "5:00/km"', () => {
    expect(formatPace(300, 'km')).toBe('5:00/km')
  })
  it('default unit is mi', () => {
    expect(formatPace(450)).toBe('7:30/mi')
  })
  it('non-positive / null → em dash', () => {
    expect(formatPace(0, 'mi')).toBe('—')
    expect(formatPace(null, 'mi')).toBe('—')
    expect(formatPace(-100, 'mi')).toBe('—')
  })
})

describe('modalityLabel', () => {
  it('known modality returns canonical label', () => {
    expect(modalityLabel('run')).toBe('Run')
    expect(modalityLabel('kettlebell')).toBe('Kettlebell')
  })
  it('unknown modality is title-cased', () => {
    expect(modalityLabel('treadmill')).toBe('Treadmill')
  })
  it('empty / null → ""', () => {
    expect(modalityLabel('')).toBe('')
    expect(modalityLabel(null)).toBe('')
  })
})
