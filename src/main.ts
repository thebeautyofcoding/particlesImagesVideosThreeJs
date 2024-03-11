import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import particlesVertexShader from "./shaders/particles/vertex.glsl"
import particlesFragmentShader from "./shaders/particles/fragment.glsl"
class ParticlesScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private particlesMaterial: THREE.ShaderMaterial
  private sizes: {
    width: number
    height: number
    pixelRatio: number
  }
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene()
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    }
    this.camera = new THREE.PerspectiveCamera(
      35,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    )
    this.camera.position.set(0, 0, 18)
    this.scene.add(this.camera)
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    })
    this.renderer.setClearColor("#181818")
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(this.sizes.pixelRatio)
    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.particlesMaterial = new THREE.ShaderMaterial({
      vertexShader: particlesVertexShader,
      fragmentShader: particlesFragmentShader,
      uniforms: {
        uResolution: new THREE.Uniform(
          new THREE.Vector2(
            this.sizes.width * this.sizes.pixelRatio,
            this.sizes.height * this.sizes.pixelRatio
          )
        ),
        uSize: { value: 0.2 },
      },
    })
    const particlesGeometry = new THREE.PlaneGeometry(10, 10, 32, 32)
    const particles = new THREE.Points(
      particlesGeometry,
      this.particlesMaterial
    )
    this.scene.add(particles)
    this.resize()
    window.addEventListener("resize", this.resize.bind(this))
    this.tick()
  }
  private resize() {
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight
    this.sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)
    this.particlesMaterial.uniforms.uResolution.value.set(
      this.sizes.width * this.sizes.pixelRatio,
      this.sizes.height * this.sizes.pixelRatio
    )
    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(this.sizes.pixelRatio)
  }
  private tick() {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.tick.bind(this))
  }
}
// Usage example
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement
if (canvas) {
  new ParticlesScene(canvas)
}
