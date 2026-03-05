import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { BrailleCharacter, dotRadius, dotElevation } from '@/lib/braille'

interface BrailleViewer3DProps {
  characters: BrailleCharacter[]
  baseWidth: number
  baseHeight: number
  baseDepth?: number
}

export function BrailleViewer3D({ characters, baseWidth, baseHeight, baseDepth = 3 }: BrailleViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameIdRef = useRef<number | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const rotationRef = useRef({ x: -0.3, y: 0.5 })

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    if (!rendererRef.current) {
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      rendererRef.current = renderer
      containerRef.current.appendChild(renderer.domElement)
    }

    if (!sceneRef.current) {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f4f0)
      sceneRef.current = scene

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight1.position.set(10, -10, 20)
      scene.add(directionalLight1)

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
      directionalLight2.position.set(-10, 10, 10)
      scene.add(directionalLight2)
    }

    if (!cameraRef.current) {
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
      camera.position.set(baseWidth / 2, -baseHeight / 2, Math.max(baseWidth, baseHeight) * 1.5)
      camera.lookAt(baseWidth / 2, -baseHeight / 2, baseDepth / 2)
      cameraRef.current = camera
    }

    if (modelGroupRef.current) {
      sceneRef.current.remove(modelGroupRef.current)
      modelGroupRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }

    const modelGroup = new THREE.Group()
    modelGroupRef.current = modelGroup

    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 30
    })
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth)
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
    baseMesh.position.set(baseWidth / 2, -baseHeight / 2, baseDepth / 2)
    modelGroup.add(baseMesh)

    const dotMaterial = new THREE.MeshPhongMaterial({
      color: 0xe8a05a,
      shininess: 50
    })

    characters.forEach(character => {
      character.dots.forEach(dot => {
        const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16)
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial)
        dotMesh.position.set(dot.x, dot.y, baseDepth + dotElevation)
        modelGroup.add(dotMesh)
      })
    })

    sceneRef.current.add(modelGroup)

    cameraRef.current.position.set(baseWidth / 2, -baseHeight / 2, Math.max(baseWidth, baseHeight) * 1.5)
    cameraRef.current.lookAt(baseWidth / 2, -baseHeight / 2, baseDepth / 2)

  }, [characters, baseWidth, baseHeight, baseDepth])

  useEffect(() => {
    if (!containerRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return

    const renderer = rendererRef.current
    const scene = sceneRef.current
    const camera = cameraRef.current

    let mouseDown = false
    let mouseX = 0
    let mouseY = 0

    const onMouseDown = (event: MouseEvent) => {
      mouseDown = true
      mouseX = event.clientX
      mouseY = event.clientY
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return

      const deltaX = event.clientX - mouseX
      const deltaY = event.clientY - mouseY

      rotationRef.current.y += deltaX * 0.005
      rotationRef.current.x += deltaY * 0.005

      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x))

      mouseX = event.clientX
      mouseY = event.clientY
    }

    const onMouseUp = () => {
      mouseDown = false
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const delta = event.deltaY * 0.01
      camera.position.z = Math.max(10, Math.min(200, camera.position.z + delta))
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel)

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)

      if (!cameraRef.current || !modelGroupRef.current) return

      const radius = cameraRef.current.position.length()
      const centerX = modelGroupRef.current.position.x + baseWidth / 2
      const centerY = modelGroupRef.current.position.y - baseHeight / 2
      const centerZ = modelGroupRef.current.position.z + baseDepth / 2

      cameraRef.current.position.x = centerX + radius * Math.sin(rotationRef.current.y) * Math.cos(rotationRef.current.x)
      cameraRef.current.position.y = centerY + radius * Math.sin(rotationRef.current.x)
      cameraRef.current.position.z = centerZ + radius * Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x)
      cameraRef.current.lookAt(centerX, centerY, centerZ)

      renderer.render(scene, cameraRef.current)
    }

    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
      if (modelGroupRef.current) {
        modelGroupRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose()
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
      }
      if (rendererRef.current) {
        if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
        rendererRef.current.dispose()
        rendererRef.current = null
      }
      sceneRef.current = null
      cameraRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full rounded-lg" />
}
