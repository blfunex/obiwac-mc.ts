import Window from "../core/Window";
import vert from "./vert.glsl";
import frag from "./frag.glsl";
import Shader from "../core/Shader";

const vertex_positions = [
  -0.5, 0.5, 1.0, -0.5, -0.5, 1.0, 0.5, -0.5, 1.0, 0.5, 0.5, 1.0,
];

const indices = [0, 1, 2, 0, 2, 3];

export default class GameWindow extends Window {
  vao!: WebGLVertexArrayObject;
  vbo!: WebGLBuffer;
  ibo!: WebGLBuffer;

  shader!: Shader;

  onInit(): void {
    this.vao = this.gl.createVertexArray()!;
    this.gl.bindVertexArray(this.vao);

    this.vbo = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array(vertex_positions),
      this.gl.STATIC_DRAW
    );

    this.ibo = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    this.gl.bufferData(
      this.gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      this.gl.STATIC_DRAW
    );

    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(0);

    this.shader = new Shader(vert, frag);
  }

  onRender(): void {
    Shader.use(this.shader);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
  }

  onCanvasResize(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height);
  }

  onWindowResize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
