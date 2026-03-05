import * as React from 'react'
import * as THREE from 'three'
import { BrailleCharacter, dotRadius, dotElevation } from '@/lib/braille'

interface BrailleViewer3DProps {
  characters: BrailleCharacter[]
  baseWidth: number
  baseHeight: number
  minX: number
  minY: number
  baseDepth?: number
}

export function BrailleViewer3D({ characters, baseWidth, baseHeight, minX, minY, baseDepth = 3 }: BrailleViewer3DProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = React.useRef<THREE.Scene | null>(null)
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null)
  const frameIdRef = React.useRef<number | null>(null)
  const modelGroupRef = React.useRef<THREE.Group | null>(null)
  const rotationRef = React.useRef({ x: -0.3, y: 0.5 })
  const mouseDownRef = React.useRef(false)
  const mousePositionRef = React.useRef({ x: 0, y: 0 })
  const modelCenterRef = React.useRef(new THREE.Vector3())

  React.useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    container.appendChild(renderer.domElement)

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

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(40, 20, 80)
    camera.lookAt(40, 0, 0)
    cameraRef.current = camera

    const onMouseDown = (event: MouseEvent) => {
      mouseDownRef.current = true
      mousePositionRef.current.x = event.clientX
      mousePositionRef.current.y = event.clientY
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDownRef.current) return

      const deltaX = event.clientX - mousePositionRef.current.x
      const deltaY = event.clientY - mousePositionRef.current.y

      rotationRef.current.y += deltaX * 0.005
      rotationRef.current.x += deltaY * 0.005

      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x))

      mousePositionRef.current.x = event.clientX
      mousePositionRef.current.y = event.clientY
    }

    const onMouseUp = () => {
      mouseDownRef.current = false
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (cameraRef.current) {
        const currentDist = cameraRef.current.position.length()
        const newDist = Math.max(30, Math.min(200, currentDist + event.deltaY * 0.05))
        const ratio = newDist / currentDist
        cameraRef.current.position.multiplyScalar(ratio)
      }
    }

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', handleResize)

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate)

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        const radius = 80
        const center = modelCenterRef.current

        cameraRef.current.position.x = center.x + radius * Math.sin(rotationRef.current.y) * Math.cos(rotationRef.current.x)
        cameraRef.current.position.y = center.y + radius * Math.sin(rotationRef.current.x)
        cameraRef.current.position.z = center.z + radius * Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x)
        cameraRef.current.lookAt(center)

        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)

      if (modelGroupRef.current) {
        modelGroupRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose()
            if (Array.isArray(object.material)) {
              object.material.forEach(m => m.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
      }

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  React.useEffect(() => {
    if (!sceneRef.current) return

    if (modelGroupRef.current) {
      sceneRef.current.remove(modelGroupRef.current)
      modelGroupRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
      modelGroupRef.current = null
    }

    const modelGroup = new THREE.Group()

    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 30,
    })
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseDepth, baseHeight)
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
    baseMesh.position.set(minX + baseWidth / 2, baseDepth / 2, minY + baseHeight / 2)
    modelGroup.add(baseMesh)

    const dotMaterial = new THREE.MeshPhongMaterial({
      color: 0xe8a05a,
      shininess: 50,
    })

    characters.forEach(character => {
      character.dots.forEach(dot => {
        const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16)
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial)
        dotMesh.position.set(dot.x, baseDepth + dotElevation, dot.y)
        modelGroup.add(dotMesh)
      })
    })

    modelGroupRef.current = modelGroup
    sceneRef.current.add(modelGroup)

    const bounds = new THREE.Box3().setFromObject(modelGroup)
    modelCenterRef.current = bounds.getCenter(new THREE.Vector3())
  }, [characters, baseWidth, baseHeight, minX, minY, baseDepth])

  return <div ref={containerRef} className="w-full h-full rounded-lg" />
}
