/**
 * Relief 3D du portrait (WebGL) : parallaxe, lumière qui suit le doigt et onde au toucher.
 * Sans WebGL, le composant affiche simplement l'image.
 */
const VERTEX = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';

const FRAGMENT = `precision highp float;
uniform sampler2D T;uniform vec2 R,IS,L,tilt;uniform float t,fl,zm;uniform vec3 lc,rp;varying vec2 v;
float Y(vec2 u){return dot(texture2D(T,u).rgb,vec3(.299,.587,.114));}
vec2 img(vec2 s){float ca=R.x/R.y,ia=IS.x/IS.y;vec2 f=ca>ia?vec2(1.,ia/ca):vec2(ca/ia,1.);vec2 o=(1.-f)*vec2(.48,.42);return o+((s-.5)/zm+.5)*f;}
void main(){
  float ca=R.x/R.y;vec2 s=vec2(v.x,1.-v.y);
  vec2 q=s-rp.xy;float dd=length(q*vec2(ca,1.)),ag=rp.z*.7;
  s+=normalize(q+1e-4)*sin((dd-ag)*42.)*exp(-abs(dd-ag)*9.)*.012*(1.-rp.z)*step(rp.z,.999);
  vec2 u=img(s),px=1./IS;
  float d=(Y(u)+Y(u+px*8.)+Y(u-px*8.)+Y(u+px*vec2(8.,-8.))+Y(u+px*vec2(-8.,8.)))/5.;
  float mk=1.-smoothstep(.15,.75,length((s-vec2(.46,.5))*vec2(1.,1.1)));
  float dp=mix(d,mk,.45);
  u+=tilt*(dp-.45)*vec2(.05,.036);
  vec3 c=texture2D(T,u).rgb;
  vec2 e=px*1.6;float hx=Y(u+vec2(e.x,0.))-Y(u-vec2(e.x,0.)),hy=Y(u+vec2(0.,e.y))-Y(u-vec2(0.,e.y));
  float rw=.2+.8*smoothstep(.1,.7,mk);vec3 n=normalize(vec3(-hx*2.6*rw,-hy*2.6*rw,1.));
  vec3 ld=vec3((L.x-s.x)*ca,L.y-s.y,.3);float att=1./(1.+4.*dot(ld.xy,ld.xy));ld=normalize(ld);
  float dif=max(dot(n,ld),0.),sp=pow(max(dot(n,normalize(ld+vec3(0.,0.,1.))),0.),26.);
  c*=.86+.34*dif*(.55+.45*att);
  c+=lc*sp*att*rw*(.4+.9*fl);c+=lc*.14*att*(1.+fl*1.2);
  c*=1.-.35*smoothstep(.45,.95,length((s-.5)*vec2(1.,1.1)));
  gl_FragColor=vec4(c,1.);}`;

interface Texture {
  tex: WebGLTexture;
  w: number;
  h: number;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export class DragonRelief {
  private gl: WebGLRenderingContext;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private textures = new Map<string, Texture>();
  private current: Texture | null = null;
  private wanted = '';
  private raf = 0;
  private lastFrame = 0;
  private zoom = 1;
  private lightColor: [number, number, number] = [1, 0.6, 0.3];
  private light = [0.5, 0.4];
  private lightTarget = [0.5, 0.4];
  private tilt = [0, 0];
  private tiltTarget = [0, 0];
  private lastPointer = -9e9;
  private flash = 0;
  private ripple = [0.5, 0.5, 9e3];

  /**
   * Crée le rendu, ou renvoie null si WebGL est indisponible.
   * `onLost` est appelé si le navigateur retire le contexte (GPU saturé, onglet en veille…).
   */
  static create(canvas: HTMLCanvasElement, onLost: () => void): DragonRelief | null {
    try {
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
      if (!gl || gl.isContextLost()) return null;
      return new DragonRelief(canvas, gl, onLost);
    } catch {
      return null;
    }
  }

  private constructor(
    private canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    private onLost: () => void
  ) {
    this.gl = gl;
    canvas.addEventListener('webglcontextlost', this.handleLost);
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const n of ['T', 'R', 'IS', 'L', 'tilt', 't', 'fl', 'zm', 'lc', 'rp']) this.uniforms[n] = gl.getUniformLocation(program, n);
    this.raf = requestAnimationFrame(this.frame);
  }

  setArt(url: string, stage: number, light: [number, number, number]): void {
    this.wanted = url;
    this.zoom = [1, 1.005, 1.01, 1.015, 1.02, 1.025][stage] ?? 1;
    this.lightColor = light;
    const cached = this.textures.get(url);
    if (cached) {
      this.current = cached;
      return;
    }
    const img = new Image();
    img.onload = () => {
      const gl = this.gl;
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const t = { tex, w: img.naturalWidth, h: img.naturalHeight };
      this.textures.set(url, t);
      if (this.wanted === url) this.current = t;
    };
    img.src = url;
  }

  /** Position relative (0–1) du pointeur sur le portrait. */
  pointer(x: number, y: number): void {
    this.lightTarget = [x, y];
    this.tiltTarget = [(x - 0.5) * 2, (y - 0.5) * 2];
    this.lastPointer = performance.now();
  }

  tap(x: number, y: number): void {
    this.pointer(x, y);
    this.flash = 1;
    this.ripple = [x, y, performance.now() / 1000];
  }

  private frame = (ms: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (ms - this.lastFrame < 32 || document.hidden || !this.current) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    this.lastFrame = ms;
    const gl = this.gl;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (w && (this.canvas.width !== w || this.canvas.height !== h)) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    const t = ms / 1000;
    // Sans interaction, la lumière se promène doucement.
    if (ms - this.lastPointer > 3000) {
      this.lightTarget = [0.5 + 0.34 * Math.sin(t * 0.7), 0.38 + 0.24 * Math.sin(t * 0.9 + 1)];
      this.tiltTarget = [Math.sin(t * 0.5) * 0.45, Math.cos(t * 0.4) * 0.3];
    }
    for (const i of [0, 1]) {
      this.light[i] = lerp(this.light[i], this.lightTarget[i], 0.12);
      this.tilt[i] = lerp(this.tilt[i], this.tiltTarget[i], 0.08);
    }
    this.flash *= 0.93;
    const u = this.uniforms;
    gl.uniform1i(u.T, 0);
    gl.uniform2f(u.R, this.canvas.width, this.canvas.height);
    gl.uniform2f(u.IS, this.current.w, this.current.h);
    gl.uniform2f(u.L, this.light[0], this.light[1]);
    gl.uniform2f(u.tilt, this.tilt[0], this.tilt[1]);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.fl, this.flash);
    gl.uniform1f(u.zm, this.zoom * (1 + 0.012 * this.flash));
    gl.uniform3f(u.lc, ...this.lightColor);
    gl.uniform3f(u.rp, this.ripple[0], this.ripple[1], Math.min(1, Math.max(0, t - this.ripple[2]) / 0.9));
    gl.bindTexture(gl.TEXTURE_2D, this.current.tex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  private handleLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    this.onLost();
  };

  destroy(): void {
    this.canvas.removeEventListener('webglcontextlost', this.handleLost);
    cancelAnimationFrame(this.raf);
    if (this.gl.isContextLost()) return;
    for (const t of this.textures.values()) this.gl.deleteTexture(t.tex);
    this.textures.clear();
  }
}
