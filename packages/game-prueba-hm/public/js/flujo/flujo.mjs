/**
 * flujo/flujo.mjs — W-FLUJO · demo «Prueba-H-M» (El Descenso)
 * ---------------------------------------------------------------------------
 * Efectos de flujo de la ceremonia, con THREE puro (BufferGeometry / Points /
 * Line2 de addons cuando está disponible). Sin dependencias nuevas, sin build,
 * sin postprocesado.
 *
 *   gota(desde, hasta)     curva Ónfalo → estación con puntos brillantes
 *   cristalLinea(pos)      cristal de línea que crece con easing elástico
 *   llaveDesciende(hasta)  llave-lease dorada que baja del cielo
 *   actaAsciende(desde)    acta-pergamino que sube hasta perderse
 *   cremallera(step, side) cadenas oro/verdigrís engarzándose en un muro
 *
 * Todo respeta `prefers-reduced-motion` y la paleta del scriptorium.
 */

/** Paleta única de la demo (sRGB). */
export const PALETA = Object.freeze({
	sepia: 0x131008,
	tinta: 0xeae0c8,
	oro: 0xe7b14c,
	verdigris: 0x85baa9,
	violeta: 0xac97ce,
	ok: 0x8fbf7f,
	fallo: 0xdb7a5d,
});

/* ─────────────────────────── easings ─────────────────────────── */

const EASE = {
	lineal: (p) => p,
	entradaCuad: (p) => p * p,
	salidaCubica: (p) => 1 - Math.pow(1 - p, 3),
	salidaQuinta: (p) => 1 - Math.pow(1 - p, 5),
	suaveCubica: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
	suaveSeno: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
	salidaAtras: (p) => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
	},
	salidaElastica: (p) => {
		const c4 = (2 * Math.PI) / 3;
		if (p <= 0) return 0;
		if (p >= 1) return 1;
		return Math.pow(2, -9 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
	},
	/** Despegue suave y luego ascenso creciente (para el acta). */
	ascenso: (p) =>
		p < 0.28
			? (1 - Math.pow(1 - p / 0.28, 3)) * 0.16
			: 0.16 + Math.pow((p - 0.28) / 0.72, 2.1) * 0.84,
};

/* ───────────────────── addons: Line2 opcional ───────────────────── */

let _addons = null;
let _addonsProm = null;

function cargarAddons() {
	if (_addonsProm) return _addonsProm;
	_addonsProm = Promise.all([
		import('three/addons/lines/Line2.js'),
		import('three/addons/lines/LineGeometry.js'),
		import('three/addons/lines/LineMaterial.js'),
	])
		.then(([a, b, c]) => {
			_addons = { Line2: a.Line2, LineGeometry: b.LineGeometry, LineMaterial: c.LineMaterial };
			return _addons;
		})
		.catch(() => {
			_addons = null;
			return null;
		});
	return _addonsProm;
}

/* ───────────────────────── shaders mínimos ───────────────────────── */

const VS_PUNTOS = `
	uniform float uEscala;
	attribute float aTam;
	attribute float aAlfa;
	varying float vAlfa;
	void main() {
		vAlfa = aAlfa;
		vec4 mv = modelViewMatrix * vec4( position, 1.0 );
		gl_PointSize = clamp( aTam * uEscala / max( 0.001, -mv.z ), 1.0, 96.0 );
		gl_Position = projectionMatrix * mv;
	}
`;

const FS_PUNTOS = `
	uniform vec3 uColor;
	uniform float uOpacidad;
	varying float vAlfa;
	void main() {
		float d = length( gl_PointCoord - vec2( 0.5 ) );
		float nucleo = smoothstep( 0.5, 0.0, d );
		float a = pow( nucleo, 2.0 ) * vAlfa * uOpacidad;
		if ( a < 0.004 ) discard;
		gl_FragColor = vec4( uColor * ( 0.55 + 0.9 * vAlfa ), a );
		#include <colorspace_fragment>
	}
`;

const VS_HALO = `
	uniform float uTam;
	varying vec2 vUv;
	void main() {
		vUv = uv;
		vec4 mv = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
		mv.xy += position.xy * uTam;
		gl_Position = projectionMatrix * mv;
	}
`;

const FS_HALO = `
	uniform vec3 uColor;
	uniform float uOpacidad;
	varying vec2 vUv;
	void main() {
		float d = length( vUv - vec2( 0.5 ) ) * 2.0;
		float halo = smoothstep( 1.0, 0.0, d );
		float a = pow( halo, 2.6 ) * uOpacidad;
		if ( a < 0.004 ) discard;
		gl_FragColor = vec4( uColor, a );
		#include <colorspace_fragment>
	}
`;

/* ══════════════════════════════ fábrica ══════════════════════════════ */

/**
 * @param {object} cfg
 * @param {import('three').Object3D} cfg.scene  escena (o grupo) donde colgar el flujo
 * @param {typeof import('three')} cfg.THREE    módulo three (import map)
 * @param {object} [cfg.barrio]                 API de barrio.mjs (para anclas por id)
 * @param {object} [cfg.opciones]               ajustes finos (ver más abajo)
 */
