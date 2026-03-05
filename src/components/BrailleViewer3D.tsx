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

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f4f0)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(baseWidth / 2, -baseHeight / 2, Math.max(baseWidth, baseHeight) * 1.5)
    camera.lookAt(baseWidth / 2, -baseHeight / 2, baseDepth / 2)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer

    containerRef.current.appendChild(renderer.domElement)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight1.position.set(10, -10, 20)
    scene.add(directionalLight1)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3)
    directionalLight2.position.set(-10, 10, 10)
    scene.add(directionalLight2)

    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 30
    })
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth)
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial)
    baseMesh.position.set(baseWidth / 2, -baseHeight / 2, baseDepth / 2)
    scene.add(baseMesh)

    const dotMaterial = new THREE.MeshPhongMaterial({
      color: 0xe8a05a,
      shininess: 50
    })

    characters.forEach(character => {
      character.dots.forEach(dot => {
        const dotGeometry = new THREE.SphereGeometry(dotRadius, 16, 16)
        const dotMesh = new THREE.Mesh(dotGeometry, dotMaterial)
        dotMesh.position.set(dot.x, dot.y, baseDepth + dotElevation)
        scene.add(dotMesh)
      })
    })

    let mouseDown = false
    let mouseX = 0
    let mouseY = 0
    let rotationX = -0.3
    let rotationY = 0.5

    const onMouseDown = (event: MouseEvent) => {
      mouseDown = true
      mouseX = event.clientX
      mouseY = event.clientY
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!mouseDown) return

      const deltaX = event.clientX - mouseX
      const deltaY = event.clientY - mouseY

      rotationY += deltaX * 0.005
      rotationX += deltaY * 0.005

      rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX))

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

      const radius = camera.position.length()
      camera.position.x = baseWidth / 2 + radius * Math.sin(rotationY) * Math.cos(rotationX)
      camera.position.y = -baseHeight / 2 + radius * Math.sin(rotationX)
      camera.position.z = radius * Math.cos(rotationY) * Math.cos(rotationX)
      camera.lookAt(baseWidth / 2, -baseHeight / 2, baseDepth / 2)

      renderer.render(scene, camera)
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
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', handleResize)
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [characters, baseWidth, baseHeight, baseDepth])

  return <div ref={containerRef} className="w-full h-full rounded-lg" />
}
