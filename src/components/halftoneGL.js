/*
 * Halftone layer for WireGraph, drawn with WebGL2 so the per-frame work is on the GPU.
 *
 * Pass 1 (density): every point is projected in the vertex shader and drawn as a soft
 * gaussian dot into a small texture with one texel per halftone cell, accumulating
 * density per layer (r = dust, g = incident grain, b = statement grain).
 * Pass 2 (screen): a full-canvas pass reads each cell's density and draws one square in
 * the middle of the cell, sized by that density, layering dust, incidents and statements.
 *
 * The 3D positions are uploaded once; each frame only sends the rotation and focus.
 * Returns null when WebGL2 is unavailable, and the graph then draws without the halftone.
 */

const DENSITY_VS = `#version 300 es
in vec3 aPos;
in vec3 aCenter;
in float aKind;
in float aNode;
uniform vec4 uRot;
uniform vec2 uSize;
uniform float uScale, uCx, uCell, uFocus, uPt;
out float vW;
flat out int vKind;
vec3 project(vec3 p) {
  float x1 = p.x * uRot.x - p.z * uRot.y;
  float z1 = p.x * uRot.y + p.z * uRot.x;
  float y1 = p.y * uRot.z - z1 * uRot.w;
  float z2 = p.y * uRot.w + z1 * uRot.z;
  float s = uScale * 2.4 / (2.4 + z2);
  return vec3(uSize.x * uCx + x1 * s, uSize.y * 0.5 - y1 * s, -z2);
}
void main() {
  vec3 q = project(aPos);
  vec2 grid = ceil(uSize / uCell);
  vec2 t = q.xy / uCell / grid * 2.0 - 1.0;
  gl_Position = vec4(t.x, -t.y, 0.0, 1.0);
  gl_PointSize = uPt;
  if (aKind < 0.5) {
    vW = clamp(0.6 + q.z * 0.6, 0.25, 1.0);
  } else {
    float zc = project(aCenter).z;
    bool dim = uFocus >= 0.0 && abs(aNode - uFocus) > 0.5;
    vW = clamp(0.7 + zc * 0.55, 0.3, 1.0) * (dim ? 0.4 : 1.0);
  }
  vKind = int(aKind + 0.5);
}`

const DENSITY_FS = `#version 300 es
precision highp float;
in float vW;
flat in int vKind;
uniform float uPt, uStore;
out vec4 o;
void main() {
  // Offset of this texel from the point's exact position, in texels.
  vec2 d = (gl_PointCoord - 0.5) * uPt;
  float v = vW * exp(-dot(d, d) / 1.25) * uStore;
  o = vKind == 0 ? vec4(v, 0.0, 0.0, 0.0) : vKind == 1 ? vec4(0.0, v, 0.0, 0.0) : vec4(0.0, 0.0, v, 0.0);
}`

const SCREEN_VS = `#version 300 es
in vec2 aQuad;
void main() { gl_Position = vec4(aQuad, 0.0, 1.0); }`

const SCREEN_FS = `#version 300 es
precision highp float;
uniform sampler2D uDensity;
uniform vec2 uSize;
uniform float uCell, uDpr, uStore;
uniform vec4 uDust, uIncident, uQuote;
out vec4 o;
vec4 acc = vec4(0.0);
void layer(float v, float gain, vec4 color, float m) {
  if (v < 0.08) return;
  float d = min(uCell - 1.0, max(1.0, sqrt(v * gain) * uCell * 0.5));
  d = max(1.0, floor(d * uDpr + 0.5)) / uDpr;
  if (m > d * 0.5) return;
  vec4 c = vec4(color.rgb * color.a, color.a);
  acc = c + acc * (1.0 - c.a);
}
void main() {
  vec2 css = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 cell = floor(css / uCell);
  ivec2 grid = ivec2(ceil(uSize / uCell));
  vec3 v = texelFetch(uDensity, ivec2(int(cell.x), grid.y - 1 - int(cell.y)), 0).rgb / uStore;
  vec2 off = abs(css - (cell + 0.5) * uCell);
  float m = max(off.x, off.y);
  layer(v.r, 0.45, uDust, m);
  layer(v.g, 0.5, uIncident, m);
  layer(v.b, 0.5, uQuote, m);
  o = acc;
}`

