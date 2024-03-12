import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import particlesVertexShader from "./shaders/particles/vertex.glsl"
import particlesFragmentShader from "./shaders/particles/fragment.glsl"
import * as dat from "dat.gui"
import gsap from "gsap"
class ParticlesScene {
  private gui = new dat.GUI()
  private videoTexture: THREE.VideoTexture
  private raycaster = new THREE.Raycaster()
  private clock = new THREE.Clock()
  private scene: THREE.Scene
  private textureLoader = new THREE.TextureLoader()
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private particlesMaterial: THREE.ShaderMaterial
  private raycasterPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 15),
    new THREE.MeshBasicMaterial()
  )
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
        uProgress: { value: 1 },
        uTexture: { value: null },
        uMouse: { value: new THREE.Vector3(999, 999, 999) },
        uTime: { value: 0 },
      },
    })
    const particlesGeometry = new THREE.PlaneGeometry(15, 15, 128, 128)
    const particles = new THREE.Points(
      particlesGeometry,
      this.particlesMaterial
    )
    const randomAngles = new Float32Array(
      particlesGeometry.attributes.position.count
    )
    for (let i = 0; i < randomAngles.length; i++) {
      randomAngles[i] = Math.random() * Math.PI * 2
    }
    particlesGeometry.setAttribute(
      "aAngle",
      new THREE.BufferAttribute(randomAngles, 1)
    )
    this.scene.add(particles)
    this.resize()
    window.addEventListener("resize", this.resize.bind(this))
    window.addEventListener("mousemove", this.onMouseMove.bind(this))
    this.setupGUI()
    this.decreaseProgress()
    this.setupVideo()
    this.addRaycasterPlane()
    this.tick()
  }
  private addRaycasterPlane() {
    this.raycasterPlane.visible = false
    this.scene.add(this.raycasterPlane)
  }
  private async decreaseProgress() {
    await gsap.to(this.particlesMaterial.uniforms.uProgress, {
      value: 0,
      duration: 2,
      ease: "power2.inOut",
    })
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
  private setupGUI() {
    this.gui
      .add(this.particlesMaterial.uniforms.uSize, "value")
      .min(0)
      .max(1)
      .step(0.01)
      .name("Size")
    this.gui
      .add(this.particlesMaterial.uniforms.uProgress, "value")
      .min(0)
      .max(1)
      .step(0.01)
      .name("Progress")
    this.gui
      .add({ texture: "video" }, "texture", ["video", "image"])
      .name("Texture")
      .onChange(async (value) => {
        if (value === "image") {
          try {
            const texture = await this.loadTexture("/picture-1.png")
            this.particlesMaterial.uniforms.uTexture.value = texture
          } catch (error) {
            console.log(error)
          }
        } else {
          this.particlesMaterial.uniforms.uTexture.value = this.videoTexture
        }
      })
    const video = document.getElementById("video") as HTMLVideoElement
    this.gui.add(video, "play").name("Play Video")
    this.gui.add(video, "pause").name("Pause Video")
    this.gui
      .add(video, "currentTime", 0, video.duration, 0.01)
      .name("Video Time")
  }
  private loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.minFilter = THREE.NearestFilter
          texture.magFilter = THREE.NearestFilter
          texture.format = THREE.RGBAFormat
          resolve(texture)
        },
        undefined,
        (error) => reject(error)
      )
    })
  }
  private setupVideo() {
    const video = document.getElementById("video") as HTMLVideoElement
    this.videoTexture = new THREE.VideoTexture(video)
    this.videoTexture.minFilter = THREE.NearestFilter
    this.videoTexture.magFilter = THREE.NearestFilter
    this.videoTexture.format = THREE.RGBAFormat
    this.particlesMaterial.uniforms.uTexture.value = this.videoTexture
  }
  private onMouseMove(event: MouseEvent) {
    const mouse = new THREE.Vector2(
      (event.clientX / this.sizes.width) * 2 - 1,
      -(event.clientY / this.sizes.height) * 2 + 1
    )
    this.raycaster.setFromCamera(mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.raycasterPlane)
    if (intersects.length > 0) {
      const point = intersects[0].point
      this.particlesMaterial.uniforms.uMouse.value = point
    } else {
      this.particlesMaterial.uniforms.uMouse.value = new THREE.Vector3(
        999,
        999,
        999
      )
    }
  }
  private tick() {
    this.controls.update()
    const elapsedTime = this.clock.getElapsedTime()
    this.particlesMaterial.uniforms.uTime.value = elapsedTime
    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.tick.bind(this))
  }
}
// Usage example
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement
if (canvas) {
  new ParticlesScene(canvas)
}
