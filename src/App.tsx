import { useState, useMemo } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Download, Cube } from '@phosphor-icons/react'
import { BrailleViewer3D } from '@/components/BrailleViewer3D'
import { textToBraille, getBrailleCharacters, generateSTL } from '@/lib/braille'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

function App() {
  const [inputText, setInputText] = useState('')

  const brailleText = useMemo(() => textToBraille(inputText), [inputText])
  
  const brailleCharacters = useMemo(() => {
    if (!brailleText) return []
    return getBrailleCharacters(brailleText, 80)
  }, [brailleText])

  const { baseWidth, baseHeight } = useMemo(() => {
    if (brailleCharacters.length === 0) {
      return { baseWidth: 60, baseHeight: 30 }
    }

    const allDots = brailleCharacters.flatMap(c => c.dots)
    const minX = Math.min(...allDots.map(d => d.x), 0)
    const maxX = Math.max(...allDots.map(d => d.x), 0)
    const minY = Math.min(...allDots.map(d => d.y), 0)
    const maxY = Math.max(...allDots.map(d => d.y), 0)

    return {
      baseWidth: Math.max(maxX - minX + 10, 60),
      baseHeight: Math.max(maxY - minY + 10, 30)
    }
  }, [brailleCharacters])

  const handleDownloadSTL = () => {
    if (!inputText.trim()) {
      toast.error('Please enter some text first')
      return
    }

    try {
      const stlContent = generateSTL(brailleCharacters, baseWidth, baseHeight)
      const blob = new Blob([stlContent], { type: 'application/vnd.ms-pki.stl' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fileName = `braille-${inputText.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.stl`
      a.download = fileName
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      toast.success(`Downloaded: ${fileName}`, {
        description: 'Check your Downloads folder'
      })
    } catch (error) {
      console.error('STL generation error:', error)
      toast.error('Failed to generate STL file', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
            Braille 3D Generator
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-8">
            Convert text to tactile Braille models for 3D printing
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="p-6 space-y-4 h-full">
              <div className="space-y-2">
                <Label htmlFor="text-input" className="text-base font-semibold">
                  Enter Your Text
                </Label>
                <Textarea
                  id="text-input"
                  placeholder="Type or paste your text here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] font-mono text-base resize-none focus:ring-2 focus:ring-accent transition-all"
                  maxLength={200}
                />
                <p className="text-sm text-muted-foreground">
                  {inputText.length} / 200 characters
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Cube size={20} className="text-accent" />
                  Braille Preview
                </Label>
                <div className="bg-secondary p-4 rounded-lg min-h-[100px] font-mono text-2xl break-all">
                  {brailleText || (
                    <span className="text-muted-foreground text-base">
                      Braille output will appear here...
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={handleDownloadSTL}
                disabled={!inputText.trim()}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium py-6 text-base transition-all hover:shadow-lg disabled:opacity-50"
              >
                <Download size={20} className="mr-2" />
                Download STL File
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="p-6 h-full">
              <Label className="text-base font-semibold mb-4 block">
                3D Model Preview
              </Label>
              <div className="w-full h-[500px] lg:h-[calc(100%-3rem)] bg-secondary rounded-lg overflow-hidden">
                {inputText.trim() ? (
                  <BrailleViewer3D
                    characters={brailleCharacters}
                    baseWidth={baseWidth}
                    baseHeight={baseHeight}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Cube size={48} className="mx-auto opacity-50" />
                      <p>Enter text to see 3D preview</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="p-6 bg-card/50">
            <h2 className="text-xl font-semibold mb-3">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-accent">1. Enter Text</p>
                <p className="text-muted-foreground">
                  Type your message in the input field (up to 200 characters)
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-accent">2. Preview Model</p>
                <p className="text-muted-foreground">
                  View the 3D Braille model - drag to rotate, scroll to zoom
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-accent">3. Download & Print</p>
                <p className="text-muted-foreground">
                  Export as STL and 3D print your tactile Braille label
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default App