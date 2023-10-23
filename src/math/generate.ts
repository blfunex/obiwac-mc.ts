setInterval(() => {}, 0);

class StringBuilder {
  #value: string = "";

  add(value: string) {
    this.#value += value;
  }

  toString() {
    return this.#value;
  }
}

let files: {
  name: string;
  filename: string;
  source: string;
}[] = [];

function generateMatrixCode(width: number, height: number) {
  const name = createMatrixName(width, height);
  const filename = `./${name}.ts`.toLowerCase();
  const builder = new StringBuilder();

  addTupleType(builder, name, [width, height]);
  addTupleType(builder, "Readonly", [width, height], true);
  addCreateFunction(builder, [width, height], "matrix");

  files.push({
    name,
    filename,
    source: builder.toString(),
  });
}

function addCreateFunction(
  builder: StringBuilder,
  size: number | [number, number],
  mode: "matrix" | "vector" | "quaternion"
) {
  const name = mode === "quaternion" ? "quat" : mode.slice(0, 3);
  const width = typeof size === "number" ? size : size[0];
  const height = typeof size === "number" ? size : size[1];
  const count = typeof size === "number" ? size : width * height;
  addFunction(builder, "create", [], (builder) => {
    builder.add(`  const ${name} = new Float32Array(${count});\n  `);
    switch (mode) {
      case "matrix":
        {
          const diagonal = Math.min(width, height);
          for (let i = 0; i < diagonal; i++) {
            builder.add(`${name}[${i * width + i}] = `);
          }
          if (diagonal > 0) {
            builder.add(`1;\n  `);
          }
        }
        break;
      case "vector":
        if (count !== 4) break;
      case "quaternion":
        builder.add(`value[3] = 1;\n  `);
    }
    builder.add(`return ${name};\n`);
  });
}

function addFunction(
  builder: StringBuilder,
  name: string,
  args: string[] | ((builder: StringBuilder) => void),
  body: (builder: StringBuilder) => void
) {
  builder.add(
    `export function ${name}(${
      typeof args === "function" ? args(builder) : args.join(", 1")
    }) {\n`
  );
  body(builder);
  builder.add("}");
}

function addTupleType(
  builder: StringBuilder,
  name: string,
  size: number | [number, number],
  readonly = false
) {
  const width = typeof size === "number" ? size : size[0];
  const height = typeof size === "number" ? size : size[1];
  const count = typeof size === "number" ? size : width * height;
  const vector = typeof size === "number" ? true : false;

  builder.add(`export type ${name} = ${readonly ? "readonly " : ""}[\n`);

  if (vector) {
    const components = ["x", "y", "z", "w"].slice(0, count);
    const values = components.map((c) => `${c}:number`);
    const tuple = components.join(", ");
    builder.add(`  ${tuple}`);
  } else {
    for (let y = 0; y < height; y++) {
      const row = "number, ".repeat(width).trim();
      builder.add(`  ${row}\n`);
    }
  }
  builder.add("] | Float32Array;\n");
}

function createMatrixName(width: number, height: number) {
  if (width === height) {
    return `Mat${width}`;
  }

  return `Mat${width}x${height}`;
}

generateMatrixCode(4, 4);

const { writeFileSync } = require("fs");
const { join } = require("path");
const p = require("../../package.json");

const index = new StringBuilder();

for (const { name, filename, source } of files) {
  const path = join(__dirname, filename);
  const module = name.toLowerCase();
  index.add(`import * as ${module} from "${removeExt(filename)}";\n`);
  index.add(`export type ${name} = ${module}.${name};\n`);
  index.add(`export const ${name} = ${module};\n`);
  writeFileSync(path, addHeader(source));
}

writeFileSync(join(__dirname, "./index.ts"), addHeader(index.toString()));

function removeExt(path: string) {
  return path.slice(0, path.lastIndexOf("."));
}

function addHeader(code: string) {
  const date = new Date();
  return `// Auto-genrated for ${p.name} v${p.version}
// Do not edit this file manually!
// Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
${code}
`;
}