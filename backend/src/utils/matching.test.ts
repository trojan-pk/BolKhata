import { describe, it, expect } from 'vitest'
import {
    levenshteinDistance,
    normalizeNameForMatching,
    matchPerson,
} from './matching'

describe('levenshteinDistance', () => {
    it('returns zero for identical strings', () => {
        expect(levenshteinDistance('usama', 'usama')).toBe(0)
    })

    it('returns the length of the other string when one is empty', () => {
        expect(levenshteinDistance('', 'abc')).toBe(3)
        expect(levenshteinDistance('abc', '')).toBe(3)
    })

    it('counts single edits', () => {
        expect(levenshteinDistance('kitten', 'sitting')).toBe(3)
        expect(levenshteinDistance('flaw', 'lawn')).toBe(2)
    })
})

describe('normalizeNameForMatching', () => {
    it('lowercases and trims', () => {
        expect(normalizeNameForMatching('  Usama  ')).toBe('usama')
    })

    it('strips trailing honorifics', () => {
        expect(normalizeNameForMatching('Usama Bhai')).toBe('usama')
        expect(normalizeNameForMatching('Ahmed Sahab')).toBe('ahmed')
        expect(normalizeNameForMatching('Sana Ji')).toBe('sana')
    })

    it('maps known phonetic respellings to their canonical form', () => {
        expect(normalizeNameForMatching('osama')).toBe('usama')
        expect(normalizeNameForMatching('ahmad')).toBe('ahmed')
        expect(normalizeNameForMatching('mohammad')).toBe('muhammad')
    })

    it('leaves unknown names untouched', () => {
        expect(normalizeNameForMatching('Zainab')).toBe('zainab')
    })
})

describe('matchPerson', () => {
    const people = [
        { id: '1', name: 'Usama' },
        { id: '2', name: 'Ahmed' },
        { id: '3', name: 'Zainab' },
    ]

    it('returns an exact match immediately', () => {
        expect(matchPerson('Ahmed', people)).toEqual({
            id: '2',
            name: 'Ahmed',
            distance: 0,
        })
    })

    it('matches spoken names with honorifics', () => {
        expect(matchPerson('Usama Bhai', people)?.id).toBe('1')
    })

    it('matches through phonetic respellings', () => {
        expect(matchPerson('Osama', people)?.id).toBe('1')
        expect(matchPerson('Asama', people)?.id).toBe('1')
    })

    it('matches close misspellings within the distance budget', () => {
        // "Zainub" is one edit away from "zainab"
        expect(matchPerson('Zainub', people)?.id).toBe('3')
    })

    it('returns null when nothing is close enough', () => {
        expect(matchPerson('Bilal', people)).toBeNull()
    })

    it('returns null for empty input or an empty roster', () => {
        expect(matchPerson('', people)).toBeNull()
        expect(matchPerson('Usama', [])).toBeNull()
    })

    it('prefers the closest candidate when several are within budget', () => {
        const roster = [
            { id: 'a', name: 'Sana' },
            { id: 'b', name: 'Sanaullah' },
        ]
        // "sana" itself is distance 0 from the first entry
        expect(matchPerson('Sana', roster)?.id).toBe('a')
    })
})
