const brailleMap: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
  'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
  'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
  '1': '⠁', '2': '⠃', '3': '⠉', '4': '⠙', '5': '⠑',
  '6': '⠋', '7': '⠛', '8': '⠓', '9': '⠊', '0': '⠚',
  ' ': ' ', ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲',
  '!': '⠖', '?': '⠦', "'": '⠄', '-': '⠤', '(': '⠐⠣', ')': '⠐⠜'
}

export function textToBraille(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(char => brailleMap[char] || ' ')
    .join('')
}

export interface BrailleDot {
  x: number
  y: number
  z: number
}

export interface BrailleCharacter {
  char: string
  dots: BrailleDot[]
  offsetX: number
}

export interface BrailleSettings {
  dotRadius?: number
  dotHeight?: number
}

export interface BraillePreset {
  name: string
  description: string
  dotRadius: number
  dotHeight: number
  padding: number
}

export const BRAILLE_PRESETS: Record<string, BraillePreset> = {
  'us-standard': {
    name: 'US Standard (ADA)',
    description: 'American Disability Act compliant - dots 1.5mm diameter, 0.6mm height',
    dotRadius: 0.75,
    dotHeight: 0.6,
    padding: 30
  },
  'marburg': {
    name: 'Marburg Medium',
    description: 'European standard - balanced for most applications',
    dotRadius: 0.7,
    dotHeight: 0.5,
    padding: 25
  },
  'jumbo': {
    name: 'Jumbo Braille',
    description: 'Extra large for learning and low dexterity - 2mm diameter, 0.8mm height',
    dotRadius: 1.0,
    dotHeight: 0.8,
    padding: 40
  },
  'compact': {
    name: 'Compact',
    description: 'Space-efficient design - smaller dots for experienced readers',
    dotRadius: 0.5,
    dotHeight: 0.4,
    padding: 20
  },
  'custom': {
    name: 'Custom',
    description: 'Adjust all parameters manually',
    dotRadius: 0.6,
    dotHeight: 0.5,
    padding: 30
  }
}

const dotWidth = 2.5
const dotHeight = 2.5
const dotSpacing = 2.5
const charSpacing = 6.0
const lineHeight = 10.0
export const DEFAULT_DOT_RADIUS = 0.6
export const DEFAULT_DOT_HEIGHT = 0.5

const brailleDotPatterns: Record<string, number[]> = {
  '⠁': [1], '⠃': [1, 2], '⠉': [1, 4], '⠙': [1, 4, 5], '⠑': [1, 5],
  '⠋': [1, 2, 4], '⠛': [1, 2, 4, 5], '⠓': [1, 2, 5], '⠊': [2, 4], '⠚': [2, 4, 5],
  '⠅': [1, 3], '⠇': [1, 2, 3], '⠍': [1, 3, 4], '⠝': [1, 3, 4, 5], '⠕': [1, 3, 5],
  '⠏': [1, 2, 3, 4], '⠟': [1, 2, 3, 4, 5], '⠗': [1, 2, 3, 5], '⠎': [2, 3, 4], '⠞': [2, 3, 4, 5],
  '⠥': [1, 3, 6], '⠧': [1, 2, 3, 6], '⠺': [2, 4, 5, 6], '⠭': [1, 3, 4, 6], '⠽': [1, 3, 4, 5, 6], '⠵': [1, 3, 5, 6],
  '⠂': [2], '⠆': [2, 3], '⠒': [2, 5], '⠲': [2, 5, 6], '⠖': [2, 3, 5], '⠦': [2, 3, 6],
  '⠄': [3], '⠤': [3, 6], '⠐⠣': [5, 2, 3, 6], '⠐⠜': [5, 3, 5, 6]
}

function getDotPosition(dotNumber: number): { x: number; y: number } {
  const positions: Record<number, { x: number; y: number }> = {
    1: { x: 0, y: 0 },
    2: { x: 0, y: dotSpacing },
    3: { x: 0, y: dotSpacing * 2 },
    4: { x: dotWidth, y: 0 },
    5: { x: dotWidth, y: dotSpacing },
    6: { x: dotWidth, y: dotSpacing * 2 }
  }
  return positions[dotNumber] || { x: 0, y: 0 }
}

export function getBrailleCharacters(brailleText: string, maxWidth: number = 100, dotHeight: number = DEFAULT_DOT_HEIGHT): BrailleCharacter[] {
  const characters: BrailleCharacter[] = []
  let currentX = 0
  let currentY = 0

  for (const char of brailleText) {
    if (char === ' ') {
      currentX += charSpacing
      if (currentX > maxWidth) {
        currentX = 0
        currentY -= lineHeight
      }
      continue
    }

    const pattern = brailleDotPatterns[char]
    if (!pattern) continue

    const dots: BrailleDot[] = pattern.map(dotNum => {
      const pos = getDotPosition(dotNum)
      return {
        x: currentX + pos.x,
        y: currentY - pos.y,
        z: dotHeight
      }
    })

    characters.push({
      char,
      dots,
      offsetX: currentX
    })

    currentX += charSpacing
    if (currentX > maxWidth) {
      currentX = 0
      currentY -= lineHeight
    }
  }

  return characters
}