export function createFlujo({ scene, THREE, barrio = null, opciones = {} } = {}) {
	if (!THREE) throw new Error('createFlujo: falta THREE');

	const REDUCIDO =
		opciones.reducido ??
		(typeof window !== 'undefined' &&
			typeof window.matchMedia === 'function' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches);
	const K = REDUCIDO ? 0.12 : 1; // escala global de duraciones

	const grupo = new THREE.Group();
	grupo.name = 'flujo';
	grupo.renderOrder = 2;
	if (scene && typeof scene.add === 'function') scene.add(grupo);

	/* ── recursos compartidos ── */
	const compartidos = new Set();
	const marcar = (r) => {
		if (r) {
			compartidos.add(r);
			r.userData = r.userData || {};
			r.userData.compartido = true;
		}
		return r;
	};

	const uEscala = { value: 460 };
	const geoHalo = marcar(new THREE.PlaneGeometry(1, 1));
	const geoAnillo = marcar(new THREE.RingGeometry(0.62, 0.78, 56, 1));
	const texActa = marcar(crearTexturaActa(THREE));

	const res = new THREE.Vector2(1280, 720);
	if (typeof window !== 'undefined') {
		res.set(window.innerWidth || 1280, window.innerHeight || 720);
		uEscala.value = Math.max(240, (window.innerHeight || 720) * 0.62);
	}
	const materialesLinea = new Set();

	/* ── animador ── */
	const anims = new Set();
	const vivos = new Set();
	let reloj = 0;
	let raf = 0;
	let ultimo = 0;
	let externo = false;
	let activo = true;

	function animar({ dur = 1, retardo = 0, ease = EASE.suaveCubica, paso: onPaso, fin: onFin }) {
		// Tras `dispose()` nadie debe quedarse esperando: se salta al estado final.
		if (!activo) {
			try {
				if (onPaso) onPaso(1, 1);
				if (onFin) onFin();
			} catch (e) {
				/* ignorado */
			}
			return Promise.resolve();
		}
		return new Promise((resolver) => {
			const a = {
				t: -Math.max(0, retardo) * K,
				dur: Math.max(0.0001, dur * K),
				ease,
				onPaso,
				onFin,
				resolver,
			};
			anims.add(a);
		});
	}

	function latir(fn) {
		const h = { fn };
		vivos.add(h);
		return () => vivos.delete(h);
	}

	function tic(dt) {
		if (!activo) return;
		reloj += dt;
		for (const a of Array.from(anims)) {
			a.t += dt;
			if (a.t < 0) continue;
			const bruto = Math.min(1, a.t / a.dur);
			try {
				if (a.onPaso) a.onPaso(a.ease(bruto), bruto);
			} catch (e) {
				/* un efecto roto no debe romper la ceremonia */
			}
			if (bruto >= 1) {
				anims.delete(a);
				try {
					if (a.onFin) a.onFin();
				} catch (e) {
					/* idem */
				}
				a.resolver();
			}
		}
		if (!REDUCIDO) {
			for (const h of Array.from(vivos)) {
				try {
					h.fn(reloj, dt);
				} catch (e) {
					/* idem */
				}
			}
		}
	}

	function bucle(t) {
		raf = requestAnimationFrame(bucle);
		const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 1 / 60;
		ultimo = t;
		tic(dt);
	}
	if (typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(bucle);

	/** El integrador puede llevar el tiempo él mismo; al primer `update` el
	 *  bucle interno se apaga solo. Acepta segundos o milisegundos. */
	function update(dt) {
		if (!externo) {
			externo = true;
			if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
			raf = 0;
		}
		let d = typeof dt === 'number' && isFinite(dt) && dt > 0 ? dt : 1 / 60;
		if (d > 1) d /= 1000;
		tic(Math.min(0.05, d));
	}

	function setResolucion(ancho, alto) {
		res.set(Math.max(1, ancho | 0), Math.max(1, alto | 0));
		uEscala.value = Math.max(240, res.y * 0.62);
		for (const m of materialesLinea) if (m.resolution) m.resolution.set(res.x, res.y);
	}
	const alRedimensionar = () => {
		if (typeof window !== 'undefined') setResolucion(window.innerWidth, window.innerHeight);
	};
	if (typeof window !== 'undefined') window.addEventListener('resize', alRedimensionar);

	/* ── utilidades ── */

	const v3 = (v, porDefecto) => {
		if (v && typeof v === 'object' && typeof v.x === 'number')
			return new THREE.Vector3(v.x, v.y ?? 0, v.z ?? 0);
		if (Array.isArray(v)) return new THREE.Vector3(v[0] || 0, v[1] || 0, v[2] || 0);
		if (typeof v === 'string' && barrio && typeof barrio.unitAnchor === 'function') {
			const a = barrio.unitAnchor(v);
			if (a) return new THREE.Vector3(a.x, a.y, a.z);
		}
		return porDefecto ? porDefecto.clone() : new THREE.Vector3();
	};

	const col = (c) => (c instanceof THREE.Color ? c.clone() : new THREE.Color(c));

	/** Baja un objeto y libera sus recursos no compartidos. */
	function purgar(raiz) {
		if (!raiz) return;
		raiz.traverse((o) => {
			if (o.geometry && !o.geometry.userData?.compartido) o.geometry.dispose();
			const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
			for (const m of mats) {
				if (m.userData?.compartido) continue;
				if (m.map && !m.map.userData?.compartido) m.map.dispose();
				materialesLinea.delete(m);
				m.dispose();
			}
		});
		if (raiz.parent) raiz.parent.remove(raiz);
	}

	/* ── luces de acento ──
	 * Pool fijo creado una sola vez y SIEMPRE visible (intensidad 0 cuando está
	 * libre): añadir o esconder luces en marcha recompilaría los shaders de toda
	 * la escena y produciría tirones en mitad de la ceremonia. */
	const INT_LUZ = opciones.intensidadLuz ?? 3.4;
	const luces = [];
	if (opciones.luces !== false) {
		for (let i = 0; i < 2; i++) {
			const l = new THREE.PointLight(PALETA.tinta, 0, 16, 2);
			grupo.add(l);
			luces.push({ luz: l, libre: true });
		}
	}
	function pedirLuz(color) {
		const s = luces.find((x) => x.libre);
		if (!s) return null;
		s.libre = false;
		s.luz.color.set(col(color));
		s.luz.intensity = 0;
		return {
			luz: s.luz,
			soltar() {
				s.luz.intensity = 0;
				s.libre = true;
			},
		};
	}

	/* ── cúmulo de puntos brillantes ── */
	function crearCumulo(n, color) {
		const geo = new THREE.BufferGeometry();
		const pos = new Float32Array(n * 3);
		const tam = new Float32Array(n);
		const alfa = new Float32Array(n);
		const aPos = new THREE.BufferAttribute(pos, 3);
		const aAlfa = new THREE.BufferAttribute(alfa, 1);
		if (THREE.DynamicDrawUsage) {
			aPos.setUsage(THREE.DynamicDrawUsage);
			aAlfa.setUsage(THREE.DynamicDrawUsage);
		}
		geo.setAttribute('position', aPos);
		geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
		geo.setAttribute('aAlfa', aAlfa);
		const mat = new THREE.ShaderMaterial({
			uniforms: {
				uColor: { value: col(color) },
				uOpacidad: { value: 1 },
				uEscala,
			},
			vertexShader: VS_PUNTOS,
			fragmentShader: FS_PUNTOS,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});
		const pts = new THREE.Points(geo, mat);
		pts.frustumCulled = false;
		pts.renderOrder = 6;
		return { pts, geo, mat, pos, tam, alfa, n };
	}

	/** Estallido breve de chispas en una posición. */
	function chispas(centro, color, n = 22, radio = 0.9, dur = 0.85) {
		const c = crearCumulo(n, color);
		const dir = [];
		for (let i = 0; i < n; i++) {
			const t = Math.random() * Math.PI * 2;
			const f = Math.acos(2 * Math.random() - 1);
			dir.push(
				new THREE.Vector3(
					Math.sin(f) * Math.cos(t),
					Math.abs(Math.cos(f)) * 0.85 + 0.25,
					Math.sin(f) * Math.sin(t)
				).multiplyScalar(radio * (0.45 + Math.random() * 0.9))
			);
			c.tam[i] = 0.1 + Math.random() * 0.14;
		}
		c.geo.attributes.aTam.needsUpdate = true;
		c.pts.position.copy(centro);
		grupo.add(c.pts);
		return animar({
			dur,
			ease: EASE.salidaCubica,
			paso: (e) => {
				for (let i = 0; i < n; i++) {
					c.pos[i * 3] = dir[i].x * e;
					c.pos[i * 3 + 1] = dir[i].y * e - 0.55 * e * e * radio;
					c.pos[i * 3 + 2] = dir[i].z * e;
					c.alfa[i] = Math.max(0, 1 - e) * (0.55 + 0.45 * Math.sin(i * 1.7));
				}
				c.geo.attributes.position.needsUpdate = true;
				c.geo.attributes.aAlfa.needsUpdate = true;
			},
			fin: () => purgar(c.pts),
		});
	}

	/** Halo billboard aditivo. */
	function crearHalo(color, tam = 1) {
		const mat = new THREE.ShaderMaterial({
			uniforms: { uColor: { value: col(color) }, uOpacidad: { value: 0 }, uTam: { value: tam } },
			vertexShader: VS_HALO,
			fragmentShader: FS_HALO,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});
		const m = new THREE.Mesh(geoHalo, mat);
		m.frustumCulled = false;
		m.renderOrder = 5;
		return m;
	}

	/** Anillo de destello horizontal. */
	function destelloAnillo(centro, color, dur = 0.9, escalaMax = 3.4) {
		const mat = new THREE.MeshBasicMaterial({
			color: col(color),
			transparent: true,
			opacity: 0.85,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending,
		});
		const m = new THREE.Mesh(geoAnillo, mat);
		m.rotation.x = -Math.PI / 2;
		m.position.copy(centro);
		m.renderOrder = 5;
		grupo.add(m);
		return animar({
			dur,
			ease: EASE.salidaQuinta,
			paso: (e) => {
				const s = 0.18 + e * escalaMax;
				m.scale.set(s, s, s);
				mat.opacity = 0.85 * (1 - e) * (1 - e);
			},
			fin: () => purgar(m),
		});
	}

	/**
	 * Estela sobre una polilínea, revelable de 0 a 1.
	 * Usa Line2 (grosor real en unidades de mundo) si los addons cargaron.
	 */
	function crearEstela(puntos, color, grosor = 0.045) {
		let largo = 0;
		for (let i = 1; i < puntos.length; i++) largo += puntos[i].distanceTo(puntos[i - 1]);

		if (_addons) {
			const { Line2, LineGeometry, LineMaterial } = _addons;
			const plano = [];
			for (const p of puntos) plano.push(p.x, p.y, p.z);
			const geo = new LineGeometry();
			geo.setPositions(plano);
			const mat = new LineMaterial({
				color: col(color),
				linewidth: grosor,
				worldUnits: true,
				dashed: true,
				transparent: true,
				opacity: 0,
				depthWrite: false,
			});
			mat.resolution.set(res.x, res.y);
			mat.dashOffset = 0;
			mat.dashScale = 1;
			mat.dashSize = 0.0001;
			mat.gapSize = largo * 8 + 100;
			materialesLinea.add(mat);
			const linea = new Line2(geo, mat);
			linea.computeLineDistances();
			linea.frustumCulled = false;
			linea.renderOrder = 4;
			return {
				obj: linea,
				revelar: (r) => {
					mat.dashSize = Math.max(0.0001, r * largo);
				},
				opacidad: (o) => {
					mat.opacity = o;
				},
			};
		}

		// Reserva: línea fina de un píxel con revelado por drawRange.
		const geo = new THREE.BufferGeometry().setFromPoints(puntos);
		const mat = new THREE.LineBasicMaterial({
			color: col(color),
			transparent: true,
			opacity: 0,
			depthWrite: false,
		});
		const linea = new THREE.Line(geo, mat);
		linea.frustumCulled = false;
		linea.renderOrder = 4;
		geo.setDrawRange(0, 2);
		return {
			obj: linea,
			revelar: (r) => geo.setDrawRange(0, Math.max(2, Math.round(r * puntos.length))),
			opacidad: (o) => {
				mat.opacity = o;
			},
		};
	}

	/* ══════════════════ 1 · gotas Ónfalo → estación ══════════════════ */

	/**
	 * Gota de análisis: curva desde el Ónfalo hasta la estación, recorrida por
	 * un rosario de puntos brillantes sobre una estela que se revela.
	 * @returns {Promise<void>}
	 */
	function gota(desde, hasta, cfg = {}) {
		const a = v3(desde, new THREE.Vector3(0, 0.8, 0));
		const b = v3(hasta, new THREE.Vector3(0, 0.8, 0));
		const color = cfg.color ?? PALETA.verdigris;
		const dur = cfg.duracion ?? 1.55;
		const n = REDUCIDO ? 8 : cfg.particulas ?? 30;

		const d = a.distanceTo(b);
		const medio = a.clone().add(b).multiplyScalar(0.5);
		const lateral = new THREE.Vector3(b.z - a.z, 0, a.x - b.x);
		if (lateral.lengthSq() < 1e-6) lateral.set(1, 0, 0);
		lateral.normalize().multiplyScalar(d * 0.16 * (cfg.desvio ?? 1));
		const control = medio
			.clone()
			.add(lateral)
			.add(new THREE.Vector3(0, d * 0.42 + 1.1, 0));
		const curva = new THREE.QuadraticBezierCurve3(a, control, b);
		const muestras = curva.getPoints(72);

		const estela = crearEstela(muestras, color, cfg.grosor ?? 0.04);
		grupo.add(estela.obj);

		const c = crearCumulo(n, color);
		grupo.add(c.pts);
		const desfase = [];
		for (let i = 0; i < n; i++) {
			desfase.push(i / n);
			c.tam[i] = 0.075 + (i === 0 ? 0.12 : Math.random() * 0.07);
		}
		c.geo.attributes.aTam.needsUpdate = true;

		const cola = 0.22;
		return animar({
			dur,
			ease: EASE.suaveCubica,
			paso: (e, bruto) => {
				estela.revelar(Math.min(1, e * 1.06));
				estela.opacidad(0.55 * Math.sin(Math.PI * Math.min(1, bruto * 1.02)) + 0.08 * (1 - bruto));
				for (let i = 0; i < n; i++) {
					const u = e - desfase[i] * cola;
					const dentro = u > 0 && u <= 1;
					const p = curva.getPointAt(Math.min(1, Math.max(0, u)));
					const w = reloj * 2.2 + i * 1.9;
					c.pos[i * 3] = p.x + Math.sin(w) * 0.035;
					c.pos[i * 3 + 1] = p.y + Math.cos(w * 1.3) * 0.035;
					c.pos[i * 3 + 2] = p.z + Math.sin(w * 0.8) * 0.035;
					const borde = dentro ? Math.min(1, u * 12) * Math.min(1, (1 - u) * 6 + 0.25) : 0;
					c.alfa[i] = borde * (i === 0 ? 1 : 0.35 + 0.55 * (1 - desfase[i]));
				}
				c.geo.attributes.position.needsUpdate = true;
				c.geo.attributes.aAlfa.needsUpdate = true;
			},
			fin: () => {
				purgar(c.pts);
				animar({
					dur: 0.55,
					ease: EASE.entradaCuad,
					paso: (e) => estela.opacidad(0.5 * (1 - e)),
					fin: () => purgar(estela.obj),
				});
				if (!REDUCIDO) chispas(b, color, 10, 0.42, 0.6);
			},
		});
	}

	/* ══════════════════ 2 · cristal de línea ══════════════════ */

	/**
	 * Cristal que materializa una línea del grafo: crece con easing elástico.
	 * @returns {import('three').Mesh} el cristal (con `userData.flujo.disolver()`)
	 */
	function cristalLinea(pos, cfg = {}) {
		const p = v3(pos, new THREE.Vector3());
		const alto = cfg.alto ?? 1.15;
		const radio = cfg.radio ?? 0.3;
		const tinte = cfg.color ?? PALETA.verdigris;

		const mat = new THREE.MeshStandardMaterial({
			color: col(PALETA.tinta),
			emissive: col(tinte),
			emissiveIntensity: 0.0,
			metalness: 0.15,
			roughness: 0.14,
			transparent: true,
			opacity: 0,
			depthWrite: false,
			flatShading: true,
			side: THREE.DoubleSide,
		});

		const gCuerpo = new THREE.CylinderGeometry(radio, radio * 0.94, alto * 0.66, 6, 1, true);
		gCuerpo.translate(0, alto * 0.33, 0);
		const cristal = new THREE.Mesh(gCuerpo, mat);
		cristal.name = 'cristal-linea';
		cristal.renderOrder = 3;

		const gPunta = new THREE.ConeGeometry(radio, alto * 0.4, 6, 1);
		gPunta.translate(0, alto * 0.86, 0);
		cristal.add(new THREE.Mesh(gPunta, mat));

		const gBase = new THREE.ConeGeometry(radio * 0.94, alto * 0.2, 6, 1);
		gBase.rotateX(Math.PI);
		gBase.translate(0, alto * 0.1, 0);
		cristal.add(new THREE.Mesh(gBase, mat));

		const aristas = new THREE.LineSegments(
			new THREE.EdgesGeometry(gCuerpo, 8),
			new THREE.LineBasicMaterial({
				color: col(tinte),
				transparent: true,
				opacity: 0,
				depthWrite: false,
			})
		);
		cristal.add(aristas);

		const halo = crearHalo(tinte, alto * 1.5);
		halo.position.y = alto * 0.5;
		cristal.add(halo);

		cristal.position.copy(p);
		cristal.rotation.y = cfg.giro ?? Math.random() * Math.PI;
		cristal.scale.set(0.02, 0.001, 0.02);
		grupo.add(cristal);

		const foco = pedirLuz(tinte);
		if (foco) foco.luz.position.copy(p).add(new THREE.Vector3(0, alto * 0.6, 0));

		destelloAnillo(p, tinte, 1.1, 2.1);

		const nacer = Promise.all([
			animar({
				dur: 1.35,
				ease: EASE.salidaElastica,
				paso: (e) => {
					cristal.scale.y = Math.max(0.001, e);
				},
			}),
			animar({
				dur: 0.95,
				ease: EASE.salidaAtras,
				paso: (e) => {
					cristal.scale.x = cristal.scale.z = Math.max(0.02, e);
				},
			}),
			animar({
				dur: 0.8,
				ease: EASE.salidaCubica,
				paso: (e) => {
					mat.opacity = 0.72 * e;
					mat.emissiveIntensity = 0.42 * e;
					aristas.material.opacity = 0.5 * e;
					halo.material.uniforms.uOpacidad.value = 0.3 * e;
					if (foco) foco.luz.intensity = INT_LUZ * e;
				},
			}),
		]);

		const base = p.y;
		const quitarLatido = latir((t) => {
			cristal.rotation.y += 0.0042;
			const s = Math.sin(t * 1.35 + p.x);
			mat.emissiveIntensity = 0.42 + s * 0.13;
			halo.material.uniforms.uOpacidad.value = 0.3 + s * 0.09;
			cristal.position.y = base + Math.sin(t * 0.9 + p.z) * 0.028;
			if (foco) foco.luz.intensity = INT_LUZ * (1 + s * 0.22);
		});

		cristal.userData.flujo = {
			nacer,
			/** Disuelve el cristal y libera sus recursos. */
			disolver(dur = 0.7) {
				quitarLatido();
				return animar({
					dur,
					ease: EASE.entradaCuad,
					paso: (e) => {
						mat.opacity = 0.72 * (1 - e);
						mat.emissiveIntensity = 0.42 * (1 - e);
						aristas.material.opacity = 0.5 * (1 - e);
						halo.material.uniforms.uOpacidad.value = 0.3 * (1 - e);
						cristal.scale.y = Math.max(0.001, 1 - e * 0.35);
						if (foco) foco.luz.intensity = INT_LUZ * (1 - e);
					},
					fin: () => {
						if (foco) foco.soltar();
						purgar(cristal);
					},
				});
			},
		};

		return cristal;
	}

	/* ══════════════════ 3 · llave-lease que desciende ══════════════════ */

	function construirLlave() {
		const oro = new THREE.MeshStandardMaterial({
			color: col(PALETA.oro),
			emissive: col(PALETA.oro),
			emissiveIntensity: 0.22,
			metalness: 0.88,
			roughness: 0.26,
		});
		const llave = new THREE.Group();
		llave.name = 'llave-lease';

		const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.048, 10, 26), oro);
		anillo.position.y = 0.4;
		llave.add(anillo);

		const cana = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.62, 10), oro);
		cana.position.y = -0.06;
		llave.add(cana);

		for (let i = 0; i < 2; i++) {
			const diente = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.055, 0.05), oro);
			diente.position.set(0.07, -0.24 + i * 0.13, 0);
			llave.add(diente);
		}
		const tope = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.045, 10), oro);
		tope.position.y = 0.235;
		llave.add(tope);

		return { llave, oro };
	}

	/**
	 * La llave-lease baja del cielo, se posa sobre la unidad y se absorbe.
	 * @returns {Promise<void>}
	 */
	function llaveDesciende(hasta, cfg = {}) {
		const destino = v3(hasta, new THREE.Vector3(0, 1, 0));
		const altura = cfg.altura ?? 18;
		const reposo = destino.clone().add(new THREE.Vector3(0, cfg.reposo ?? 1.05, 0));
		const { llave, oro } = construirLlave();

		const halo = crearHalo(PALETA.oro, 1.5);
		llave.add(halo);
		llave.position.copy(reposo).setY(reposo.y + altura);
		llave.rotation.y = Math.PI * 6;
		grupo.add(llave);

		// haz de luz vertical
		const matHaz = new THREE.MeshBasicMaterial({
			color: col(PALETA.oro),
			transparent: true,
			opacity: 0,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending,
		});
		const haz = new THREE.Mesh(
			new THREE.CylinderGeometry(0.14, 0.85, altura, 14, 1, true),
			matHaz
		);
		haz.position.copy(destino).add(new THREE.Vector3(0, altura / 2, 0));
		haz.renderOrder = 4;
		grupo.add(haz);

		const foco = pedirLuz(PALETA.oro);
		const yIni = reposo.y + altura;

		const caida = animar({
			dur: cfg.duracion ?? 1.7,
			ease: EASE.salidaQuinta,
			paso: (e, bruto) => {
				llave.position.y = yIni + (reposo.y - yIni) * e;
				llave.rotation.y = Math.PI * 6 * (1 - e);
				llave.rotation.z = Math.sin(bruto * Math.PI) * 0.14;
				oro.emissiveIntensity = 0.22 + e * 0.42;
				halo.material.uniforms.uOpacidad.value = 0.16 + 0.3 * e;
				matHaz.opacity = 0.17 * Math.sin(Math.PI * Math.min(1, bruto * 1.15));
				if (foco) {
					foco.luz.position.copy(llave.position);
					foco.luz.intensity = INT_LUZ * (0.3 + 0.95 * e);
				}
			},
		});

		return caida
			.then(() => {
				destelloAnillo(destino, PALETA.oro, 1.0, 3.6);
				if (!REDUCIDO) chispas(reposo, PALETA.oro, 26, 1.05, 1.0);
				const quitar = latir((t) => {
					llave.position.y = reposo.y + Math.sin(t * 2.1) * 0.05;
					llave.rotation.y += 0.012;
				});
				return animar({ dur: 0.55 }).then(() => quitar());
			})
			.then(() =>
				animar({
					dur: 0.6,
					ease: EASE.entradaCuad,
					paso: (e) => {
						const s = Math.max(0.001, 1 - e);
						llave.scale.set(s, s, s);
						llave.position.y = reposo.y - (reposo.y - destino.y) * e;
						oro.emissiveIntensity = 0.64 + e * 0.9;
						halo.material.uniforms.uOpacidad.value = 0.46 * (1 - e * e);
						matHaz.opacity = 0.17 * (1 - e);
						if (foco) foco.luz.intensity = INT_LUZ * 1.25 * (1 - e);
					},
					fin: () => {
						if (foco) foco.soltar();
						purgar(llave);
						purgar(haz);
					},
				})
			);
	}

	/* ══════════════════ 4 · acta-pergamino que asciende ══════════════════ */

	/**
	 * El acta sube hacia la NOTARÍA hasta perderse de vista.
	 * @returns {Promise<void>}
	 */
	function actaAsciende(desde, cfg = {}) {
		const origen = v3(desde, new THREE.Vector3(0, 1.2, 0));
		const subida = cfg.subida ?? 16;
		const dur = cfg.duracion ?? 3.4;

		const geo = new THREE.PlaneGeometry(1.0, 1.34, 14, 18);
		const base = Float32Array.from(geo.attributes.position.array);
		const mat = new THREE.MeshStandardMaterial({
			color: col(PALETA.tinta),
			map: texActa || null,
			emissive: col(PALETA.tinta),
			emissiveIntensity: 0.08,
			roughness: 0.92,
			metalness: 0.0,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0,
		});
		const acta = new THREE.Mesh(geo, mat);
		acta.name = 'acta';
		acta.renderOrder = 3;
		acta.position.copy(origen).add(new THREE.Vector3(0, 0.35, 0));
		grupo.add(acta);

		const halo = crearHalo(PALETA.oro, 2.0);
		halo.position.z = -0.02;
		acta.add(halo);

		const n = REDUCIDO ? 6 : 18;
		const c = crearCumulo(n, PALETA.oro);
		grupo.add(c.pts);
		for (let i = 0; i < n; i++) c.tam[i] = 0.05 + Math.random() * 0.08;
		c.geo.attributes.aTam.needsUpdate = true;

		const rizo = (t) => {
			const at = geo.attributes.position;
			for (let i = 0; i < at.count; i++) {
				const x = base[i * 3];
				const y = base[i * 3 + 1];
				at.array[i * 3 + 2] =
					Math.sin(x * 2.7 + t * 1.5) * 0.055 + Math.sin(y * 1.9 - t * 1.05) * 0.038;
			}
			at.needsUpdate = true;
			geo.computeVertexNormals();
		};
		rizo(0);

		const y0 = acta.position.y;
		return animar({
			dur,
			ease: EASE.ascenso,
			paso: (e, bruto) => {
				const t = reloj;
				acta.position.y = y0 + subida * e;
				acta.position.x = origen.x + Math.sin(t * 1.05) * 0.26 * Math.min(1, bruto * 3);
				acta.position.z = origen.z + Math.cos(t * 0.78) * 0.2 * Math.min(1, bruto * 3);
				acta.rotation.y = t * 0.55;
				acta.rotation.z = Math.sin(t * 0.9) * 0.17;
				const s = 1 - 0.3 * e;
				acta.scale.set(s, s, s);
				const entrada = Math.min(1, bruto / 0.12);
				const salida = bruto > 0.62 ? 1 - (bruto - 0.62) / 0.38 : 1;
				mat.opacity = entrada * salida;
				mat.emissiveIntensity = 0.08 + 0.16 * (1 - salida);
				halo.material.uniforms.uOpacidad.value = 0.14 * entrada * salida;
				if (!REDUCIDO) rizo(t);
				for (let i = 0; i < n; i++) {
					const u = Math.max(0, e - (i + 1) * 0.018);
					c.pos[i * 3] = acta.position.x + Math.sin(t * 1.6 + i) * 0.3;
					c.pos[i * 3 + 1] = y0 + subida * u - 0.15;
					c.pos[i * 3 + 2] = acta.position.z + Math.cos(t * 1.3 + i * 1.4) * 0.3;
					c.alfa[i] = entrada * salida * (0.25 + 0.45 * (1 - i / n));
				}
				c.geo.attributes.position.needsUpdate = true;
				c.geo.attributes.aAlfa.needsUpdate = true;
			},
			fin: () => {
				purgar(acta);
				purgar(c.pts);
			},
		});
	}

	/* ══════════════════ 5 · cremallera bilateral ══════════════════ */

	const cfgCrem = Object.assign(
		{
			posicion: new THREE.Vector3(0, 3.1, -9.2),
			rotacionY: 0,
			pasos: 11,
			separacion: 0.38,
			ancho: 1.26,
			techo: 2.05,
		},
		opciones.cremallera || {}
	);

	let crem = null;

	const ladoNorm = (side) => {
		const s = String(side ?? 'H').toLowerCase();
		if (s === 'm' || s === 'der' || s === 'derecha' || s === 'right' || s === 'verdigris' || s === '1')
			return 'M';
		if (typeof side === 'number') return side > 0 ? 'M' : 'H';
		return 'H';
	};

	function alturaPaso(step) {
		const n = Math.max(1, Math.min(cfgCrem.pasos, Math.round(step) || 1));
		return cfgCrem.techo - (n - 1) * cfgCrem.separacion;
	}

	function crearMuro() {
		const g = new THREE.Group();
		g.name = 'cremallera';
		g.position.copy(v3(cfgCrem.posicion, new THREE.Vector3(0, 3.1, -9.2)));
		g.rotation.y = cfgCrem.rotacionY || 0;

		const alto = cfgCrem.separacion * (cfgCrem.pasos + 1.6);
		const ancho = cfgCrem.ancho + 1.9;

		const placa = new THREE.Mesh(
			new THREE.PlaneGeometry(ancho, alto),
			new THREE.MeshStandardMaterial({
				color: col(PALETA.sepia),
				roughness: 0.96,
				metalness: 0.04,
				transparent: true,
				opacity: 0.82,
			})
		);
		placa.position.set(0, cfgCrem.techo - (alto / 2 - cfgCrem.separacion * 1.2), -0.08);
		g.add(placa);

		const marco = new THREE.LineSegments(
			new THREE.EdgesGeometry(placa.geometry),
			new THREE.LineBasicMaterial({ color: col(PALETA.tinta), transparent: true, opacity: 0.16 })
		);
		marco.position.copy(placa.position);
		marco.position.z += 0.005;
		g.add(marco);

		const yFin = alturaPaso(cfgCrem.pasos) - cfgCrem.separacion * 0.6;
		const cable = (x, color) => {
			const pts = [];
			const nSeg = 48;
			for (let i = 0; i <= nSeg; i++) {
				const u = i / nSeg;
				const y = cfgCrem.techo + cfgCrem.separacion * 0.8 + (yFin - cfgCrem.techo) * u;
				pts.push(new THREE.Vector3(x + Math.sin(u * 12) * 0.014, y, 0.02));
			}
			const e = crearEstela(pts, color, 0.028);
			e.opacidad(0.34);
			e.revelar(0.001);
			g.add(e.obj);
			return e;
		};

		grupo.add(g);
		return {
			grupo: g,
			H: { x: -cfgCrem.ancho / 2, color: PALETA.oro, cable: cable(-cfgCrem.ancho / 2, PALETA.oro), eslabones: new Map() },
			M: { x: cfgCrem.ancho / 2, color: PALETA.verdigris, cable: cable(cfgCrem.ancho / 2, PALETA.verdigris), eslabones: new Map() },
			dientes: new Map(),
		};
	}

	function crearEslabon(lado, step) {
		const y = alturaPaso(step);
		const mat = new THREE.MeshStandardMaterial({
			color: col(lado.color),
			emissive: col(lado.color),
			emissiveIntensity: 0.2,
			metalness: 0.75,
			roughness: 0.34,
			transparent: true,
			opacity: 0,
		});
		const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.031, 8, 20), mat);
		anillo.position.set(lado.x, y, 0.05);
		anillo.rotation.z = (step % 2 ? 1 : -1) * 0.9;
		anillo.scale.setScalar(0.01);
		crem.grupo.add(anillo);
		return { obj: anillo, mat, y };
	}

	/**
	 * Añade (o pulsa) el peldaño `step` en el lado indicado. Cuando ambos lados
	 * tienen el mismo peldaño, las dos cadenas se engarzan con un diente
	 * bicolor oro/verdigrís.
	 * @param {number} step  1..11
	 * @param {'H'|'M'|'izq'|'der'|number} side
	 * @returns {Promise<void>}
	 */
	function cremallera(step, side) {
		if (!crem) crem = crearMuro();
		const clave = ladoNorm(side);
		const lado = crem[clave];
		const n = Math.max(1, Math.min(cfgCrem.pasos, Math.round(step) || 1));

		const tareas = [];
		let esl = lado.eslabones.get(n);
		if (!esl) {
			esl = crearEslabon(lado, n);
			lado.eslabones.set(n, esl);
			const giroFin = esl.obj.rotation.z;
			tareas.push(
				animar({
					dur: 0.62,
					ease: EASE.salidaAtras,
					paso: (e) => {
						esl.obj.scale.setScalar(Math.max(0.01, e));
						esl.obj.rotation.z = giroFin * (0.35 + 0.65 * e) + (1 - e) * 1.4;
						esl.mat.opacity = Math.min(1, e * 1.3);
						esl.mat.emissiveIntensity = 0.2 + 0.55 * (1 - e);
					},
				})
			);
			const rTotal = n / cfgCrem.pasos;
			const rPrev = (n - 1) / cfgCrem.pasos;
			tareas.push(
				animar({
					dur: 0.5,
					ease: EASE.salidaCubica,
					paso: (e) => lado.cable.revelar(Math.max(0.001, rPrev + (rTotal - rPrev) * e)),
				})
			);
		} else {
			tareas.push(
				animar({
					dur: 0.5,
					ease: EASE.salidaCubica,
					paso: (e) => {
						esl.mat.emissiveIntensity = 0.2 + 0.6 * Math.sin(Math.PI * e);
					},
				})
			);
		}

		const otro = clave === 'H' ? crem.M : crem.H;
		if (otro.eslabones.has(n) && !crem.dientes.has(n)) tareas.push(engarzar(n));

		return Promise.all(tareas).then(() => undefined);
	}

	/** Dos medias cuñas que se cierran en el centro: el engarce del peldaño. */
	function engarzar(n) {
		const y = alturaPaso(n);
		const medio = cfgCrem.ancho / 2;
		const piezas = [];
		for (const clave of ['H', 'M']) {
			const lado = crem[clave];
			const mat = new THREE.MeshStandardMaterial({
				color: col(lado.color),
				emissive: col(lado.color),
				emissiveIntensity: 0.28,
				metalness: 0.7,
				roughness: 0.3,
				transparent: true,
				opacity: 0,
			});
			const cuna = new THREE.Mesh(new THREE.BoxGeometry(medio * 0.98, 0.075, 0.075), mat);
			const signo = clave === 'H' ? -1 : 1;
			cuna.position.set(signo * medio, y, 0.05);
			cuna.userData.destino = signo * medio * 0.47;
			cuna.userData.origen = signo * medio;
			crem.grupo.add(cuna);
			piezas.push({ cuna, mat });
		}
		crem.dientes.set(n, piezas);

		const brillo = crearHalo(PALETA.tinta, 0.85);
		brillo.position.set(0, y, 0.12);
		crem.grupo.add(brillo);

		return animar({
			dur: 0.72,
			ease: EASE.salidaCubica,
			paso: (e) => {
				for (const { cuna, mat } of piezas) {
					cuna.position.x =
						cuna.userData.origen + (cuna.userData.destino - cuna.userData.origen) * e;
					mat.opacity = Math.min(1, e * 1.6);
					mat.emissiveIntensity = 0.28 + 0.5 * Math.pow(e, 6);
				}
				brillo.material.uniforms.uOpacidad.value = Math.pow(e, 5) * 0.7;
			},
			fin: () => {
				animar({
					dur: 0.5,
					ease: EASE.entradaCuad,
					paso: (e) => {
						brillo.material.uniforms.uOpacidad.value = 0.7 * (1 - e);
						for (const { mat } of piezas) mat.emissiveIntensity = 0.28 + 0.5 * (1 - e);
					},
					fin: () => purgar(brillo),
				});
			},
		});
	}

	/** Coloca el muro de la cremallera (el integrador puede ajustarlo en vivo). */
	function colocarCremallera(posicion, rotacionY = cfgCrem.rotacionY) {
		cfgCrem.posicion = v3(posicion, v3(cfgCrem.posicion));
		cfgCrem.rotacionY = rotacionY || 0;
		if (crem) {
			crem.grupo.position.copy(v3(cfgCrem.posicion));
			crem.grupo.rotation.y = cfgCrem.rotacionY;
		}
	}

	/** Desmonta la cremallera (útil en el `restart` del guion). */
	function reiniciarCremallera() {
		if (!crem) return;
		purgar(crem.grupo);
		crem = null;
	}

	/* ── arranque y cierre ── */

	cargarAddons();

	function dispose() {
		activo = false;
		if (raf && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
		raf = 0;
		if (typeof window !== 'undefined') window.removeEventListener('resize', alRedimensionar);
		// Nadie debe quedarse esperando una promesa de un efecto muerto.
		for (const a of Array.from(anims)) {
			try {
				if (a.onPaso) a.onPaso(1, 1);
				if (a.onFin) a.onFin();
			} catch (e) {
				/* ignorado */
			}
			a.resolver();
		}
		anims.clear();
		vivos.clear();
		crem = null;
		purgar(grupo);
		for (const r of compartidos) if (r && typeof r.dispose === 'function') r.dispose();
		compartidos.clear();
		materialesLinea.clear();
		if (scene && typeof scene.remove === 'function') scene.remove(grupo);
	}

	return {
		group: grupo,
		gota,
		cristalLinea,
		llaveDesciende,
		actaAsciende,
		cremallera,
		colocarCremallera,
		reiniciarCremallera,
		update,
		setResolucion,
		reducido: REDUCIDO,
		PALETA,
		dispose,
	};
}

