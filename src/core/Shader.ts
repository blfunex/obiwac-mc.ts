/// <reference path="./Shader.d.ts" />

const DEFAULT_VERTEX =
  "#version 300 es\nin vec4 a_position;void main(){gl_Position=a_position;}";

const DEFAULT_FRAGMENT =
  "#version 300 es\nprecision mediump float;out vec4 out_color;void main(){out_color=vec4(1.0);}";

export default class Shader {
  static gl: WebGL2RenderingContext;

  constructor(vert: string, frag: string) {
    this.program = createProgram(vert, frag);
  }

  static use(shader: Shader | null) {
    this.gl.useProgram(shader?.program ?? Shader.default.program);
  }

  private program: WebGLProgram;

  static get default() {
    return (this.#shader ??= this.#createDefaultShader());
  }

  static #shader: Shader | null = null;

  static #createDefaultShader() {
    return new Shader(DEFAULT_VERTEX, DEFAULT_FRAGMENT);
  }
}

export class ShaderError extends SyntaxError {
  constructor(
    operation: string,
    type: "vertex" | "fragment" | "program",
    log: string | null
  ) {
    const kind = type === "program" ? "program" : `${type} shader`;
    super(`Failed to complete ${operation} on ${kind}: ${log}`);
  }
}

function createShader(type: number, source: string) {
  const gl = Shader.gl;
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)!;
    gl.deleteShader(shader);
    throw new ShaderError(
      "compilation",
      type === gl.VERTEX_SHADER ? "vertex" : "fragment",
      log
    );
  }
  return shader;
}

function createProgram(vert: string, frag: string) {
  const gl = Shader.gl;
  const program = gl.createProgram()!;
  let vs: WebGLShader | null = null;
  let fs: WebGLShader | null = null;
  try {
    vs = createShader(gl.VERTEX_SHADER, vert);
    fs = createShader(gl.FRAGMENT_SHADER, frag);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program)!;
      gl.deleteProgram(program);
      throw new ShaderError("linking", "program", log);
    }
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    return program;
  } finally {
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  }
}