function program(gl, vs, fs) {
  const p = gl.createProgram()
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
    gl.attachShader(p, s)
  }
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p))
  return p
}

// Any CSS colour to [r, g, b] in 0–1, via a 1px canvas.
function rgb(css) {
  const c = document.createElement('canvas').getContext('2d')
  c.fillStyle = css
  c.fillRect(0, 0, 1, 1)
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

/**
 * @param canvas the canvas to draw into (sized by the caller)
 * @param points array of { pos: [x,y,z], center: [x,y,z], kind: 0 dust | 1 incident | 2 quote, node }
 * @param colors { dust, incident, quote } as [css colour, alpha]
 * @param cell halftone cell size in CSS px
 */
export function createHalftone(canvas, points, colors, cell) {
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  // Float accumulation where supported; otherwise 8-bit with values stored at a quarter.
  const float = !!gl.getExtension('EXT_color_buffer_float')
  const store = float ? 1 : 0.25

  const density = program(gl, DENSITY_VS, DENSITY_FS)
  const screen = program(gl, SCREEN_VS, SCREEN_FS)

  const data = new Float32Array(points.length * 8)
  points.forEach((p, i) => data.set([...p.pos, ...p.center, p.kind, p.node], i * 8))
  const pointVao = gl.createVertexArray()
  gl.bindVertexArray(pointVao)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
  for (const [name, size, offset] of [['aPos', 3, 0], ['aCenter', 3, 12], ['aKind', 1, 24], ['aNode', 1, 28]]) {
    const loc = gl.getAttribLocation(density, name)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 32, offset)
  }
  const quadVao = gl.createVertexArray()
  gl.bindVertexArray(quadVao)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const quadLoc = gl.getAttribLocation(screen, 'aQuad')
  gl.enableVertexAttribArray(quadLoc)
  gl.vertexAttribPointer(quadLoc, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)

  const u = (p, n) => gl.getUniformLocation(p, n)
  const tint = (name) => {
    const [css, alpha] = colors[name]
    return [...rgb(css), alpha]
  }
  const dustColor = tint('dust')
  const incidentColor = tint('incident')
  const quoteColor = tint('quote')

  let texture = null
  let fbo = null
  let gw = 0
  let gh = 0
  const ensureTarget = (W, H) => {
    const w = Math.ceil(W / cell)
    const h = Math.ceil(H / cell)
    if (w === gw && h === gh && texture) return
    gw = w
    gh = h
    if (texture) gl.deleteTexture(texture)
    if (fbo) gl.deleteFramebuffer(fbo)
    texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, float ? gl.RGBA16F : gl.RGBA8, gw, gh, 0, gl.RGBA,
      float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    fbo = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  }

  return {
    render({ W, H, dpr, rot, scale, cx, focus }) {
      if (!W || !H) return
      ensureTarget(W, H)

      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.viewport(0, 0, gw, gh)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.useProgram(density)
      gl.uniform4fv(u(density, 'uRot'), rot)
      gl.uniform2f(u(density, 'uSize'), W, H)
      gl.uniform1f(u(density, 'uScale'), scale)
      gl.uniform1f(u(density, 'uCx'), cx)
      gl.uniform1f(u(density, 'uCell'), cell)
      gl.uniform1f(u(density, 'uFocus'), focus)
      gl.uniform1f(u(density, 'uPt'), 5)
      gl.uniform1f(u(density, 'uStore'), store)
      gl.bindVertexArray(pointVao)
      gl.drawArrays(gl.POINTS, 0, points.length)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.disable(gl.BLEND)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(screen)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.uniform1i(u(screen, 'uDensity'), 0)
      gl.uniform2f(u(screen, 'uSize'), W, H)
      gl.uniform1f(u(screen, 'uCell'), cell)
      gl.uniform1f(u(screen, 'uDpr'), dpr)
      gl.uniform1f(u(screen, 'uStore'), store)
      gl.uniform4fv(u(screen, 'uDust'), dustColor)
      gl.uniform4fv(u(screen, 'uIncident'), incidentColor)
      gl.uniform4fv(u(screen, 'uQuote'), quoteColor)
      gl.bindVertexArray(quadVao)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.bindVertexArray(null)
    },
  }
}
