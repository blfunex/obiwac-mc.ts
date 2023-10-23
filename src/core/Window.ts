import Shader from "./Shader";
import "./Window.scss";
import { IRunnable } from "./run";

export default abstract class Window implements IRunnable {
  constructor({
    width = 800,
    height = 600,
    title = "Untitled",
    fitting = "stretch",
    background = "black",
    resizable = true,
    fullscreen = false,
    antialias = false,
    alpha = false,
    depth = false,
    stencil = false,
    preserveDrawingBuffer = false,
    desynchronized = false,
    failIfMajorPerformanceCaveat = false,
    powerPreference = "default",
    premultipliedAlpha = true,
  }: {
    width?: number;
    height?: number;
    title?: string;
    resizable?: boolean;
    fullscreen?: boolean;
    fitting?: Fitting;
    background?: string;
  } & WebGLContextAttributes = {}) {
    const canvas = document.createElement("canvas");

    const root = document.createElement("div");

    root.classList.add("window");

    const rootRO = new ResizeObserver(([{ contentRect }]) => {
      this.onWindowResize(contentRect.width, contentRect.height);
    });

    rootRO.observe(root);

    const canvasRO = new ResizeObserver(() => {
      this.onCanvasResize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      this.onRender(0, performance.now());
    });

    canvasRO.observe(canvas);

    const header = document.createElement("header");

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let pointerId = 0;

    header.addEventListener("dblclick", () => {
      this.maximized = !this.maximized;
    });

    header.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      header.setPointerCapture(event.pointerId);

      dragging = true;
      header.classList.add("dragging");
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      lastX = root.offsetLeft;
      lastY = root.offsetTop;
    });

    header.addEventListener("pointermove", (event) => {
      event.preventDefault();

      if (!dragging || !header.hasPointerCapture(pointerId)) return;

      const x = event.clientX;
      const y = event.clientY;

      root.style.left = `${lastX + x - startX}px`;
      root.style.top = `${lastY + y - startY}px`;
    });

    header.addEventListener("pointerup", (event) => {
      event.preventDefault();

      dragging = false;

      const x = event.clientX;
      const y = event.clientY;

      root.style.left = `${lastX + x - startX}px`;
      root.style.top = `${lastY + y - startY}px`;

      header.releasePointerCapture(pointerId);
      header.classList.remove("dragging");
    });

    root.appendChild(canvas);
    root.appendChild(header);

    document.body.appendChild(root);

    const gl = canvas.getContext("webgl2", {
      antialias,
      alpha,
      depth,
      stencil,
      preserveDrawingBuffer,
      desynchronized,
      failIfMajorPerformanceCaveat,
      powerPreference,
      premultipliedAlpha,
    })!;

    if (!gl) throw new Error("Failed to create WebGL2 context");

    Shader.gl = gl;

    Shader.use(Shader.default);

    this.gl = gl;
    this.root = root;
    this.canvas = canvas;
    this.#header = header;
    this.fullscreen = fullscreen;
    this.resizable = resizable;
    this.background = background;
    this.fitting = fitting;
    this.title = title;

    this.bind();

    canvas.width = width;
    canvas.height = height;

    Object.assign(root.style, {
      width: `${width}px`,
      height: `${height}px`,
    });

    const rect = root.getBoundingClientRect();
    this.onWindowResize(rect.width, rect.height);
    this.onCanvasResize(gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  bind() {
    context = this.gl;
    this.#applyTitle();
  }

  #title!: string;
  #header: HTMLElement;

  get title() {
    return this.#title;
  }

  set title(value: string) {
    this.#title = value;
    this.#applyTitle();
  }

  #background!: string;

  get background() {
    return this.#background;
  }

  set background(value: string) {
    this.#background = value;
    this.#applyBackground();
  }

  #fitting!: Fitting;

  get fitting() {
    return this.#fitting;
  }

  set fitting(value: Fitting) {
    this.#fitting = value;
    this.#applyFitting();
  }

  #fullscreen!: boolean;

  get fullscreen() {
    return this.#fullscreen;
  }

  set fullscreen(value: boolean) {
    this.#fullscreen = value;
    this.#applyFullscreen();
  }

  #maximized!: boolean;

  get maximized() {
    return this.#maximized;
  }

  set maximized(value: boolean) {
    this.#maximized = value;
    this.#applyMaximized();
  }

  #resizable!: boolean;

  get resizable() {
    return this.#resizable;
  }

  set resizable(value: boolean) {
    this.#resizable = value;
    this.#applyResizable();
  }

  #applyTitle() {
    document.title = this.#title;
    this.#header.textContent = this.#title;
  }

  #applyFitting() {
    this.canvas.style.objectFit = fittingMap[this.#fitting] ?? "none";
  }

  #applyFullscreen() {
    this.root.classList.toggle("fullscreen", this.#fullscreen);
    this.#applyResizable();
  }

  #applyMaximized() {
    this.root.classList.toggle("maximized", this.#maximized);
    this.#applyResizable();
  }

  #applyResizable() {
    this.root.classList.toggle(
      "resizable",
      this.#resizable && !this.#fullscreen && !this.#maximized
    );
  }

  #applyBackground() {
    this.canvas.style.background = this.#background;
  }

  readonly gl: WebGL2RenderingContext;
  readonly canvas: HTMLCanvasElement;
  readonly root: HTMLDivElement;

  async onPreload(): Promise<void> {}

  onInit(): void {}

  onIdle(deadline: IdleDeadline): void {}

  onRender(blending: number, timestamp: number): void {}

  onTick(step: number, runtime: number, tid: number): void {}

  onUpdate(timestamp: number): void {}

  onWindowResize(width: number, height: number): void {}

  onCanvasResize(width: number, height: number): void {}
}

export let context!: WebGL2RenderingContext;

type Fitting =
  | "crop" // none
  | "letterbox" // contain
  | "outside" // cover
  | "stretch" // fill
  | "inside"; // scale-down

const fittingMap = {
  crop: "none",
  letterbox: "contain",
  outside: "cover",
  stretch: "fill",
  inside: "scale-down",
} as const;
