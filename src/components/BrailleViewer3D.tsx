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
  const mouseDownRef = useRef(false)
  const mousePositionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
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
    camera.position.set(30, 15, 75)
    camera.lookAt(30, 15, 1.5)
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
      const delta = event.deltaY * 0.01
      if (cameraRef.current) {
        const currentZ = cameraRef.current.position.length()
        const newZ = Math.max(20, Math.min(300, currentZ + delta))
        const ratio = newZ / currentZ
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
    renderer.domElement.addEventListener('wheel', onWheel)
    window.addEventListener('resize', handleResize)

    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return
      
      frameIdRef.current = requestAnimationFrame(animate)

      if (modelGroupRef.current) {
        const radius = cameraRef.current.position.length()
        const bounds = new THREE.Box3().setFromObject(modelGroupRef.current)
        const center = bounds.getCenter(new THREE.Vector3())

        cameraRef.current.position.x = center.x + radius * Math.sin(rotationRef.current.y) * Math.cos(rotationRef.current.x)
        cameraRef.current.position.y = center.y + radius * Math.sin(rotationRef.current.x)
        cameraRef.current.position.z = center.z + radius * Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x)
        cameraRef.current.lookAt(center.x, center.y, center.z)
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }

    animate()

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
        frameIdRef.current = null
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
              object.material.forEach(material => material.dispose())
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
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!sceneRef.current) return

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
    baseMesh.position.set(baseWidth / 2, baseHeight / 2, baseDepth / 2)
    modelGroup.add(baseMesh)

    const dotMaterial = new THREE.MeshPhongMaterial({
      color: 0xe8a05a,
      shininess: 50
    })

    characters.forEach(character => {
      character.dots.forEach(dot => {
        const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16)
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial)
        dotMesh.position.set(dot.x, -dot.y, baseDepth + dotElevation)
        modelGroup.add(dotMesh)
      })
    })

    sceneRef.current.add(modelGroup)
  }, [characters, baseWidth, baseHeight, baseDepth])

  return <div ref={containerRef} className="w-full h-full rounded-lg" />
}