export function generateSTL(
  characters: BrailleCharacter[], 
  baseWidth: number, 
  baseHeight: number, 
  baseDepth: number = 3, 
  minX: number = 0, 
  minY: number = 0,
  dotRadius: number = DEFAULT_DOT_RADIUS,
  dotHeight: number = DEFAULT_DOT_HEIGHT
): string {
  const triangles: string[] = []

  const addTriangle = (v1: number[], v2: number[], v3: number[]) => {
    const normal = calculateNormal(v1, v2, v3)
    triangles.push(`  facet normal ${normal[0].toExponential()} ${normal[1].toExponential()} ${normal[2].toExponential()}`)
    triangles.push(`    outer loop`)
    triangles.push(`      vertex ${v1[0].toExponential()} ${v1[1].toExponential()} ${v1[2].toExponential()}`)
    triangles.push(`      vertex ${v2[0].toExponential()} ${v2[1].toExponential()} ${v2[2].toExponential()}`)
    triangles.push(`      vertex ${v3[0].toExponential()} ${v3[1].toExponential()} ${v3[2].toExponential()}`)
    triangles.push(`    endloop`)
    triangles.push(`  endfacet`)
  }

  const calculateNormal = (v1: number[], v2: number[], v3: number[]): number[] => {
    const u = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]]
    const v = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]]
    const normal = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0]
    ]
    const length = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2)
    return length > 0 ? [normal[0] / length, normal[1] / length, normal[2] / length] : [0, 0, 1]
  }

  const baseX = minX
  const baseY = minY
  const baseX2 = minX + baseWidth
  const baseY2 = minY + baseHeight

  addTriangle([baseX, baseY, 0], [baseX2, baseY, 0], [baseX2, baseY2, 0])
  addTriangle([baseX, baseY, 0], [baseX2, baseY2, 0], [baseX, baseY2, 0])

  addTriangle([baseX, baseY, 0], [baseX, baseY2, 0], [baseX, baseY2, baseDepth])
  addTriangle([baseX, baseY, 0], [baseX, baseY2, baseDepth], [baseX, baseY, baseDepth])

  addTriangle([baseX2, baseY, 0], [baseX2, baseY2, baseDepth], [baseX2, baseY2, 0])
  addTriangle([baseX2, baseY, 0], [baseX2, baseY, baseDepth], [baseX2, baseY2, baseDepth])

  addTriangle([baseX, baseY, 0], [baseX2, baseY, baseDepth], [baseX2, baseY, 0])
  addTriangle([baseX, baseY, 0], [baseX, baseY, baseDepth], [baseX2, baseY, baseDepth])

  addTriangle([baseX, baseY2, 0], [baseX2, baseY2, 0], [baseX2, baseY2, baseDepth])
  addTriangle([baseX, baseY2, 0], [baseX2, baseY2, baseDepth], [baseX, baseY2, baseDepth])

  addTriangle([baseX, baseY, baseDepth], [baseX, baseY2, baseDepth], [baseX2, baseY2, baseDepth])
  addTriangle([baseX, baseY, baseDepth], [baseX2, baseY2, baseDepth], [baseX2, baseY, baseDepth])

  characters.forEach(character => {
    character.dots.forEach(dot => {
      const segments = 12
      const cx = dot.x
      const cy = -dot.y
      const cz = baseDepth + dotHeight

      for (let i = 0; i < segments; i++) {
        const angle1 = (i / segments) * Math.PI * 2
        const angle2 = ((i + 1) / segments) * Math.PI * 2

        const x1 = cx + Math.cos(angle1) * dotRadius
        const y1 = cy + Math.sin(angle1) * dotRadius
        const x2 = cx + Math.cos(angle2) * dotRadius
        const y2 = cy + Math.sin(angle2) * dotRadius

        addTriangle([cx, cy, cz], [x1, y1, baseDepth], [x2, y2, baseDepth])

        addTriangle([x1, y1, baseDepth], [x2, y2, baseDepth], [x2, y2, 0])
        addTriangle([x1, y1, baseDepth], [x2, y2, 0], [x1, y1, 0])
      }

      addTriangle([cx, cy, cz], [cx + dotRadius, cy, baseDepth], [cx, cy + dotRadius, baseDepth])
    })
  })

  return `solid braille\n${triangles.join('\n')}\nendsolid braille`
}