/* ─────────────────── textura del acta (pergamino) ─────────────────── */

function crearTexturaActa(THREE) {
	if (typeof document === 'undefined') return null;
	try {
		const c = document.createElement('canvas');
		c.width = 256;
		c.height = 340;
		const g = c.getContext('2d');
		if (!g) return null;

		g.fillStyle = '#eae0c8';
		g.fillRect(0, 0, 256, 340);

		const vel = g.createRadialGradient(128, 168, 58, 128, 168, 214);
		vel.addColorStop(0, 'rgba(19,16,8,0)');
		vel.addColorStop(1, 'rgba(19,16,8,0.30)');
		g.fillStyle = vel;
		g.fillRect(0, 0, 256, 340);

		g.fillStyle = 'rgba(19,16,8,0.72)';
		g.font = 'bold 19px Consolas, "Cascadia Mono", monospace';
		g.fillText('ACTA', 40, 42);
		g.font = '11px Consolas, "Cascadia Mono", monospace';
		g.fillStyle = 'rgba(19,16,8,0.5)';
		g.fillText('cadena verificada', 40, 58);

		g.strokeStyle = 'rgba(19,16,8,0.40)';
		g.lineWidth = 2;
		for (let i = 0; i < 13; i++) {
			const y = 84 + i * 15.5;
			const w = 140 + Math.sin(i * 2.3) * 42;
			g.beginPath();
			g.moveTo(40, y);
			g.lineTo(40 + w, y);
			g.stroke();
		}

		g.beginPath();
		g.arc(188, 296, 23, 0, Math.PI * 2);
		g.fillStyle = 'rgba(231,177,76,0.88)';
		g.fill();
		g.strokeStyle = 'rgba(19,16,8,0.45)';
		g.stroke();

		const t = new THREE.CanvasTexture(c);
		if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = 4;
		return t;
	} catch (e) {
		return null;
	}
}

export default createFlujo;
