//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = (() => {
	try {
		return new window.BroadcastChannel("pub-sub-es");
	} catch {
		return { postMessage: () => {} };
	}
})(), u = (e, t) => t ? e.toLowerCase() : e, d = (e, { caseInsensitive: t } = {}) => (n, r, i = Infinity) => {
	let a = u(n, t);
	return e[a] || (e[a] = [], e.__times__[a] = []), e[a].push(r), e.__times__[a].push(+i || Infinity), {
		event: a,
		handler: r
	};
}, f = (e, { caseInsensitive: t } = {}) => (n, r) => {
	typeof n == "object" && (r = n.handler, n = n.event);
	let i = u(n, t);
	if (!e[i]) return;
	let a = e[i].indexOf(r);
	a === -1 || a >= e[i].length || (e[i].splice(a, 1), e.__times__[i].splice(a, 1));
}, p = (e, t) => () => {
	e.forEach((e) => e(t));
}, m = (e, { isGlobal: t, caseInsensitive: n, async: r } = {}) => {
	let i = f(e);
	return (a, o, s = {}) => {
		let c = u(a, n);
		if (!e[c]) return;
		let d = [...e[c]];
		if (d.forEach((t, n) => {
			--e.__times__[c][n] < 1 && i(c, t);
		}), (s.async === void 0 ? r : s.async) ? setTimeout(p(d, o), 0) : p(d, o)(), t && !s.isNoGlobalBroadcast) try {
			l.postMessage({
				event: c,
				news: o
			});
		} catch (e) {
			if (e instanceof DOMException) console.warn(`Could not broadcast '${c}' globally. Payload is not clonable.`);
			else throw e;
		}
	};
}, h = (e) => () => {
	Object.keys(e).filter((e) => e[0] !== "_").forEach((t) => {
		e[t] = void 0, e.__times__[t] = void 0, delete e[t], delete e.__times__[t];
	});
}, g = () => ({ __times__: {} }), _ = (e = {}) => {
	let t = e.async || !1, n = e.caseInsensitive || !1, r = e.stack || g();
	return r.__times__ ||= {}, {
		publish: m(r, {
			async: t,
			caseInsensitive: n
		}),
		subscribe: d(r, { caseInsensitive: n }),
		unsubscribe: f(r, { caseInsensitive: n }),
		clear: h(r),
		stack: r
	};
}, v = g(), y = {
	publish: m(v, { isGlobal: !0 }),
	subscribe: d(v),
	unsubscribe: f(v),
	clear: h(v),
	stack: v
};
l.onmessage = ({ data: { event: e, news: t } }) => y.publish(e, t, { isNoGlobalBroadcast: !0 });
//#endregion
//#region node_modules/.pnpm/regl-scatterplot@1.9.1_pub-sub-es@2.1.2_regl@2.1.1/node_modules/regl-scatterplot/dist/regl-scatterplot.esm.js
var b = /* @__PURE__ */ c((/* @__PURE__ */ o(((e, t) => {
	(function(n, r) {
		typeof e == "object" && t !== void 0 ? t.exports = r() : typeof define == "function" && define.amd ? define(r) : n.createREGL = r();
	})(e, (function() {
		var e = function(e) {
			return e instanceof Uint8Array || e instanceof Uint16Array || e instanceof Uint32Array || e instanceof Int8Array || e instanceof Int16Array || e instanceof Int32Array || e instanceof Float32Array || e instanceof Float64Array || e instanceof Uint8ClampedArray;
		}, t = function(e, t) {
			for (var n = Object.keys(t), r = 0; r < n.length; ++r) e[n[r]] = t[n[r]];
			return e;
		}, n = "\n";
		function r(e) {
			return typeof atob < "u" ? atob(e) : "base64:" + e;
		}
		function i(e) {
			var t = /* @__PURE__ */ Error("(regl) " + e);
			throw console.error(t), t;
		}
		function a(e, t) {
			e || i(t);
		}
		function o(e) {
			return e ? ": " + e : "";
		}
		function s(e, t, n) {
			e in t || i("unknown parameter (" + e + ")" + o(n) + ". possible values: " + Object.keys(t).join());
		}
		function c(t, n) {
			e(t) || i("invalid parameter type" + o(n) + ". must be a typed array");
		}
		function l(e, t) {
			switch (t) {
				case "number": return typeof e == "number";
				case "object": return typeof e == "object";
				case "string": return typeof e == "string";
				case "boolean": return typeof e == "boolean";
				case "function": return typeof e == "function";
				case "undefined": return e === void 0;
				case "symbol": return typeof e == "symbol";
			}
		}
		function u(e, t, n) {
			l(e, t) || i("invalid parameter type" + o(n) + ". expected " + t + ", got " + typeof e);
		}
		function d(e, t) {
			e >= 0 && (e | 0) === e || i("invalid parameter type, (" + e + ")" + o(t) + ". must be a nonnegative integer");
		}
		function f(e, t, n) {
			t.indexOf(e) < 0 && i("invalid value" + o(n) + ". must be one of: " + t);
		}
		var p = [
			"gl",
			"canvas",
			"container",
			"attributes",
			"pixelRatio",
			"extensions",
			"optionalExtensions",
			"profile",
			"onDone"
		];
		function m(e) {
			Object.keys(e).forEach(function(e) {
				p.indexOf(e) < 0 && i("invalid regl constructor argument \"" + e + "\". must be one of " + p);
			});
		}
		function h(e, t) {
			for (e += ""; e.length < t;) e = " " + e;
			return e;
		}
		function g() {
			this.name = "unknown", this.lines = [], this.index = {}, this.hasErrors = !1;
		}
		function _(e, t) {
			this.number = e, this.line = t, this.errors = [];
		}
		function v(e, t, n) {
			this.file = e, this.line = t, this.message = n;
		}
		function y() {
			var e = /* @__PURE__ */ Error(), t = (e.stack || e).toString(), n = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(t);
			if (n) return n[1];
			var r = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(t);
			return r ? r[1] : "unknown";
		}
		function b() {
			var e = /* @__PURE__ */ Error(), t = (e.stack || e).toString(), n = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(t);
			if (n) return n[1];
			var r = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(t);
			return r ? r[1] : "unknown";
		}
		function x(e, t) {
			var n = e.split("\n"), i = 1, a = 0, o = {
				unknown: new g(),
				0: new g()
			};
			o.unknown.name = o[0].name = t || y(), o.unknown.lines.push(new _(0, ""));
			for (var s = 0; s < n.length; ++s) {
				var c = n[s], l = /^\s*#\s*(\w+)\s+(.+)\s*$/.exec(c);
				if (l) switch (l[1]) {
					case "line":
						var u = /(\d+)(\s+\d+)?/.exec(l[2]);
						u && (i = u[1] | 0, u[2] && (a = u[2] | 0, a in o || (o[a] = new g())));
						break;
					case "define":
						var d = /SHADER_NAME(_B64)?\s+(.*)$/.exec(l[2]);
						d && (o[a].name = d[1] ? r(d[2]) : d[2]);
				}
				o[a].lines.push(new _(i++, c));
			}
			return Object.keys(o).forEach(function(e) {
				var t = o[e];
				t.lines.forEach(function(e) {
					t.index[e.number] = e;
				});
			}), o;
		}
		function S(e) {
			var t = [];
			return e.split("\n").forEach(function(e) {
				if (!(e.length < 5)) {
					var n = /^ERROR:\s+(\d+):(\d+):\s*(.*)$/.exec(e);
					n ? t.push(new v(n[1] | 0, n[2] | 0, n[3].trim())) : e.length > 0 && t.push(new v("unknown", 0, e));
				}
			}), t;
		}
		function C(e, t) {
			t.forEach(function(t) {
				var n = e[t.file];
				if (n) {
					var r = n.index[t.line];
					if (r) {
						r.errors.push(t), n.hasErrors = !0;
						return;
					}
				}
				e.unknown.hasErrors = !0, e.unknown.lines[0].errors.push(t);
			});
		}
		function w(e, t, r, i, o) {
			if (!e.getShaderParameter(t, e.COMPILE_STATUS)) {
				var s = e.getShaderInfoLog(t), c = i === e.FRAGMENT_SHADER ? "fragment" : "vertex";
				j(r, "string", c + " shader source must be a string", o);
				var l = x(r, o);
				C(l, S(s)), Object.keys(l).forEach(function(e) {
					var t = l[e];
					if (!t.hasErrors) return;
					var r = [""], i = [""];
					function a(e, t) {
						r.push(e), i.push(t || "");
					}
					a("file number " + e + ": " + t.name + "\n", "color:red;text-decoration:underline;font-weight:bold"), t.lines.forEach(function(e) {
						if (e.errors.length > 0) {
							a(h(e.number, 4) + "|  ", "background-color:yellow; font-weight:bold"), a(e.line + n, "color:red; background-color:yellow; font-weight:bold");
							var t = 0;
							e.errors.forEach(function(r) {
								var i = r.message, o = /^\s*'(.*)'\s*:\s*(.*)$/.exec(i);
								if (o) {
									var s = o[1];
									i = o[2], s === "assign" && (s = "="), t = Math.max(e.line.indexOf(s, t), 0);
								} else t = 0;
								a(h("| ", 6)), a(h("^^^", t + 3) + n, "font-weight:bold"), a(h("| ", 6)), a(i + n, "font-weight:bold");
							}), a(h("| ", 6) + n);
						} else a(h(e.number, 4) + "|  "), a(e.line + n, "color:red");
					}), typeof document < "u" && !window.chrome ? (i[0] = r.join("%c"), console.log.apply(console, i)) : console.log(r.join(""));
				}), a.raise("Error compiling " + c + " shader, " + l[0].name);
			}
		}
		function T(e, t, r, i, o) {
			if (!e.getProgramParameter(t, e.LINK_STATUS)) {
				var s = e.getProgramInfoLog(t), c = x(r, o), l = "Error linking program with vertex shader, \"" + x(i, o)[0].name + "\", and fragment shader \"" + c[0].name + "\"";
				typeof document < "u" ? console.log("%c" + l + n + "%c" + s, "color:red;text-decoration:underline;font-weight:bold", "color:red") : console.log(l + n + s), a.raise(l);
			}
		}
		function E(e) {
			e._commandRef = y();
		}
		function D(e, t, n, r) {
			E(e);
			function i(e) {
				return e ? r.id(e) : 0;
			}
			e._fragId = i(e.static.frag), e._vertId = i(e.static.vert);
			function a(e, t) {
				Object.keys(t).forEach(function(t) {
					e[r.id(t)] = !0;
				});
			}
			var o = e._uniformSet = {};
			a(o, t.static), a(o, t.dynamic);
			var s = e._attributeSet = {};
			a(s, n.static), a(s, n.dynamic), e._hasCount = "count" in e.static || "count" in e.dynamic || "elements" in e.static || "elements" in e.dynamic;
		}
		function O(e, t) {
			var n = b();
			i(e + " in command " + (t || y()) + (n === "unknown" ? "" : " called from " + n));
		}
		function k(e, t, n) {
			e || O(t, n || y());
		}
		function A(e, t, n, r) {
			e in t || O("unknown parameter (" + e + ")" + o(n) + ". possible values: " + Object.keys(t).join(), r || y());
		}
		function j(e, t, n, r) {
			l(e, t) || O("invalid parameter type" + o(n) + ". expected " + t + ", got " + typeof e, r || y());
		}
		function M(e) {
			e();
		}
		function N(e, t, n) {
			e.texture ? f(e.texture._texture.internalformat, t, "unsupported texture format for attachment") : f(e.renderbuffer._renderbuffer.format, n, "unsupported renderbuffer format for attachment");
		}
		var P = 33071, F = 9728, I = 9984, L = 9985, R = 9986, ee = 9987, z = 5120, B = 5121, V = 5122, H = 5123, te = 5124, U = 5125, W = 5126, G = 32819, ne = 32820, K = 33635, re = 34042, ie = 36193, q = {};
		q[z] = q[B] = 1, q[V] = q[H] = q[ie] = q[K] = q[G] = q[ne] = 2, q[te] = q[U] = q[W] = q[re] = 4;
		function ae(e, t) {
			return e === ne || e === G || e === K ? 2 : e === re ? 4 : q[e] * t;
		}
		function oe(e) {
			return !(e & e - 1) && !!e;
		}
		function se(e, t, n) {
			var r, i = t.width, o = t.height, s = t.channels;
			a(i > 0 && i <= n.maxTextureSize && o > 0 && o <= n.maxTextureSize, "invalid texture shape"), (e.wrapS !== P || e.wrapT !== P) && a(oe(i) && oe(o), "incompatible wrap mode for texture, both width and height must be power of 2"), t.mipmask === 1 ? i !== 1 && o !== 1 && a(e.minFilter !== I && e.minFilter !== R && e.minFilter !== L && e.minFilter !== ee, "min filter requires mipmap") : (a(oe(i) && oe(o), "texture must be a square power of 2 to support mipmapping"), a(t.mipmask === (i << 1) - 1, "missing or incomplete mipmap data")), t.type === W && (n.extensions.indexOf("oes_texture_float_linear") < 0 && a(e.minFilter === F && e.magFilter === F, "filter not supported, must enable oes_texture_float_linear"), a(!e.genMipmaps, "mipmap generation not supported with float textures"));
			var c = t.images;
			for (r = 0; r < 16; ++r) if (c[r]) {
				var l = i >> r, u = o >> r;
				a(t.mipmask & 1 << r, "missing mipmap data");
				var d = c[r];
				if (a(d.width === l && d.height === u, "invalid shape for mip images"), a(d.format === t.format && d.internalformat === t.internalformat && d.type === t.type, "incompatible type for mip image"), !d.compressed) {
					if (d.data) {
						var f = Math.ceil(ae(d.type, s) * l / d.unpackAlignment) * d.unpackAlignment;
						a(d.data.byteLength === f * u, "invalid data for image, buffer size is inconsistent with image format");
					} else d.element || d.copy;
				}
			} else e.genMipmaps || a(!(t.mipmask & 1 << r), "extra mipmap data");
			t.compressed && a(!e.genMipmaps, "mipmap generation for compressed images not supported");
		}
		function ce(e, t, n, r) {
			var i = e.width, o = e.height, s = e.channels;
			a(i > 0 && i <= r.maxTextureSize && o > 0 && o <= r.maxTextureSize, "invalid texture shape"), a(i === o, "cube map must be square"), a(t.wrapS === P && t.wrapT === P, "wrap mode not supported by cube map");
			for (var c = 0; c < n.length; ++c) {
				var l = n[c];
				a(l.width === i && l.height === o, "inconsistent cube map face shape"), t.genMipmaps && (a(!l.compressed, "can not generate mipmap for compressed textures"), a(l.mipmask === 1, "can not specify mipmaps and generate mipmaps"));
				for (var u = l.images, d = 0; d < 16; ++d) {
					var f = u[d];
					if (f) {
						var p = i >> d, m = o >> d;
						a(l.mipmask & 1 << d, "missing mipmap data"), a(f.width === p && f.height === m, "invalid shape for mip images"), a(f.format === e.format && f.internalformat === e.internalformat && f.type === e.type, "incompatible type for mip image"), f.compressed || (f.data ? a(f.data.byteLength === p * m * Math.max(ae(f.type, s), f.unpackAlignment), "invalid data for image, buffer size is inconsistent with image format") : f.element || f.copy);
					}
				}
			}
		}
		var J = t(a, {
			optional: M,
			raise: i,
			commandRaise: O,
			command: k,
			parameter: s,
			commandParameter: A,
			constructor: m,
			type: u,
			commandType: j,
			isTypedArray: c,
			nni: d,
			oneOf: f,
			shaderError: w,
			linkError: T,
			callSite: b,
			saveCommandRef: E,
			saveDrawInfo: D,
			framebufferFormat: N,
			guessCommand: y,
			texture2D: se,
			textureCube: ce
		}), le = 0, ue = 0, de = 5, fe = 6;
		function pe(e, t) {
			this.id = le++, this.type = e, this.data = t;
		}
		function me(e) {
			return e.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
		}
		function he(e) {
			if (e.length === 0) return [];
			var t = e.charAt(0), n = e.charAt(e.length - 1);
			if (e.length > 1 && t === n && (t === "\"" || t === "'")) return ["\"" + me(e.substr(1, e.length - 2)) + "\""];
			var r = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(e);
			if (r) return he(e.substr(0, r.index)).concat(he(r[1])).concat(he(e.substr(r.index + r[0].length)));
			var i = e.split(".");
			if (i.length === 1) return ["\"" + me(e) + "\""];
			for (var a = [], o = 0; o < i.length; ++o) a = a.concat(he(i[o]));
			return a;
		}
		function ge(e) {
			return "[" + he(e).join("][") + "]";
		}
		function _e(e, t) {
			return new pe(e, ge(t + ""));
		}
		function ve(e) {
			return typeof e == "function" && !e._reglType || e instanceof pe;
		}
		function ye(e, t) {
			if (typeof e == "function") return new pe(ue, e);
			if (typeof e == "number" || typeof e == "boolean") return new pe(de, e);
			if (Array.isArray(e)) return new pe(fe, e.map(function(e, n) {
				return ye(e, t + "[" + n + "]");
			}));
			if (e instanceof pe) return e;
			J(!1, "invalid option type in uniform " + t);
		}
		var be = {
			DynamicVariable: pe,
			define: _e,
			isDynamic: ve,
			unbox: ye,
			accessor: ge
		}, xe = {
			next: typeof requestAnimationFrame == "function" ? function(e) {
				return requestAnimationFrame(e);
			} : function(e) {
				return setTimeout(e, 16);
			},
			cancel: typeof cancelAnimationFrame == "function" ? function(e) {
				return cancelAnimationFrame(e);
			} : clearTimeout
		}, Se = typeof performance < "u" && performance.now ? function() {
			return performance.now();
		} : function() {
			return +/* @__PURE__ */ new Date();
		};
		function Ce() {
			var e = { "": 0 }, t = [""];
			return {
				id: function(n) {
					var r = e[n];
					return r || (r = e[n] = t.length, t.push(n), r);
				},
				str: function(e) {
					return t[e];
				}
			};
		}
		function we(e, n, r) {
			var i = document.createElement("canvas");
			t(i.style, {
				border: 0,
				margin: 0,
				padding: 0,
				top: 0,
				left: 0,
				width: "100%",
				height: "100%"
			}), e.appendChild(i), e === document.body && (i.style.position = "absolute", t(e.style, {
				margin: 0,
				padding: 0
			}));
			function a() {
				var t = window.innerWidth, n = window.innerHeight;
				if (e !== document.body) {
					var a = i.getBoundingClientRect();
					t = a.right - a.left, n = a.bottom - a.top;
				}
				i.width = r * t, i.height = r * n;
			}
			var o;
			e !== document.body && typeof ResizeObserver == "function" ? (o = new ResizeObserver(function() {
				setTimeout(a);
			}), o.observe(e)) : window.addEventListener("resize", a, !1);
			function s() {
				o ? o.disconnect() : window.removeEventListener("resize", a), e.removeChild(i);
			}
			return a(), {
				canvas: i,
				onDestroy: s
			};
		}
		function Te(e, t) {
			function n(n) {
				try {
					return e.getContext(n, t);
				} catch {
					return null;
				}
			}
			return n("webgl") || n("experimental-webgl") || n("webgl-experimental");
		}
		function Ee(e) {
			return typeof e.nodeName == "string" && typeof e.appendChild == "function" && typeof e.getBoundingClientRect == "function";
		}
		function De(e) {
			return typeof e.drawArrays == "function" || typeof e.drawElements == "function";
		}
		function Oe(e) {
			return typeof e == "string" ? e.split() : (J(Array.isArray(e), "invalid extension array"), e);
		}
		function ke(e) {
			return typeof e == "string" ? (J(typeof document < "u", "not supported outside of DOM"), document.querySelector(e)) : e;
		}
		function Ae(e) {
			var t = e || {}, n, r, i, a, o = {}, s = [], c = [], l = typeof window > "u" ? 1 : window.devicePixelRatio, u = !1, d = function(e) {
				e && J.raise(e);
			}, f = function() {};
			if (typeof t == "string" ? (J(typeof document < "u", "selector queries only supported in DOM environments"), n = document.querySelector(t), J(n, "invalid query string for element")) : typeof t == "object" ? Ee(t) ? n = t : De(t) ? (a = t, i = a.canvas) : (J.constructor(t), "gl" in t ? a = t.gl : "canvas" in t ? i = ke(t.canvas) : "container" in t && (r = ke(t.container)), "attributes" in t && (o = t.attributes, J.type(o, "object", "invalid context attributes")), "extensions" in t && (s = Oe(t.extensions)), "optionalExtensions" in t && (c = Oe(t.optionalExtensions)), "onDone" in t && (J.type(t.onDone, "function", "invalid or missing onDone callback"), d = t.onDone), "profile" in t && (u = !!t.profile), "pixelRatio" in t && (l = +t.pixelRatio, J(l > 0, "invalid pixel ratio"))) : J.raise("invalid arguments to regl"), n && (n.nodeName.toLowerCase() === "canvas" ? i = n : r = n), !a) {
				if (!i) {
					J(typeof document < "u", "must manually specify webgl context outside of DOM environments");
					var p = we(r || document.body, d, l);
					if (!p) return null;
					i = p.canvas, f = p.onDestroy;
				}
				o.premultipliedAlpha === void 0 && (o.premultipliedAlpha = !0), a = Te(i, o);
			}
			return a ? {
				gl: a,
				canvas: i,
				container: r,
				extensions: s,
				optionalExtensions: c,
				pixelRatio: l,
				profile: u,
				onDone: d,
				onDestroy: f
			} : (f(), d("webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org"), null);
		}
		function je(e, t) {
			var n = {};
			function r(t) {
				J.type(t, "string", "extension name must be string");
				var r = t.toLowerCase(), i;
				try {
					i = n[r] = e.getExtension(r);
				} catch {}
				return !!i;
			}
			for (var i = 0; i < t.extensions.length; ++i) {
				var a = t.extensions[i];
				if (!r(a)) return t.onDestroy(), t.onDone("\"" + a + "\" extension is not supported by the current WebGL context, try upgrading your system or a different browser"), null;
			}
			return t.optionalExtensions.forEach(r), {
				extensions: n,
				restore: function() {
					Object.keys(n).forEach(function(e) {
						if (n[e] && !r(e)) throw Error("(regl): error restoring extension " + e);
					});
				}
			};
		}
		function Me(e, t) {
			for (var n = Array(e), r = 0; r < e; ++r) n[r] = t(r);
			return n;
		}
		var Ne = 5120, Pe = 5121, Fe = 5122, Ie = 5123, Le = 5124, Re = 5125, ze = 5126;
		function Be(e) {
			for (var t = 16; t <= 1 << 28; t *= 16) if (e <= t) return t;
			return 0;
		}
		function Ve(e) {
			var t = (e > 65535) << 4, n;
			return e >>>= t, n = (e > 255) << 3, e >>>= n, t |= n, n = (e > 15) << 2, e >>>= n, t |= n, n = (e > 3) << 1, e >>>= n, t |= n, t | e >> 1;
		}
		function He() {
			var e = Me(8, function() {
				return [];
			});
			function t(t) {
				var n = Be(t), r = e[Ve(n) >> 2];
				return r.length > 0 ? r.pop() : new ArrayBuffer(n);
			}
			function n(t) {
				e[Ve(t.byteLength) >> 2].push(t);
			}
			function r(e, n) {
				var r = null;
				switch (e) {
					case Ne:
						r = new Int8Array(t(n), 0, n);
						break;
					case Pe:
						r = new Uint8Array(t(n), 0, n);
						break;
					case Fe:
						r = new Int16Array(t(2 * n), 0, n);
						break;
					case Ie:
						r = new Uint16Array(t(2 * n), 0, n);
						break;
					case Le:
						r = new Int32Array(t(4 * n), 0, n);
						break;
					case Re:
						r = new Uint32Array(t(4 * n), 0, n);
						break;
					case ze:
						r = new Float32Array(t(4 * n), 0, n);
						break;
					default: return null;
				}
				return r.length === n ? r : r.subarray(0, n);
			}
			function i(e) {
				n(e.buffer);
			}
			return {
				alloc: t,
				free: n,
				allocType: r,
				freeType: i
			};
		}
		var Y = He();
		Y.zero = He();
		var Ue = 3408, We = 3410, Ge = 3411, Ke = 3412, qe = 3413, Je = 3414, Ye = 3415, Xe = 33901, Ze = 33902, Qe = 3379, $e = 3386, et = 34921, tt = 36347, nt = 36348, rt = 35661, it = 35660, at = 34930, ot = 36349, st = 34076, ct = 34024, lt = 7936, ut = 7937, dt = 7938, ft = 35724, pt = 34047, mt = 36063, ht = 34852, gt = 3553, _t = 34067, vt = 34069, yt = 33984, bt = 6408, xt = 5126, St = 5121, Ct = 36160, wt = 36053, Tt = 36064, Et = 16384, Dt = function(e, t) {
			var n = 1;
			t.ext_texture_filter_anisotropic && (n = e.getParameter(pt));
			var r = 1, i = 1;
			t.webgl_draw_buffers && (r = e.getParameter(ht), i = e.getParameter(mt));
			var a = !!t.oes_texture_float;
			if (a) {
				var o = e.createTexture();
				e.bindTexture(gt, o), e.texImage2D(gt, 0, bt, 1, 1, 0, bt, xt, null);
				var s = e.createFramebuffer();
				if (e.bindFramebuffer(Ct, s), e.framebufferTexture2D(Ct, Tt, gt, o, 0), e.bindTexture(gt, null), e.checkFramebufferStatus(Ct) !== wt) a = !1;
				else {
					e.viewport(0, 0, 1, 1), e.clearColor(1, 0, 0, 1), e.clear(Et);
					var c = Y.allocType(xt, 4);
					e.readPixels(0, 0, 1, 1, bt, xt, c), e.getError() ? a = !1 : (e.deleteFramebuffer(s), e.deleteTexture(o), a = c[0] === 1), Y.freeType(c);
				}
			}
			var l = typeof navigator < "u" && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent)), u = !0;
			if (!l) {
				var d = e.createTexture(), f = Y.allocType(St, 36);
				e.activeTexture(yt), e.bindTexture(_t, d), e.texImage2D(vt, 0, bt, 3, 3, 0, bt, St, f), Y.freeType(f), e.bindTexture(_t, null), e.deleteTexture(d), u = !e.getError();
			}
			return {
				colorBits: [
					e.getParameter(We),
					e.getParameter(Ge),
					e.getParameter(Ke),
					e.getParameter(qe)
				],
				depthBits: e.getParameter(Je),
				stencilBits: e.getParameter(Ye),
				subpixelBits: e.getParameter(Ue),
				extensions: Object.keys(t).filter(function(e) {
					return !!t[e];
				}),
				maxAnisotropic: n,
				maxDrawbuffers: r,
				maxColorAttachments: i,
				pointSizeDims: e.getParameter(Xe),
				lineWidthDims: e.getParameter(Ze),
				maxViewportDims: e.getParameter($e),
				maxCombinedTextureUnits: e.getParameter(rt),
				maxCubeMapSize: e.getParameter(st),
				maxRenderbufferSize: e.getParameter(ct),
				maxTextureUnits: e.getParameter(at),
				maxTextureSize: e.getParameter(Qe),
				maxAttributes: e.getParameter(et),
				maxVertexUniforms: e.getParameter(tt),
				maxVertexTextureUnits: e.getParameter(it),
				maxVaryingVectors: e.getParameter(nt),
				maxFragmentUniforms: e.getParameter(ot),
				glsl: e.getParameter(ft),
				renderer: e.getParameter(ut),
				vendor: e.getParameter(lt),
				version: e.getParameter(dt),
				readFloat: a,
				npotTextureCube: u
			};
		};
		function Ot(t) {
			return !!t && typeof t == "object" && Array.isArray(t.shape) && Array.isArray(t.stride) && typeof t.offset == "number" && t.shape.length === t.stride.length && (Array.isArray(t.data) || e(t.data));
		}
		var kt = function(e) {
			return Object.keys(e).map(function(t) {
				return e[t];
			});
		}, X = {
			shape: Ft,
			flatten: Pt
		};
		function At(e, t, n) {
			for (var r = 0; r < t; ++r) n[r] = e[r];
		}
		function jt(e, t, n, r) {
			for (var i = 0, a = 0; a < t; ++a) for (var o = e[a], s = 0; s < n; ++s) r[i++] = o[s];
		}
		function Mt(e, t, n, r, i, a) {
			for (var o = a, s = 0; s < t; ++s) for (var c = e[s], l = 0; l < n; ++l) for (var u = c[l], d = 0; d < r; ++d) i[o++] = u[d];
		}
		function Nt(e, t, n, r, i) {
			for (var a = 1, o = n + 1; o < t.length; ++o) a *= t[o];
			var s = t[n];
			if (t.length - n === 4) {
				var c = t[n + 1], l = t[n + 2], u = t[n + 3];
				for (o = 0; o < s; ++o) Mt(e[o], c, l, u, r, i), i += a;
			} else for (o = 0; o < s; ++o) Nt(e[o], t, n + 1, r, i), i += a;
		}
		function Pt(e, t, n, r) {
			var i = 1;
			if (t.length) for (var a = 0; a < t.length; ++a) i *= t[a];
			else i = 0;
			var o = r || Y.allocType(n, i);
			switch (t.length) {
				case 0: break;
				case 1:
					At(e, t[0], o);
					break;
				case 2:
					jt(e, t[0], t[1], o);
					break;
				case 3:
					Mt(e, t[0], t[1], t[2], o, 0);
					break;
				default: Nt(e, t, 0, o, 0);
			}
			return o;
		}
		function Ft(e) {
			for (var t = [], n = e; n.length; n = n[0]) t.push(n.length);
			return t;
		}
		var It = {
			"[object Int8Array]": 5120,
			"[object Int16Array]": 5122,
			"[object Int32Array]": 5124,
			"[object Uint8Array]": 5121,
			"[object Uint8ClampedArray]": 5121,
			"[object Uint16Array]": 5123,
			"[object Uint32Array]": 5125,
			"[object Float32Array]": 5126,
			"[object Float64Array]": 5121,
			"[object ArrayBuffer]": 5121
		}, Lt = {
			int8: 5120,
			int16: 5122,
			int32: 5124,
			uint8: 5121,
			uint16: 5123,
			uint32: 5125,
			float: 5126,
			float32: 5126
		}, Rt = {
			dynamic: 35048,
			stream: 35040,
			static: 35044
		}, zt = X.flatten, Bt = X.shape, Vt = 35044, Ht = 35040, Ut = 5121, Wt = 5126, Gt = [];
		Gt[5120] = 1, Gt[5122] = 2, Gt[5124] = 4, Gt[5121] = 1, Gt[5123] = 2, Gt[5125] = 4, Gt[5126] = 4;
		function Kt(e) {
			return It[Object.prototype.toString.call(e)] | 0;
		}
		function qt(e, t) {
			for (var n = 0; n < t.length; ++n) e[n] = t[n];
		}
		function Jt(e, t, n, r, i, a, o) {
			for (var s = 0, c = 0; c < n; ++c) for (var l = 0; l < r; ++l) e[s++] = t[i * c + a * l + o];
		}
		function Yt(t, n, r, i) {
			var a = 0, o = {};
			function s(e) {
				this.id = a++, this.buffer = t.createBuffer(), this.type = e, this.usage = Vt, this.byteLength = 0, this.dimension = 1, this.dtype = Ut, this.persistentData = null, r.profile && (this.stats = { size: 0 });
			}
			s.prototype.bind = function() {
				t.bindBuffer(this.type, this.buffer);
			}, s.prototype.destroy = function() {
				p(this);
			};
			var c = [];
			function l(e, t) {
				var n = c.pop();
				return n ||= new s(e), n.bind(), f(n, t, Ht, 0, 1, !1), n;
			}
			function u(e) {
				c.push(e);
			}
			function d(e, n, r) {
				e.byteLength = n.byteLength, t.bufferData(e.type, n, r);
			}
			function f(t, n, r, i, a, o) {
				var s;
				if (t.usage = r, Array.isArray(n)) {
					if (t.dtype = i || Wt, n.length > 0) {
						var c;
						if (Array.isArray(n[0])) {
							s = Bt(n);
							for (var l = 1, u = 1; u < s.length; ++u) l *= s[u];
							t.dimension = l, c = zt(n, s, t.dtype), d(t, c, r), o ? t.persistentData = c : Y.freeType(c);
						} else if (typeof n[0] == "number") {
							t.dimension = a;
							var f = Y.allocType(t.dtype, n.length);
							qt(f, n), d(t, f, r), o ? t.persistentData = f : Y.freeType(f);
						} else e(n[0]) ? (t.dimension = n[0].length, t.dtype = i || Kt(n[0]) || Wt, c = zt(n, [n.length, n[0].length], t.dtype), d(t, c, r), o ? t.persistentData = c : Y.freeType(c)) : J.raise("invalid buffer data");
					}
				} else if (e(n)) t.dtype = i || Kt(n), t.dimension = a, d(t, n, r), o && (t.persistentData = new Uint8Array(new Uint8Array(n.buffer)));
				else if (Ot(n)) {
					s = n.shape;
					var p = n.stride, m = n.offset, h = 0, g = 0, _ = 0, v = 0;
					s.length === 1 ? (h = s[0], g = 1, _ = p[0], v = 0) : s.length === 2 ? (h = s[0], g = s[1], _ = p[0], v = p[1]) : J.raise("invalid shape"), t.dtype = i || Kt(n.data) || Wt, t.dimension = g;
					var y = Y.allocType(t.dtype, h * g);
					Jt(y, n.data, h, g, _, v, m), d(t, y, r), o ? t.persistentData = y : Y.freeType(y);
				} else n instanceof ArrayBuffer ? (t.dtype = Ut, t.dimension = a, d(t, n, r), o && (t.persistentData = new Uint8Array(new Uint8Array(n)))) : J.raise("invalid buffer data");
			}
			function p(e) {
				n.bufferCount--, i(e);
				var r = e.buffer;
				J(r, "buffer must not be deleted already"), t.deleteBuffer(r), e.buffer = null, delete o[e.id];
			}
			function m(i, a, c, l) {
				n.bufferCount++;
				var u = new s(a);
				o[u.id] = u;
				function d(n) {
					var i = Vt, a = null, o = 0, s = 0, c = 1;
					return Array.isArray(n) || e(n) || Ot(n) || n instanceof ArrayBuffer ? a = n : typeof n == "number" ? o = n | 0 : n && (J.type(n, "object", "buffer arguments must be an object, a number or an array"), "data" in n && (J(a === null || Array.isArray(a) || e(a) || Ot(a), "invalid data for buffer"), a = n.data), "usage" in n && (J.parameter(n.usage, Rt, "invalid buffer usage"), i = Rt[n.usage]), "type" in n && (J.parameter(n.type, Lt, "invalid buffer type"), s = Lt[n.type]), "dimension" in n && (J.type(n.dimension, "number", "invalid dimension"), c = n.dimension | 0), "length" in n && (J.nni(o, "buffer length must be a nonnegative integer"), o = n.length | 0)), u.bind(), a ? f(u, a, i, s, c, l) : (o && t.bufferData(u.type, o, i), u.dtype = s || Ut, u.usage = i, u.dimension = c, u.byteLength = o), r.profile && (u.stats.size = u.byteLength * Gt[u.dtype]), d;
				}
				function m(e, n) {
					J(n + e.byteLength <= u.byteLength, "invalid buffer subdata call, buffer is too small.  Can't write data of size " + e.byteLength + " starting from offset " + n + " to a buffer of size " + u.byteLength), t.bufferSubData(u.type, n, e);
				}
				function h(t, n) {
					var r = (n || 0) | 0, i;
					if (u.bind(), e(t) || t instanceof ArrayBuffer) m(t, r);
					else if (Array.isArray(t)) {
						if (t.length > 0) {
							if (typeof t[0] == "number") {
								var a = Y.allocType(u.dtype, t.length);
								qt(a, t), m(a, r), Y.freeType(a);
							} else if (Array.isArray(t[0]) || e(t[0])) {
								i = Bt(t);
								var o = zt(t, i, u.dtype);
								m(o, r), Y.freeType(o);
							} else J.raise("invalid buffer data");
						}
					} else if (Ot(t)) {
						i = t.shape;
						var s = t.stride, c = 0, l = 0, f = 0, p = 0;
						i.length === 1 ? (c = i[0], l = 1, f = s[0], p = 0) : i.length === 2 ? (c = i[0], l = i[1], f = s[0], p = s[1]) : J.raise("invalid shape");
						var h = Array.isArray(t.data) ? u.dtype : Kt(t.data), g = Y.allocType(h, c * l);
						Jt(g, t.data, c, l, f, p, t.offset), m(g, r), Y.freeType(g);
					} else J.raise("invalid data for buffer subdata");
					return d;
				}
				return c || d(i), d._reglType = "buffer", d._buffer = u, d.subdata = h, r.profile && (d.stats = u.stats), d.destroy = function() {
					p(u);
				}, d;
			}
			function h() {
				kt(o).forEach(function(e) {
					e.buffer = t.createBuffer(), t.bindBuffer(e.type, e.buffer), t.bufferData(e.type, e.persistentData || e.byteLength, e.usage);
				});
			}
			return r.profile && (n.getTotalBufferSize = function() {
				var e = 0;
				return Object.keys(o).forEach(function(t) {
					e += o[t].stats.size;
				}), e;
			}), {
				create: m,
				createStream: l,
				destroyStream: u,
				clear: function() {
					kt(o).forEach(p), c.forEach(p);
				},
				getBuffer: function(e) {
					return e && e._buffer instanceof s ? e._buffer : null;
				},
				restore: h,
				_initBuffer: f
			};
		}
		var Xt = {
			points: 0,
			point: 0,
			lines: 1,
			line: 1,
			triangles: 4,
			triangle: 4,
			"line loop": 2,
			"line strip": 3,
			"triangle strip": 5,
			"triangle fan": 6
		}, Zt = 0, Qt = 1, $t = 4, en = 5120, tn = 5121, nn = 5122, rn = 5123, an = 5124, on = 5125, sn = 34963, cn = 35040, ln = 35044;
		function un(t, n, r, i) {
			var a = {}, o = 0, s = {
				uint8: tn,
				uint16: rn
			};
			n.oes_element_index_uint && (s.uint32 = on);
			function c(e) {
				this.id = o++, a[this.id] = this, this.buffer = e, this.primType = $t, this.vertCount = 0, this.type = 0;
			}
			c.prototype.bind = function() {
				this.buffer.bind();
			};
			var l = [];
			function u(e) {
				var t = l.pop();
				return t ||= new c(r.create(null, sn, !0, !1)._buffer), f(t, e, cn, -1, -1, 0, 0), t;
			}
			function d(e) {
				l.push(e);
			}
			function f(i, a, o, s, c, l, u) {
				i.buffer.bind();
				var d;
				if (a) {
					var f = u;
					!u && (!e(a) || Ot(a) && !e(a.data)) && (f = n.oes_element_index_uint ? on : rn), r._initBuffer(i.buffer, a, o, f, 3);
				} else t.bufferData(sn, l, o), i.buffer.dtype = d || tn, i.buffer.usage = o, i.buffer.dimension = 3, i.buffer.byteLength = l;
				if (d = u, !u) {
					switch (i.buffer.dtype) {
						case tn:
						case en:
							d = tn;
							break;
						case rn:
						case nn:
							d = rn;
							break;
						case on:
						case an:
							d = on;
							break;
						default: J.raise("unsupported type for element array");
					}
					i.buffer.dtype = d;
				}
				i.type = d, J(d !== on || !!n.oes_element_index_uint, "32 bit element buffers not supported, enable oes_element_index_uint first");
				var p = c;
				p < 0 && (p = i.buffer.byteLength, d === rn ? p >>= 1 : d === on && (p >>= 2)), i.vertCount = p;
				var m = s;
				if (s < 0) {
					m = $t;
					var h = i.buffer.dimension;
					h === 1 && (m = Zt), h === 2 && (m = Qt), h === 3 && (m = $t);
				}
				i.primType = m;
			}
			function p(e) {
				i.elementsCount--, J(e.buffer !== null, "must not double destroy elements"), delete a[e.id], e.buffer.destroy(), e.buffer = null;
			}
			function m(t, n) {
				var a = r.create(null, sn, !0), o = new c(a._buffer);
				i.elementsCount++;
				function l(t) {
					if (!t) a(), o.primType = $t, o.vertCount = 0, o.type = tn;
					else if (typeof t == "number") a(t), o.primType = $t, o.vertCount = t | 0, o.type = tn;
					else {
						var n = null, r = ln, i = -1, c = -1, u = 0, d = 0;
						Array.isArray(t) || e(t) || Ot(t) ? n = t : (J.type(t, "object", "invalid arguments for elements"), "data" in t && (n = t.data, J(Array.isArray(n) || e(n) || Ot(n), "invalid data for element buffer")), "usage" in t && (J.parameter(t.usage, Rt, "invalid element buffer usage"), r = Rt[t.usage]), "primitive" in t && (J.parameter(t.primitive, Xt, "invalid element buffer primitive"), i = Xt[t.primitive]), "count" in t && (J(typeof t.count == "number" && t.count >= 0, "invalid vertex count for elements"), c = t.count | 0), "type" in t && (J.parameter(t.type, s, "invalid buffer type"), d = s[t.type]), "length" in t ? u = t.length | 0 : (u = c, d === rn || d === nn ? u *= 2 : (d === on || d === an) && (u *= 4))), f(o, n, r, i, c, u, d);
					}
					return l;
				}
				return l(t), l._reglType = "elements", l._elements = o, l.subdata = function(e, t) {
					return a.subdata(e, t), l;
				}, l.destroy = function() {
					p(o);
				}, l;
			}
			return {
				create: m,
				createStream: u,
				destroyStream: d,
				getElements: function(e) {
					return typeof e == "function" && e._elements instanceof c ? e._elements : null;
				},
				clear: function() {
					kt(a).forEach(p);
				}
			};
		}
		var dn = /* @__PURE__ */ new Float32Array(1), fn = new Uint32Array(dn.buffer), pn = 5123;
		function mn(e) {
			for (var t = Y.allocType(pn, e.length), n = 0; n < e.length; ++n) if (isNaN(e[n])) t[n] = 65535;
			else if (e[n] === Infinity) t[n] = 31744;
			else if (e[n] === -Infinity) t[n] = 64512;
			else {
				dn[0] = e[n];
				var r = fn[0], i = r >>> 31 << 15, a = (r << 1 >>> 24) - 127, o = r >> 13 & 1023;
				if (a < -24) t[n] = i;
				else if (a < -14) {
					var s = -14 - a;
					t[n] = i + (o + 1024 >> s);
				} else a > 15 ? t[n] = i + 31744 : t[n] = i + (a + 15 << 10) + o;
			}
			return t;
		}
		function hn(t) {
			return Array.isArray(t) || e(t);
		}
		var gn = function(e) {
			return !(e & e - 1) && !!e;
		}, _n = 34467, Z = 3553, vn = 34067, yn = 34069, bn = 6408, xn = 6406, Sn = 6407, Cn = 6409, wn = 6410, Tn = 32854, En = 32855, Dn = 36194, On = 32819, kn = 32820, An = 33635, jn = 34042, Mn = 6402, Nn = 34041, Pn = 35904, Fn = 35906, In = 36193, Ln = 33776, Rn = 33777, zn = 33778, Bn = 33779, Vn = 35986, Hn = 35987, Un = 34798, Wn = 35840, Gn = 35841, Kn = 35842, qn = 35843, Jn = 36196, Yn = 5121, Xn = 5123, Zn = 5125, Qn = 5126, $n = 10242, er = 10243, tr = 10497, nr = 33071, rr = 33648, ir = 10240, ar = 10241, Q = 9728, or = 9729, sr = 9984, cr = 9985, lr = 9986, ur = 9987, dr = 33170, fr = 4352, pr = 4353, mr = 4354, hr = 34046, gr = 3317, _r = 37440, vr = 37441, yr = 37443, br = 37444, xr = 33984, Sr = [
			sr,
			lr,
			cr,
			ur
		], Cr = [
			0,
			Cn,
			wn,
			Sn,
			bn
		], wr = {};
		wr[Cn] = wr[xn] = wr[Mn] = 1, wr[Nn] = wr[wn] = 2, wr[Sn] = wr[Pn] = 3, wr[bn] = wr[Fn] = 4;
		function Tr(e) {
			return "[object " + e + "]";
		}
		var Er = Tr("HTMLCanvasElement"), Dr = Tr("OffscreenCanvas"), Or = Tr("CanvasRenderingContext2D"), kr = Tr("ImageBitmap"), Ar = Tr("HTMLImageElement"), jr = Tr("HTMLVideoElement"), Mr = Object.keys(It).concat([
			Er,
			Dr,
			Or,
			kr,
			Ar,
			jr
		]), Nr = [];
		Nr[Yn] = 1, Nr[Qn] = 4, Nr[In] = 2, Nr[Xn] = 2, Nr[Zn] = 4;
		var Pr = [];
		Pr[Tn] = 2, Pr[En] = 2, Pr[Dn] = 2, Pr[Nn] = 4, Pr[Ln] = .5, Pr[Rn] = .5, Pr[zn] = 1, Pr[Bn] = 1, Pr[Vn] = .5, Pr[Hn] = 1, Pr[Un] = 1, Pr[Wn] = .5, Pr[Gn] = .25, Pr[Kn] = .5, Pr[qn] = .25, Pr[Jn] = .5;
		function Fr(e) {
			return Array.isArray(e) && (e.length === 0 || typeof e[0] == "number");
		}
		function Ir(e) {
			return !(!Array.isArray(e) || e.length === 0 || !hn(e[0]));
		}
		function Lr(e) {
			return Object.prototype.toString.call(e);
		}
		function Rr(e) {
			return Lr(e) === Er;
		}
		function zr(e) {
			return Lr(e) === Dr;
		}
		function Br(e) {
			return Lr(e) === Or;
		}
		function Vr(e) {
			return Lr(e) === kr;
		}
		function Hr(e) {
			return Lr(e) === Ar;
		}
		function Ur(e) {
			return Lr(e) === jr;
		}
		function Wr(e) {
			if (!e) return !1;
			var t = Lr(e);
			return Mr.indexOf(t) >= 0 || Fr(e) || Ir(e) || Ot(e);
		}
		function Gr(e) {
			return It[Object.prototype.toString.call(e)] | 0;
		}
		function Kr(e, t) {
			var n = t.length;
			switch (e.type) {
				case Yn:
				case Xn:
				case Zn:
				case Qn:
					var r = Y.allocType(e.type, n);
					r.set(t), e.data = r;
					break;
				case In:
					e.data = mn(t);
					break;
				default: J.raise("unsupported texture type, must specify a typed array");
			}
		}
		function qr(e, t) {
			return Y.allocType(e.type === In ? Qn : e.type, t);
		}
		function Jr(e, t) {
			e.type === In ? (e.data = mn(t), Y.freeType(t)) : e.data = t;
		}
		function Yr(e, t, n, r, i, a) {
			for (var o = e.width, s = e.height, c = e.channels, l = qr(e, o * s * c), u = 0, d = 0; d < s; ++d) for (var f = 0; f < o; ++f) for (var p = 0; p < c; ++p) l[u++] = t[n * f + r * d + i * p + a];
			Jr(e, l);
		}
		function Xr(e, t, n, r, i, a) {
			var o = Pr[e] === void 0 ? wr[e] * Nr[t] : Pr[e];
			if (a && (o *= 6), i) {
				for (var s = 0, c = n; c >= 1;) s += o * c * c, c /= 2;
				return s;
			}
			return o * n * r;
		}
		function Zr(n, r, i, a, o, s, c) {
			var l = {
				"don't care": fr,
				"dont care": fr,
				nice: mr,
				fast: pr
			}, u = {
				repeat: tr,
				clamp: nr,
				mirror: rr
			}, d = {
				nearest: Q,
				linear: or
			}, f = t({
				mipmap: ur,
				"nearest mipmap nearest": sr,
				"linear mipmap nearest": cr,
				"nearest mipmap linear": lr,
				"linear mipmap linear": ur
			}, d), p = {
				none: 0,
				browser: br
			}, m = {
				uint8: Yn,
				rgba4: On,
				rgb565: An,
				"rgb5 a1": kn
			}, h = {
				alpha: xn,
				luminance: Cn,
				"luminance alpha": wn,
				rgb: Sn,
				rgba: bn,
				rgba4: Tn,
				"rgb5 a1": En,
				rgb565: Dn
			}, g = {};
			r.ext_srgb && (h.srgb = Pn, h.srgba = Fn), r.oes_texture_float && (m.float32 = m.float = Qn), r.oes_texture_half_float && (m.float16 = m["half float"] = In), r.webgl_depth_texture && (t(h, {
				depth: Mn,
				"depth stencil": Nn
			}), t(m, {
				uint16: Xn,
				uint32: Zn,
				"depth stencil": jn
			})), r.webgl_compressed_texture_s3tc && t(g, {
				"rgb s3tc dxt1": Ln,
				"rgba s3tc dxt1": Rn,
				"rgba s3tc dxt3": zn,
				"rgba s3tc dxt5": Bn
			}), r.webgl_compressed_texture_atc && t(g, {
				"rgb atc": Vn,
				"rgba atc explicit alpha": Hn,
				"rgba atc interpolated alpha": Un
			}), r.webgl_compressed_texture_pvrtc && t(g, {
				"rgb pvrtc 4bppv1": Wn,
				"rgb pvrtc 2bppv1": Gn,
				"rgba pvrtc 4bppv1": Kn,
				"rgba pvrtc 2bppv1": qn
			}), r.webgl_compressed_texture_etc1 && (g["rgb etc1"] = Jn);
			var _ = Array.prototype.slice.call(n.getParameter(_n));
			Object.keys(g).forEach(function(e) {
				var t = g[e];
				_.indexOf(t) >= 0 && (h[e] = t);
			});
			var v = Object.keys(h);
			i.textureFormats = v;
			var y = [];
			Object.keys(h).forEach(function(e) {
				var t = h[e];
				y[t] = e;
			});
			var b = [];
			Object.keys(m).forEach(function(e) {
				var t = m[e];
				b[t] = e;
			});
			var x = [];
			Object.keys(d).forEach(function(e) {
				var t = d[e];
				x[t] = e;
			});
			var S = [];
			Object.keys(f).forEach(function(e) {
				var t = f[e];
				S[t] = e;
			});
			var C = [];
			Object.keys(u).forEach(function(e) {
				var t = u[e];
				C[t] = e;
			});
			var w = v.reduce(function(e, t) {
				var n = h[t];
				return e[n] = n === Cn || n === xn || n === Cn || n === wn || n === Mn || n === Nn || r.ext_srgb && (n === Pn || n === Fn) ? n : n === En || t.indexOf("rgba") >= 0 ? bn : Sn, e;
			}, {});
			function T() {
				this.internalformat = bn, this.format = bn, this.type = Yn, this.compressed = !1, this.premultiplyAlpha = !1, this.flipY = !1, this.unpackAlignment = 1, this.colorSpace = br, this.width = 0, this.height = 0, this.channels = 0;
			}
			function E(e, t) {
				e.internalformat = t.internalformat, e.format = t.format, e.type = t.type, e.compressed = t.compressed, e.premultiplyAlpha = t.premultiplyAlpha, e.flipY = t.flipY, e.unpackAlignment = t.unpackAlignment, e.colorSpace = t.colorSpace, e.width = t.width, e.height = t.height, e.channels = t.channels;
			}
			function D(e, t) {
				if (!(typeof t != "object" || !t)) {
					if ("premultiplyAlpha" in t && (J.type(t.premultiplyAlpha, "boolean", "invalid premultiplyAlpha"), e.premultiplyAlpha = t.premultiplyAlpha), "flipY" in t && (J.type(t.flipY, "boolean", "invalid texture flip"), e.flipY = t.flipY), "alignment" in t && (J.oneOf(t.alignment, [
						1,
						2,
						4,
						8
					], "invalid texture unpack alignment"), e.unpackAlignment = t.alignment), "colorSpace" in t && (J.parameter(t.colorSpace, p, "invalid colorSpace"), e.colorSpace = p[t.colorSpace]), "type" in t) {
						var n = t.type;
						J(r.oes_texture_float || n !== "float" && n !== "float32", "you must enable the OES_texture_float extension in order to use floating point textures."), J(r.oes_texture_half_float || n !== "half float" && n !== "float16", "you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures."), J(r.webgl_depth_texture || n !== "uint16" && n !== "uint32" && n !== "depth stencil", "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures."), J.parameter(n, m, "invalid texture type"), e.type = m[n];
					}
					var a = e.width, o = e.height, s = e.channels, c = !1;
					"shape" in t ? (J(Array.isArray(t.shape) && t.shape.length >= 2, "shape must be an array"), a = t.shape[0], o = t.shape[1], t.shape.length === 3 && (s = t.shape[2], J(s > 0 && s <= 4, "invalid number of channels"), c = !0), J(a >= 0 && a <= i.maxTextureSize, "invalid width"), J(o >= 0 && o <= i.maxTextureSize, "invalid height")) : ("radius" in t && (a = o = t.radius, J(a >= 0 && a <= i.maxTextureSize, "invalid radius")), "width" in t && (a = t.width, J(a >= 0 && a <= i.maxTextureSize, "invalid width")), "height" in t && (o = t.height, J(o >= 0 && o <= i.maxTextureSize, "invalid height")), "channels" in t && (s = t.channels, J(s > 0 && s <= 4, "invalid number of channels"), c = !0)), e.width = a | 0, e.height = o | 0, e.channels = s | 0;
					var l = !1;
					if ("format" in t) {
						var u = t.format;
						J(r.webgl_depth_texture || u !== "depth" && u !== "depth stencil", "you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures."), J.parameter(u, h, "invalid texture format"), e.format = w[e.internalformat = h[u]], u in m && ("type" in t || (e.type = m[u])), u in g && (e.compressed = !0), l = !0;
					}
					!c && l ? e.channels = wr[e.format] : c && !l ? e.channels !== Cr[e.format] && (e.format = e.internalformat = Cr[e.channels]) : l && c && J(e.channels === wr[e.format], "number of channels inconsistent with specified format");
				}
			}
			function O(e) {
				n.pixelStorei(_r, e.flipY), n.pixelStorei(vr, e.premultiplyAlpha), n.pixelStorei(yr, e.colorSpace), n.pixelStorei(gr, e.unpackAlignment);
			}
			function k() {
				T.call(this), this.xOffset = 0, this.yOffset = 0, this.data = null, this.needsFree = !1, this.element = null, this.needsCopy = !1;
			}
			function A(t, n) {
				var r = null;
				if (Wr(n) ? r = n : n && (J.type(n, "object", "invalid pixel data type"), D(t, n), "x" in n && (t.xOffset = n.x | 0), "y" in n && (t.yOffset = n.y | 0), Wr(n.data) && (r = n.data)), J(!t.compressed || r instanceof Uint8Array, "compressed texture data must be stored in a uint8array"), n.copy) {
					J(!r, "can not specify copy and data field for the same texture");
					var a = o.viewportWidth, s = o.viewportHeight;
					t.width = t.width || a - t.xOffset, t.height = t.height || s - t.yOffset, t.needsCopy = !0, J(t.xOffset >= 0 && t.xOffset < a && t.yOffset >= 0 && t.yOffset < s && t.width > 0 && t.width <= a && t.height > 0 && t.height <= s, "copy texture read out of bounds");
				} else if (!r) t.width = t.width || 1, t.height = t.height || 1, t.channels = t.channels || 4;
				else if (e(r)) t.channels = t.channels || 4, t.data = r, !("type" in n) && t.type === Yn && (t.type = Gr(r));
				else if (Fr(r)) t.channels = t.channels || 4, Kr(t, r), t.alignment = 1, t.needsFree = !0;
				else if (Ot(r)) {
					var c = r.data;
					!Array.isArray(c) && t.type === Yn && (t.type = Gr(c));
					var l = r.shape, u = r.stride, d, f, p, m, h, g;
					l.length === 3 ? (p = l[2], g = u[2]) : (J(l.length === 2, "invalid ndarray pixel data, must be 2 or 3D"), p = 1, g = 1), d = l[0], f = l[1], m = u[0], h = u[1], t.alignment = 1, t.width = d, t.height = f, t.channels = p, t.format = t.internalformat = Cr[p], t.needsFree = !0, Yr(t, c, m, h, g, r.offset);
				} else if (Rr(r) || zr(r) || Br(r)) t.element = Rr(r) || zr(r) ? r : r.canvas, t.width = t.element.width, t.height = t.element.height, t.channels = 4;
				else if (Vr(r)) t.element = r, t.width = r.width, t.height = r.height, t.channels = 4;
				else if (Hr(r)) t.element = r, t.width = r.naturalWidth, t.height = r.naturalHeight, t.channels = 4;
				else if (Ur(r)) t.element = r, t.width = r.videoWidth, t.height = r.videoHeight, t.channels = 4;
				else if (Ir(r)) {
					var _ = t.width || r[0].length, v = t.height || r.length, y = t.channels;
					hn(r[0][0]) ? y ||= r[0][0].length : y ||= 1;
					for (var b = X.shape(r), x = 1, S = 0; S < b.length; ++S) x *= b[S];
					var C = qr(t, x);
					X.flatten(r, b, "", C), Jr(t, C), t.alignment = 1, t.width = _, t.height = v, t.channels = y, t.format = t.internalformat = Cr[y], t.needsFree = !0;
				}
				t.type === Qn ? J(i.extensions.indexOf("oes_texture_float") >= 0, "oes_texture_float extension not enabled") : t.type === In && J(i.extensions.indexOf("oes_texture_half_float") >= 0, "oes_texture_half_float extension not enabled");
			}
			function j(e, t, r) {
				var i = e.element, o = e.data, s = e.internalformat, c = e.format, l = e.type, u = e.width, d = e.height;
				O(e), i ? n.texImage2D(t, r, c, c, l, i) : e.compressed ? n.compressedTexImage2D(t, r, s, u, d, 0, o) : e.needsCopy ? (a(), n.copyTexImage2D(t, r, c, e.xOffset, e.yOffset, u, d, 0)) : n.texImage2D(t, r, c, u, d, 0, c, l, o || null);
			}
			function M(e, t, r, i, o) {
				var s = e.element, c = e.data, l = e.internalformat, u = e.format, d = e.type, f = e.width, p = e.height;
				O(e), s ? n.texSubImage2D(t, o, r, i, u, d, s) : e.compressed ? n.compressedTexSubImage2D(t, o, r, i, l, f, p, c) : e.needsCopy ? (a(), n.copyTexSubImage2D(t, o, r, i, e.xOffset, e.yOffset, f, p)) : n.texSubImage2D(t, o, r, i, f, p, u, d, c);
			}
			var N = [];
			function P() {
				return N.pop() || new k();
			}
			function F(e) {
				e.needsFree && Y.freeType(e.data), k.call(e), N.push(e);
			}
			function I() {
				T.call(this), this.genMipmaps = !1, this.mipmapHint = fr, this.mipmask = 0, this.images = Array(16);
			}
			function L(e, t, n) {
				var r = e.images[0] = P();
				e.mipmask = 1, r.width = e.width = t, r.height = e.height = n, r.channels = e.channels = 4;
			}
			function R(e, t) {
				var n = null;
				if (Wr(t)) n = e.images[0] = P(), E(n, e), A(n, t), e.mipmask = 1;
				else if (D(e, t), Array.isArray(t.mipmap)) for (var r = t.mipmap, i = 0; i < r.length; ++i) n = e.images[i] = P(), E(n, e), n.width >>= i, n.height >>= i, A(n, r[i]), e.mipmask |= 1 << i;
				else n = e.images[0] = P(), E(n, e), A(n, t), e.mipmask = 1;
				E(e, e.images[0]), e.compressed && (e.internalformat === Ln || e.internalformat === Rn || e.internalformat === zn || e.internalformat === Bn) && J(e.width % 4 == 0 && e.height % 4 == 0, "for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4");
			}
			function ee(e, t) {
				for (var n = e.images, r = 0; r < n.length; ++r) {
					if (!n[r]) return;
					j(n[r], t, r);
				}
			}
			var z = [];
			function B() {
				var e = z.pop() || new I();
				T.call(e), e.mipmask = 0;
				for (var t = 0; t < 16; ++t) e.images[t] = null;
				return e;
			}
			function V(e) {
				for (var t = e.images, n = 0; n < t.length; ++n) t[n] && F(t[n]), t[n] = null;
				z.push(e);
			}
			function H() {
				this.minFilter = Q, this.magFilter = Q, this.wrapS = nr, this.wrapT = nr, this.anisotropic = 1, this.genMipmaps = !1, this.mipmapHint = fr;
			}
			function te(e, t) {
				if ("min" in t) {
					var n = t.min;
					J.parameter(n, f), e.minFilter = f[n], Sr.indexOf(e.minFilter) >= 0 && !("faces" in t) && (e.genMipmaps = !0);
				}
				if ("mag" in t) {
					var r = t.mag;
					J.parameter(r, d), e.magFilter = d[r];
				}
				var a = e.wrapS, o = e.wrapT;
				if ("wrap" in t) {
					var s = t.wrap;
					typeof s == "string" ? (J.parameter(s, u), a = o = u[s]) : Array.isArray(s) && (J.parameter(s[0], u), J.parameter(s[1], u), a = u[s[0]], o = u[s[1]]);
				} else {
					if ("wrapS" in t) {
						var c = t.wrapS;
						J.parameter(c, u), a = u[c];
					}
					if ("wrapT" in t) {
						var p = t.wrapT;
						J.parameter(p, u), o = u[p];
					}
				}
				if (e.wrapS = a, e.wrapT = o, "anisotropic" in t) {
					var m = t.anisotropic;
					J(typeof m == "number" && m >= 1 && m <= i.maxAnisotropic, "aniso samples must be between 1 and "), e.anisotropic = t.anisotropic;
				}
				if ("mipmap" in t) {
					var h = !1;
					switch (typeof t.mipmap) {
						case "string":
							J.parameter(t.mipmap, l, "invalid mipmap hint"), e.mipmapHint = l[t.mipmap], e.genMipmaps = !0, h = !0;
							break;
						case "boolean":
							h = e.genMipmaps = t.mipmap;
							break;
						case "object":
							J(Array.isArray(t.mipmap), "invalid mipmap type"), e.genMipmaps = !1, h = !0;
							break;
						default: J.raise("invalid mipmap type");
					}
					h && !("min" in t) && (e.minFilter = sr);
				}
			}
			function U(e, t) {
				n.texParameteri(t, ar, e.minFilter), n.texParameteri(t, ir, e.magFilter), n.texParameteri(t, $n, e.wrapS), n.texParameteri(t, er, e.wrapT), r.ext_texture_filter_anisotropic && n.texParameteri(t, hr, e.anisotropic), e.genMipmaps && (n.hint(dr, e.mipmapHint), n.generateMipmap(t));
			}
			var W = 0, G = {}, ne = i.maxTextureUnits, K = Array(ne).map(function() {
				return null;
			});
			function re(e) {
				T.call(this), this.mipmask = 0, this.internalformat = bn, this.id = W++, this.refCount = 1, this.target = e, this.texture = n.createTexture(), this.unit = -1, this.bindCount = 0, this.texInfo = new H(), c.profile && (this.stats = { size: 0 });
			}
			function ie(e) {
				n.activeTexture(xr), n.bindTexture(e.target, e.texture);
			}
			function q() {
				var e = K[0];
				e ? n.bindTexture(e.target, e.texture) : n.bindTexture(Z, null);
			}
			function ae(e) {
				var t = e.texture;
				J(t, "must not double destroy texture");
				var r = e.unit, i = e.target;
				r >= 0 && (n.activeTexture(xr + r), n.bindTexture(i, null), K[r] = null), n.deleteTexture(t), e.texture = null, e.params = null, e.pixels = null, e.refCount = 0, delete G[e.id], s.textureCount--;
			}
			t(re.prototype, {
				bind: function() {
					var e = this;
					e.bindCount += 1;
					var t = e.unit;
					if (t < 0) {
						for (var r = 0; r < ne; ++r) {
							var i = K[r];
							if (i) {
								if (i.bindCount > 0) continue;
								i.unit = -1;
							}
							K[r] = e, t = r;
							break;
						}
						t >= ne && J.raise("insufficient number of texture units"), c.profile && s.maxTextureUnits < t + 1 && (s.maxTextureUnits = t + 1), e.unit = t, n.activeTexture(xr + t), n.bindTexture(e.target, e.texture);
					}
					return t;
				},
				unbind: function() {
					--this.bindCount;
				},
				decRef: function() {
					--this.refCount <= 0 && ae(this);
				}
			});
			function oe(e, t) {
				var r = new re(Z);
				G[r.id] = r, s.textureCount++;
				function a(e, t) {
					var n = r.texInfo;
					H.call(n);
					var o = B();
					return typeof e == "number" ? typeof t == "number" ? L(o, e | 0, t | 0) : L(o, e | 0, e | 0) : e ? (J.type(e, "object", "invalid arguments to regl.texture"), te(n, e), R(o, e)) : L(o, 1, 1), n.genMipmaps && (o.mipmask = (o.width << 1) - 1), r.mipmask = o.mipmask, E(r, o), J.texture2D(n, o, i), r.internalformat = o.internalformat, a.width = o.width, a.height = o.height, ie(r), ee(o, Z), U(n, Z), q(), V(o), c.profile && (r.stats.size = Xr(r.internalformat, r.type, o.width, o.height, n.genMipmaps, !1)), a.format = y[r.internalformat], a.type = b[r.type], a.mag = x[n.magFilter], a.min = S[n.minFilter], a.wrapS = C[n.wrapS], a.wrapT = C[n.wrapT], a;
				}
				function o(e, t, n, i) {
					J(!!e, "must specify image data");
					var o = t | 0, s = n | 0, c = i | 0, l = P();
					return E(l, r), l.width = 0, l.height = 0, A(l, e), l.width = l.width || (r.width >> c) - o, l.height = l.height || (r.height >> c) - s, J(r.type === l.type && r.format === l.format && r.internalformat === l.internalformat, "incompatible format for texture.subimage"), J(o >= 0 && s >= 0 && o + l.width <= r.width && s + l.height <= r.height, "texture.subimage write out of bounds"), J(r.mipmask & 1 << c, "missing mipmap data"), J(l.data || l.element || l.needsCopy, "missing image data"), ie(r), M(l, Z, o, s, c), q(), F(l), a;
				}
				function l(e, t) {
					var i = e | 0, o = t | 0 || i;
					if (i === r.width && o === r.height) return a;
					a.width = r.width = i, a.height = r.height = o, ie(r);
					for (var s = 0; r.mipmask >> s; ++s) {
						var l = i >> s, u = o >> s;
						if (!l || !u) break;
						n.texImage2D(Z, s, r.format, l, u, 0, r.format, r.type, null);
					}
					return q(), c.profile && (r.stats.size = Xr(r.internalformat, r.type, i, o, !1, !1)), a;
				}
				return a(e, t), a.subimage = o, a.resize = l, a._reglType = "texture2d", a._texture = r, c.profile && (a.stats = r.stats), a.destroy = function() {
					r.decRef();
				}, a;
			}
			function se(e, t, r, a, o, l) {
				var u = new re(vn);
				G[u.id] = u, s.cubeCount++;
				var d = [
					,
					,
					,
					,
					,
					,
				];
				function f(e, t, n, r, a, o) {
					var s, l = u.texInfo;
					for (H.call(l), s = 0; s < 6; ++s) d[s] = B();
					if (typeof e == "number" || !e) {
						var p = e | 0 || 1;
						for (s = 0; s < 6; ++s) L(d[s], p, p);
					} else if (typeof e == "object") {
						if (t) R(d[0], e), R(d[1], t), R(d[2], n), R(d[3], r), R(d[4], a), R(d[5], o);
						else if (te(l, e), D(u, e), "faces" in e) {
							var m = e.faces;
							for (J(Array.isArray(m) && m.length === 6, "cube faces must be a length 6 array"), s = 0; s < 6; ++s) J(typeof m[s] == "object" && !!m[s], "invalid input for cube map face"), E(d[s], u), R(d[s], m[s]);
						} else for (s = 0; s < 6; ++s) R(d[s], e);
					} else J.raise("invalid arguments to cube map");
					for (E(u, d[0]), J.optional(function() {
						i.npotTextureCube || J(gn(u.width) && gn(u.height), "your browser does not support non power or two texture dimensions");
					}), u.mipmask = l.genMipmaps ? (d[0].width << 1) - 1 : d[0].mipmask, J.textureCube(u, l, d, i), u.internalformat = d[0].internalformat, f.width = d[0].width, f.height = d[0].height, ie(u), s = 0; s < 6; ++s) ee(d[s], yn + s);
					for (U(l, vn), q(), c.profile && (u.stats.size = Xr(u.internalformat, u.type, f.width, f.height, l.genMipmaps, !0)), f.format = y[u.internalformat], f.type = b[u.type], f.mag = x[l.magFilter], f.min = S[l.minFilter], f.wrapS = C[l.wrapS], f.wrapT = C[l.wrapT], s = 0; s < 6; ++s) V(d[s]);
					return f;
				}
				function p(e, t, n, r, i) {
					J(!!t, "must specify image data"), J(typeof e == "number" && e === (e | 0) && e >= 0 && e < 6, "invalid face");
					var a = n | 0, o = r | 0, s = i | 0, c = P();
					return E(c, u), c.width = 0, c.height = 0, A(c, t), c.width = c.width || (u.width >> s) - a, c.height = c.height || (u.height >> s) - o, J(u.type === c.type && u.format === c.format && u.internalformat === c.internalformat, "incompatible format for texture.subimage"), J(a >= 0 && o >= 0 && a + c.width <= u.width && o + c.height <= u.height, "texture.subimage write out of bounds"), J(u.mipmask & 1 << s, "missing mipmap data"), J(c.data || c.element || c.needsCopy, "missing image data"), ie(u), M(c, yn + e, a, o, s), q(), F(c), f;
				}
				function m(e) {
					var t = e | 0;
					if (t !== u.width) {
						f.width = u.width = t, f.height = u.height = t, ie(u);
						for (var r = 0; r < 6; ++r) for (var i = 0; u.mipmask >> i; ++i) n.texImage2D(yn + r, i, u.format, t >> i, t >> i, 0, u.format, u.type, null);
						return q(), c.profile && (u.stats.size = Xr(u.internalformat, u.type, f.width, f.height, !1, !0)), f;
					}
				}
				return f(e, t, r, a, o, l), f.subimage = p, f.resize = m, f._reglType = "textureCube", f._texture = u, c.profile && (f.stats = u.stats), f.destroy = function() {
					u.decRef();
				}, f;
			}
			function ce() {
				for (var e = 0; e < ne; ++e) n.activeTexture(xr + e), n.bindTexture(Z, null), K[e] = null;
				kt(G).forEach(ae), s.cubeCount = 0, s.textureCount = 0;
			}
			c.profile && (s.getTotalTextureSize = function() {
				var e = 0;
				return Object.keys(G).forEach(function(t) {
					e += G[t].stats.size;
				}), e;
			});
			function le() {
				for (var e = 0; e < ne; ++e) {
					var t = K[e];
					t && (t.bindCount = 0, t.unit = -1, K[e] = null);
				}
				kt(G).forEach(function(e) {
					e.texture = n.createTexture(), n.bindTexture(e.target, e.texture);
					for (var t = 0; t < 32; ++t) if (e.mipmask & 1 << t) {
						if (e.target === Z) n.texImage2D(Z, t, e.internalformat, e.width >> t, e.height >> t, 0, e.internalformat, e.type, null);
						else for (var r = 0; r < 6; ++r) n.texImage2D(yn + r, t, e.internalformat, e.width >> t, e.height >> t, 0, e.internalformat, e.type, null);
					}
					U(e.texInfo, e.target);
				});
			}
			function ue() {
				for (var e = 0; e < ne; ++e) {
					var t = K[e];
					t && (t.bindCount = 0, t.unit = -1, K[e] = null), n.activeTexture(xr + e), n.bindTexture(Z, null), n.bindTexture(vn, null);
				}
			}
			return {
				create2D: oe,
				createCube: se,
				clear: ce,
				getTexture: function(e) {
					return null;
				},
				restore: le,
				refresh: ue
			};
		}
		var $ = 36161, Qr = 32854, $r = 32855, ei = 36194, ti = 33189, ni = 36168, ri = 34041, ii = 35907, ai = 34836, oi = 34842, si = 34843, ci = [];
		ci[Qr] = 2, ci[$r] = 2, ci[ei] = 2, ci[ti] = 2, ci[ni] = 1, ci[ri] = 4, ci[ii] = 4, ci[ai] = 16, ci[oi] = 8, ci[si] = 6;
		function li(e, t, n) {
			return ci[e] * t * n;
		}
		var ui = function(e, t, n, r, i) {
			var a = {
				rgba4: Qr,
				rgb565: ei,
				"rgb5 a1": $r,
				depth: ti,
				stencil: ni,
				"depth stencil": ri
			};
			t.ext_srgb && (a.srgba = ii), t.ext_color_buffer_half_float && (a.rgba16f = oi, a.rgb16f = si), t.webgl_color_buffer_float && (a.rgba32f = ai);
			var o = [];
			Object.keys(a).forEach(function(e) {
				var t = a[e];
				o[t] = e;
			});
			var s = 0, c = {};
			function l(e) {
				this.id = s++, this.refCount = 1, this.renderbuffer = e, this.format = Qr, this.width = 0, this.height = 0, i.profile && (this.stats = { size: 0 });
			}
			l.prototype.decRef = function() {
				--this.refCount <= 0 && u(this);
			};
			function u(t) {
				var n = t.renderbuffer;
				J(n, "must not double destroy renderbuffer"), e.bindRenderbuffer($, null), e.deleteRenderbuffer(n), t.renderbuffer = null, t.refCount = 0, delete c[t.id], r.renderbufferCount--;
			}
			function d(t, s) {
				var u = new l(e.createRenderbuffer());
				c[u.id] = u, r.renderbufferCount++;
				function d(t, r) {
					var s = 0, c = 0, l = Qr;
					if (typeof t == "object" && t) {
						var f = t;
						if ("shape" in f) {
							var p = f.shape;
							J(Array.isArray(p) && p.length >= 2, "invalid renderbuffer shape"), s = p[0] | 0, c = p[1] | 0;
						} else "radius" in f && (s = c = f.radius | 0), "width" in f && (s = f.width | 0), "height" in f && (c = f.height | 0);
						"format" in f && (J.parameter(f.format, a, "invalid renderbuffer format"), l = a[f.format]);
					} else typeof t == "number" ? (s = t | 0, c = typeof r == "number" ? r | 0 : s) : t ? J.raise("invalid arguments to renderbuffer constructor") : s = c = 1;
					if (J(s > 0 && c > 0 && s <= n.maxRenderbufferSize && c <= n.maxRenderbufferSize, "invalid renderbuffer size"), s !== u.width || c !== u.height || l !== u.format) return d.width = u.width = s, d.height = u.height = c, u.format = l, e.bindRenderbuffer($, u.renderbuffer), e.renderbufferStorage($, l, s, c), J(e.getError() === 0, "invalid render buffer format"), i.profile && (u.stats.size = li(u.format, u.width, u.height)), d.format = o[u.format], d;
				}
				function f(t, r) {
					var a = t | 0, o = r | 0 || a;
					return a === u.width && o === u.height ? d : (J(a > 0 && o > 0 && a <= n.maxRenderbufferSize && o <= n.maxRenderbufferSize, "invalid renderbuffer size"), d.width = u.width = a, d.height = u.height = o, e.bindRenderbuffer($, u.renderbuffer), e.renderbufferStorage($, u.format, a, o), J(e.getError() === 0, "invalid render buffer format"), i.profile && (u.stats.size = li(u.format, u.width, u.height)), d);
				}
				return d(t, s), d.resize = f, d._reglType = "renderbuffer", d._renderbuffer = u, i.profile && (d.stats = u.stats), d.destroy = function() {
					u.decRef();
				}, d;
			}
			i.profile && (r.getTotalRenderbufferSize = function() {
				var e = 0;
				return Object.keys(c).forEach(function(t) {
					e += c[t].stats.size;
				}), e;
			});
			function f() {
				kt(c).forEach(function(t) {
					t.renderbuffer = e.createRenderbuffer(), e.bindRenderbuffer($, t.renderbuffer), e.renderbufferStorage($, t.format, t.width, t.height);
				}), e.bindRenderbuffer($, null);
			}
			return {
				create: d,
				clear: function() {
					kt(c).forEach(u);
				},
				restore: f
			};
		}, di = 36160, fi = 36161, pi = 3553, mi = 34069, hi = 36064, gi = 36096, _i = 36128, vi = 33306, yi = 36053, bi = 36054, xi = 36055, Si = 36057, Ci = 36061, wi = 36193, Ti = 5121, Ei = 5126, Di = 6407, Oi = 6408, ki = 6402, Ai = [Di, Oi], ji = [];
		ji[Oi] = 4, ji[Di] = 3;
		var Mi = [];
		Mi[Ti] = 1, Mi[Ei] = 4, Mi[wi] = 2;
		var Ni = 32854, Pi = 32855, Fi = 36194, Ii = 33189, Li = 36168, Ri = 34041, zi = [
			Ni,
			Pi,
			Fi,
			35907,
			34842,
			34843,
			34836
		], Bi = {};
		Bi[yi] = "complete", Bi[bi] = "incomplete attachment", Bi[Si] = "incomplete dimensions", Bi[xi] = "incomplete, missing attachment", Bi[Ci] = "unsupported";
		function Vi(e, n, r, i, a, o) {
			var s = {
				cur: null,
				next: null,
				dirty: !1,
				setFBO: null
			}, c = ["rgba"], l = [
				"rgba4",
				"rgb565",
				"rgb5 a1"
			];
			n.ext_srgb && l.push("srgba"), n.ext_color_buffer_half_float && l.push("rgba16f", "rgb16f"), n.webgl_color_buffer_float && l.push("rgba32f");
			var u = ["uint8"];
			n.oes_texture_half_float && u.push("half float", "float16"), n.oes_texture_float && u.push("float", "float32");
			function d(e, t, n) {
				this.target = e, this.texture = t, this.renderbuffer = n;
				var r = 0, i = 0;
				t ? (r = t.width, i = t.height) : n && (r = n.width, i = n.height), this.width = r, this.height = i;
			}
			function f(e) {
				e && (e.texture && e.texture._texture.decRef(), e.renderbuffer && e.renderbuffer._renderbuffer.decRef());
			}
			function p(e, t, n) {
				if (e) {
					if (e.texture) {
						var r = e.texture._texture, i = Math.max(1, r.width), a = Math.max(1, r.height);
						J(i === t && a === n, "inconsistent width/height for supplied texture"), r.refCount += 1;
					} else {
						var o = e.renderbuffer._renderbuffer;
						J(o.width === t && o.height === n, "inconsistent width/height for renderbuffer"), o.refCount += 1;
					}
				}
			}
			function m(t, n) {
				n && (n.texture ? e.framebufferTexture2D(di, t, n.target, n.texture._texture.texture, 0) : e.framebufferRenderbuffer(di, t, fi, n.renderbuffer._renderbuffer.renderbuffer));
			}
			function h(e) {
				var t = pi, n = null, r = null, i = e;
				typeof e == "object" && (i = e.data, "target" in e && (t = e.target | 0)), J.type(i, "function", "invalid attachment data");
				var a = i._reglType;
				return a === "texture2d" ? (n = i, J(t === pi)) : a === "textureCube" ? (n = i, J(t >= mi && t < mi + 6, "invalid cube map target")) : a === "renderbuffer" ? (r = i, t = fi) : J.raise("invalid regl object for attachment"), new d(t, n, r);
			}
			function g(e, t, n, r, o) {
				if (n) {
					var s = i.create2D({
						width: e,
						height: t,
						format: r,
						type: o
					});
					return s._texture.refCount = 0, new d(pi, s, null);
				}
				var c = a.create({
					width: e,
					height: t,
					format: r
				});
				return c._renderbuffer.refCount = 0, new d(fi, null, c);
			}
			function _(e) {
				return e && (e.texture || e.renderbuffer);
			}
			function v(e, t, n) {
				e && (e.texture ? e.texture.resize(t, n) : e.renderbuffer && e.renderbuffer.resize(t, n), e.width = t, e.height = n);
			}
			var y = 0, b = {};
			function x() {
				this.id = y++, b[this.id] = this, this.framebuffer = e.createFramebuffer(), this.width = 0, this.height = 0, this.colorAttachments = [], this.depthAttachment = null, this.stencilAttachment = null, this.depthStencilAttachment = null;
			}
			function S(e) {
				e.colorAttachments.forEach(f), f(e.depthAttachment), f(e.stencilAttachment), f(e.depthStencilAttachment);
			}
			function C(t) {
				var n = t.framebuffer;
				J(n, "must not double destroy framebuffer"), e.deleteFramebuffer(n), t.framebuffer = null, o.framebufferCount--, delete b[t.id];
			}
			function w(t) {
				var n;
				e.bindFramebuffer(di, t.framebuffer);
				var i = t.colorAttachments;
				for (n = 0; n < i.length; ++n) m(hi + n, i[n]);
				for (n = i.length; n < r.maxColorAttachments; ++n) e.framebufferTexture2D(di, hi + n, pi, null, 0);
				e.framebufferTexture2D(di, vi, pi, null, 0), e.framebufferTexture2D(di, gi, pi, null, 0), e.framebufferTexture2D(di, _i, pi, null, 0), m(gi, t.depthAttachment), m(_i, t.stencilAttachment), m(vi, t.depthStencilAttachment);
				var a = e.checkFramebufferStatus(di);
				!e.isContextLost() && a !== yi && J.raise("framebuffer configuration not supported, status = " + Bi[a]), e.bindFramebuffer(di, s.next ? s.next.framebuffer : null), s.cur = s.next, e.getError();
			}
			function T(e, i) {
				var a = new x();
				o.framebufferCount++;
				function d(e, t) {
					var i;
					J(s.next !== a, "can not update framebuffer which is currently in use");
					var o = 0, f = 0, m = !0, v = !0, y = null, b = !0, x = "rgba", C = "uint8", T = 1, E = null, D = null, O = null, k = !1;
					if (typeof e == "number") o = e | 0, f = t | 0 || o;
					else if (!e) o = f = 1;
					else {
						J.type(e, "object", "invalid arguments for framebuffer");
						var A = e;
						if ("shape" in A) {
							var j = A.shape;
							J(Array.isArray(j) && j.length >= 2, "invalid shape for framebuffer"), o = j[0], f = j[1];
						} else "radius" in A && (o = f = A.radius), "width" in A && (o = A.width), "height" in A && (f = A.height);
						("color" in A || "colors" in A) && (y = A.color || A.colors, Array.isArray(y) && J(y.length === 1 || n.webgl_draw_buffers, "multiple render targets not supported")), y || ("colorCount" in A && (T = A.colorCount | 0, J(T > 0, "invalid color buffer count")), "colorTexture" in A && (b = !!A.colorTexture, x = "rgba4"), "colorType" in A && (C = A.colorType, b ? (J(n.oes_texture_float || C !== "float" && C !== "float32", "you must enable OES_texture_float in order to use floating point framebuffer objects"), J(n.oes_texture_half_float || C !== "half float" && C !== "float16", "you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects")) : C === "half float" || C === "float16" ? (J(n.ext_color_buffer_half_float, "you must enable EXT_color_buffer_half_float to use 16-bit render buffers"), x = "rgba16f") : (C === "float" || C === "float32") && (J(n.webgl_color_buffer_float, "you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers"), x = "rgba32f"), J.oneOf(C, u, "invalid color type")), "colorFormat" in A && (x = A.colorFormat, c.indexOf(x) >= 0 ? b = !0 : l.indexOf(x) >= 0 ? b = !1 : J.optional(function() {
							b ? J.oneOf(A.colorFormat, c, "invalid color format for texture") : J.oneOf(A.colorFormat, l, "invalid color format for renderbuffer");
						}))), ("depthTexture" in A || "depthStencilTexture" in A) && (k = !!(A.depthTexture || A.depthStencilTexture), J(!k || n.webgl_depth_texture, "webgl_depth_texture extension not supported")), "depth" in A && (typeof A.depth == "boolean" ? m = A.depth : (E = A.depth, v = !1)), "stencil" in A && (typeof A.stencil == "boolean" ? v = A.stencil : (D = A.stencil, m = !1)), "depthStencil" in A && (typeof A.depthStencil == "boolean" ? m = v = A.depthStencil : (O = A.depthStencil, m = !1, v = !1));
					}
					var M = null, N = null, P = null, F = null;
					if (Array.isArray(y)) M = y.map(h);
					else if (y) M = [h(y)];
					else for (M = Array(T), i = 0; i < T; ++i) M[i] = g(o, f, b, x, C);
					J(n.webgl_draw_buffers || M.length <= 1, "you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers."), J(M.length <= r.maxColorAttachments, "too many color attachments, not supported"), o ||= M[0].width, f ||= M[0].height, E ? N = h(E) : m && !v && (N = g(o, f, k, "depth", "uint32")), D ? P = h(D) : v && !m && (P = g(o, f, !1, "stencil", "uint8")), O ? F = h(O) : !E && !D && v && m && (F = g(o, f, k, "depth stencil", "depth stencil")), J(!!E + !!D + !!O <= 1, "invalid framebuffer configuration, can specify exactly one depth/stencil attachment");
					var I = null;
					for (i = 0; i < M.length; ++i) if (p(M[i], o, f), J(!M[i] || M[i].texture && Ai.indexOf(M[i].texture._texture.format) >= 0 || M[i].renderbuffer && zi.indexOf(M[i].renderbuffer._renderbuffer.format) >= 0, "framebuffer color attachment " + i + " is invalid"), M[i] && M[i].texture) {
						var L = ji[M[i].texture._texture.format] * Mi[M[i].texture._texture.type];
						I === null ? I = L : J(I === L, "all color attachments much have the same number of bits per pixel.");
					}
					return p(N, o, f), J(!N || N.texture && N.texture._texture.format === ki || N.renderbuffer && N.renderbuffer._renderbuffer.format === Ii, "invalid depth attachment for framebuffer object"), p(P, o, f), J(!P || P.renderbuffer && P.renderbuffer._renderbuffer.format === Li, "invalid stencil attachment for framebuffer object"), p(F, o, f), J(!F || F.texture && F.texture._texture.format === Ri || F.renderbuffer && F.renderbuffer._renderbuffer.format === Ri, "invalid depth-stencil attachment for framebuffer object"), S(a), a.width = o, a.height = f, a.colorAttachments = M, a.depthAttachment = N, a.stencilAttachment = P, a.depthStencilAttachment = F, d.color = M.map(_), d.depth = _(N), d.stencil = _(P), d.depthStencil = _(F), d.width = a.width, d.height = a.height, w(a), d;
				}
				function f(e, t) {
					J(s.next !== a, "can not resize a framebuffer which is currently in use");
					var n = Math.max(e | 0, 1), r = Math.max(t | 0 || n, 1);
					if (n === a.width && r === a.height) return d;
					for (var i = a.colorAttachments, o = 0; o < i.length; ++o) v(i[o], n, r);
					return v(a.depthAttachment, n, r), v(a.stencilAttachment, n, r), v(a.depthStencilAttachment, n, r), a.width = d.width = n, a.height = d.height = r, w(a), d;
				}
				return d(e, i), t(d, {
					resize: f,
					_reglType: "framebuffer",
					_framebuffer: a,
					destroy: function() {
						C(a), S(a);
					},
					use: function(e) {
						s.setFBO({ framebuffer: d }, e);
					}
				});
			}
			function E(e) {
				var a = [
					,
					,
					,
					,
					,
					,
				];
				function o(e) {
					var r;
					J(a.indexOf(s.next) < 0, "can not update framebuffer which is currently in use");
					var l = { color: null }, d = 0, f = null, p = "rgba", m = "uint8", h = 1;
					if (typeof e == "number") d = e | 0;
					else if (!e) d = 1;
					else {
						J.type(e, "object", "invalid arguments for framebuffer");
						var g = e;
						if ("shape" in g) {
							var _ = g.shape;
							J(Array.isArray(_) && _.length >= 2, "invalid shape for framebuffer"), J(_[0] === _[1], "cube framebuffer must be square"), d = _[0];
						} else "radius" in g && (d = g.radius | 0), "width" in g ? (d = g.width | 0, "height" in g && J(g.height === d, "must be square")) : "height" in g && (d = g.height | 0);
						("color" in g || "colors" in g) && (f = g.color || g.colors, Array.isArray(f) && J(f.length === 1 || n.webgl_draw_buffers, "multiple render targets not supported")), f || ("colorCount" in g && (h = g.colorCount | 0, J(h > 0, "invalid color buffer count")), "colorType" in g && (J.oneOf(g.colorType, u, "invalid color type"), m = g.colorType), "colorFormat" in g && (p = g.colorFormat, J.oneOf(g.colorFormat, c, "invalid color format for texture"))), "depth" in g && (l.depth = g.depth), "stencil" in g && (l.stencil = g.stencil), "depthStencil" in g && (l.depthStencil = g.depthStencil);
					}
					var v;
					if (f) {
						if (Array.isArray(f)) for (v = [], r = 0; r < f.length; ++r) v[r] = f[r];
						else v = [f];
					} else {
						v = Array(h);
						var y = {
							radius: d,
							format: p,
							type: m
						};
						for (r = 0; r < h; ++r) v[r] = i.createCube(y);
					}
					for (l.color = Array(v.length), r = 0; r < v.length; ++r) {
						var b = v[r];
						J(typeof b == "function" && b._reglType === "textureCube", "invalid cube map"), d ||= b.width, J(b.width === d && b.height === d, "invalid cube map shape"), l.color[r] = {
							target: mi,
							data: v[r]
						};
					}
					for (r = 0; r < 6; ++r) {
						for (var x = 0; x < v.length; ++x) l.color[x].target = mi + r;
						r > 0 && (l.depth = a[0].depth, l.stencil = a[0].stencil, l.depthStencil = a[0].depthStencil), a[r] ? a[r](l) : a[r] = T(l);
					}
					return t(o, {
						width: d,
						height: d,
						color: v
					});
				}
				function l(e) {
					var t, n = e | 0;
					if (J(n > 0 && n <= r.maxCubeMapSize, "invalid radius for cube fbo"), n === o.width) return o;
					var i = o.color;
					for (t = 0; t < i.length; ++t) i[t].resize(n);
					for (t = 0; t < 6; ++t) a[t].resize(n);
					return o.width = o.height = n, o;
				}
				return o(e), t(o, {
					faces: a,
					resize: l,
					_reglType: "framebufferCube",
					destroy: function() {
						a.forEach(function(e) {
							e.destroy();
						});
					}
				});
			}
			function D() {
				s.cur = null, s.next = null, s.dirty = !0, kt(b).forEach(function(t) {
					t.framebuffer = e.createFramebuffer(), w(t);
				});
			}
			return t(s, {
				getFramebuffer: function(e) {
					if (typeof e == "function" && e._reglType === "framebuffer") {
						var t = e._framebuffer;
						if (t instanceof x) return t;
					}
					return null;
				},
				create: T,
				createCube: E,
				clear: function() {
					kt(b).forEach(C);
				},
				restore: D
			});
		}
		var Hi = 5126, Ui = 34962, Wi = 34963, Gi = [
			"attributes",
			"elements",
			"offset",
			"count",
			"primitive",
			"instances"
		];
		function Ki() {
			this.state = 0, this.x = 0, this.y = 0, this.z = 0, this.w = 0, this.buffer = null, this.size = 0, this.normalized = !1, this.type = Hi, this.offset = 0, this.stride = 0, this.divisor = 0;
		}
		function qi(t, n, r, i, a, o, s) {
			for (var c = r.maxAttributes, l = Array(c), u = 0; u < c; ++u) l[u] = new Ki();
			var d = 0, f = {}, p = {
				Record: Ki,
				scope: {},
				state: l,
				currentVAO: null,
				targetVAO: null,
				restore: h() ? S : function() {},
				createVAO: C,
				getVAO: _,
				destroyBuffer: m,
				setVAO: h() ? v : y,
				clear: h() ? b : function() {}
			};
			function m(e) {
				for (var n = 0; n < l.length; ++n) {
					var r = l[n];
					r.buffer === e && (t.disableVertexAttribArray(n), r.buffer = null);
				}
			}
			function h() {
				return n.oes_vertex_array_object;
			}
			function g() {
				return n.angle_instanced_arrays;
			}
			function _(e) {
				return typeof e == "function" && e._vao ? e._vao : null;
			}
			function v(e) {
				if (e !== p.currentVAO) {
					var t = h();
					e ? t.bindVertexArrayOES(e.vao) : t.bindVertexArrayOES(null), p.currentVAO = e;
				}
			}
			function y(e) {
				if (e !== p.currentVAO) {
					if (e) e.bindAttrs();
					else {
						for (var n = g(), r = 0; r < l.length; ++r) {
							var i = l[r];
							i.buffer ? (t.enableVertexAttribArray(r), i.buffer.bind(), t.vertexAttribPointer(r, i.size, i.type, i.normalized, i.stride, i.offfset), n && i.divisor && n.vertexAttribDivisorANGLE(r, i.divisor)) : (t.disableVertexAttribArray(r), t.vertexAttrib4f(r, i.x, i.y, i.z, i.w));
						}
						s.elements ? t.bindBuffer(Wi, s.elements.buffer.buffer) : t.bindBuffer(Wi, null);
					}
					p.currentVAO = e;
				}
			}
			function b() {
				kt(f).forEach(function(e) {
					e.destroy();
				});
			}
			function x() {
				this.id = ++d, this.attributes = [], this.elements = null, this.ownsElements = !1, this.count = 0, this.offset = 0, this.instances = -1, this.primitive = 4;
				var e = h();
				this.vao = e ? e.createVertexArrayOES() : null, f[this.id] = this, this.buffers = [];
			}
			x.prototype.bindAttrs = function() {
				for (var e = g(), n = this.attributes, r = 0; r < n.length; ++r) {
					var i = n[r];
					i.buffer ? (t.enableVertexAttribArray(r), t.bindBuffer(Ui, i.buffer.buffer), t.vertexAttribPointer(r, i.size, i.type, i.normalized, i.stride, i.offset), e && i.divisor && e.vertexAttribDivisorANGLE(r, i.divisor)) : (t.disableVertexAttribArray(r), t.vertexAttrib4f(r, i.x, i.y, i.z, i.w));
				}
				for (var a = n.length; a < c; ++a) t.disableVertexAttribArray(a);
				var s = o.getElements(this.elements);
				s ? t.bindBuffer(Wi, s.buffer.buffer) : t.bindBuffer(Wi, null);
			}, x.prototype.refresh = function() {
				var e = h();
				e && (e.bindVertexArrayOES(this.vao), this.bindAttrs(), p.currentVAO = null, e.bindVertexArrayOES(null));
			}, x.prototype.destroy = function() {
				if (this.vao) {
					var e = h();
					this === p.currentVAO && (p.currentVAO = null, e.bindVertexArrayOES(null)), e.deleteVertexArrayOES(this.vao), this.vao = null;
				}
				this.ownsElements &&= (this.elements.destroy(), this.elements = null, !1), f[this.id] && (delete f[this.id], --i.vaoCount);
			};
			function S() {
				h() && kt(f).forEach(function(e) {
					e.refresh();
				});
			}
			function C(t) {
				var r = new x();
				i.vaoCount += 1;
				function s(t) {
					var i;
					if (Array.isArray(t)) i = t, r.elements && r.ownsElements && r.elements.destroy(), r.elements = null, r.ownsElements = !1, r.offset = 0, r.count = 0, r.instances = -1, r.primitive = 4;
					else {
						if (J(typeof t == "object", "invalid arguments for create vao"), J("attributes" in t, "must specify attributes for vao"), t.elements) {
							var l = t.elements;
							r.ownsElements ? typeof l == "function" && l._reglType === "elements" ? (r.elements.destroy(), r.ownsElements = !1) : (r.elements(l), r.ownsElements = !1) : o.getElements(t.elements) ? (r.elements = t.elements, r.ownsElements = !1) : (r.elements = o.create(t.elements), r.ownsElements = !0);
						} else r.elements = null, r.ownsElements = !1;
						i = t.attributes, r.offset = 0, r.count = -1, r.instances = -1, r.primitive = 4, r.elements && (r.count = r.elements._elements.vertCount, r.primitive = r.elements._elements.primType), "offset" in t && (r.offset = t.offset | 0), "count" in t && (r.count = t.count | 0), "instances" in t && (r.instances = t.instances | 0), "primitive" in t && (J(t.primitive in Xt, "bad primitive type: " + t.primitive), r.primitive = Xt[t.primitive]), J.optional(() => {
							for (var e = Object.keys(t), n = 0; n < e.length; ++n) J(Gi.indexOf(e[n]) >= 0, "invalid option for vao: \"" + e[n] + "\" valid options are " + Gi);
						}), J(Array.isArray(i), "attributes must be an array");
					}
					J(i.length < c, "too many attributes"), J(i.length > 0, "must specify at least one attribute");
					var u = {}, d = r.attributes;
					d.length = i.length;
					for (var f = 0; f < i.length; ++f) {
						var p = i[f], m = d[f] = new Ki(), h = p.data || p;
						if (Array.isArray(h) || e(h) || Ot(h)) {
							var g;
							r.buffers[f] && (g = r.buffers[f], e(h) && g._buffer.byteLength >= h.byteLength ? g.subdata(h) : (g.destroy(), r.buffers[f] = null)), r.buffers[f] || (g = r.buffers[f] = a.create(p, Ui, !1, !0)), m.buffer = a.getBuffer(g), m.size = m.buffer.dimension | 0, m.normalized = !1, m.type = m.buffer.dtype, m.offset = 0, m.stride = 0, m.divisor = 0, m.state = 1, u[f] = 1;
						} else a.getBuffer(p) ? (m.buffer = a.getBuffer(p), m.size = m.buffer.dimension | 0, m.normalized = !1, m.type = m.buffer.dtype, m.offset = 0, m.stride = 0, m.divisor = 0, m.state = 1) : a.getBuffer(p.buffer) ? (m.buffer = a.getBuffer(p.buffer), m.size = (+p.size || m.buffer.dimension) | 0, m.normalized = !!p.normalized || !1, "type" in p ? (J.parameter(p.type, Lt, "invalid buffer type"), m.type = Lt[p.type]) : m.type = m.buffer.dtype, m.offset = (p.offset || 0) | 0, m.stride = (p.stride || 0) | 0, m.divisor = (p.divisor || 0) | 0, m.state = 1, J(m.size >= 1 && m.size <= 4, "size must be between 1 and 4"), J(m.offset >= 0, "invalid offset"), J(m.stride >= 0 && m.stride <= 255, "stride must be between 0 and 255"), J(m.divisor >= 0, "divisor must be positive"), J(!m.divisor || !!n.angle_instanced_arrays, "ANGLE_instanced_arrays must be enabled to use divisor")) : "x" in p ? (J(f > 0, "first attribute must not be a constant"), m.x = +p.x || 0, m.y = +p.y || 0, m.z = +p.z || 0, m.w = +p.w || 0, m.state = 2) : J(!1, "invalid attribute spec for location " + f);
					}
					for (var _ = 0; _ < r.buffers.length; ++_) !u[_] && r.buffers[_] && (r.buffers[_].destroy(), r.buffers[_] = null);
					return r.refresh(), s;
				}
				return s.destroy = function() {
					for (var e = 0; e < r.buffers.length; ++e) r.buffers[e] && r.buffers[e].destroy();
					r.buffers.length = 0, r.ownsElements &&= (r.elements.destroy(), r.elements = null, !1), r.destroy();
				}, s._vao = r, s._reglType = "vao", s(t);
			}
			return p;
		}
		var Ji = 35632, Yi = 35633, Xi = 35718, Zi = 35721;
		function Qi(e, n, r, i) {
			var a = {}, o = {};
			function s(e, t, n, r) {
				this.name = e, this.id = t, this.location = n, this.info = r;
			}
			function c(e, t) {
				for (var n = 0; n < e.length; ++n) if (e[n].id === t.id) {
					e[n].location = t.location;
					return;
				}
				e.push(t);
			}
			function l(t, r, i) {
				var s = t === Ji ? a : o, c = s[r];
				if (!c) {
					var l = n.str(r);
					c = e.createShader(t), e.shaderSource(c, l), e.compileShader(c), J.shaderError(e, c, l, t, i), s[r] = c;
				}
				return c;
			}
			var u = {}, d = [], f = 0;
			function p(e, t) {
				this.id = f++, this.fragId = e, this.vertId = t, this.program = null, this.uniforms = [], this.attributes = [], this.refCount = 1, i.profile && (this.stats = {
					uniformsCount: 0,
					attributesCount: 0
				});
			}
			function m(t, r, a) {
				var o, u, d = l(Ji, t.fragId), f = l(Yi, t.vertId), p = t.program = e.createProgram();
				if (e.attachShader(p, d), e.attachShader(p, f), a) for (o = 0; o < a.length; ++o) {
					var m = a[o];
					e.bindAttribLocation(p, m[0], m[1]);
				}
				e.linkProgram(p), J.linkError(e, p, n.str(t.fragId), n.str(t.vertId), r);
				var h = e.getProgramParameter(p, Xi);
				i.profile && (t.stats.uniformsCount = h);
				var g = t.uniforms;
				for (o = 0; o < h; ++o) if (u = e.getActiveUniform(p, o), u) {
					if (u.size > 1) for (var _ = 0; _ < u.size; ++_) {
						var v = u.name.replace("[0]", "[" + _ + "]");
						c(g, new s(v, n.id(v), e.getUniformLocation(p, v), u));
					}
					else c(g, new s(u.name, n.id(u.name), e.getUniformLocation(p, u.name), u));
				}
				var y = e.getProgramParameter(p, Zi);
				i.profile && (t.stats.attributesCount = y);
				var b = t.attributes;
				for (o = 0; o < y; ++o) u = e.getActiveAttrib(p, o), u && c(b, new s(u.name, n.id(u.name), e.getAttribLocation(p, u.name), u));
			}
			i.profile && (r.getMaxUniformsCount = function() {
				var e = 0;
				return d.forEach(function(t) {
					t.stats.uniformsCount > e && (e = t.stats.uniformsCount);
				}), e;
			}, r.getMaxAttributesCount = function() {
				var e = 0;
				return d.forEach(function(t) {
					t.stats.attributesCount > e && (e = t.stats.attributesCount);
				}), e;
			});
			function h() {
				a = {}, o = {};
				for (var e = 0; e < d.length; ++e) m(d[e], null, d[e].attributes.map(function(e) {
					return [e.location, e.name];
				}));
			}
			return {
				clear: function() {
					var t = e.deleteShader.bind(e);
					kt(a).forEach(t), a = {}, kt(o).forEach(t), o = {}, d.forEach(function(t) {
						e.deleteProgram(t.program);
					}), d.length = 0, u = {}, r.shaderCount = 0;
				},
				program: function(n, i, s, c) {
					J.command(n >= 0, "missing vertex shader", s), J.command(i >= 0, "missing fragment shader", s);
					var l = u[i];
					l ||= u[i] = {};
					var f = l[n];
					if (f && (f.refCount++, !c)) return f;
					var h = new p(i, n);
					return r.shaderCount++, m(h, s, c), f || (l[n] = h), d.push(h), t(h, { destroy: function() {
						if (h.refCount--, h.refCount <= 0) {
							e.deleteProgram(h.program);
							var t = d.indexOf(h);
							d.splice(t, 1), r.shaderCount--;
						}
						l[h.vertId].refCount <= 0 && (e.deleteShader(o[h.vertId]), delete o[h.vertId], delete u[h.fragId][h.vertId]), Object.keys(u[h.fragId]).length || (e.deleteShader(a[h.fragId]), delete a[h.fragId], delete u[h.fragId]);
					} });
				},
				restore: h,
				shader: l,
				frag: -1,
				vert: -1
			};
		}
		var $i = 6408, ea = 5121, ta = 3333, na = 5126;
		function ra(t, n, r, i, a, o, s) {
			function c(c) {
				var l;
				n.next === null ? (J(a.preserveDrawingBuffer, "you must create a webgl context with \"preserveDrawingBuffer\":true in order to read pixels from the drawing buffer"), l = ea) : (J(n.next.colorAttachments[0].texture !== null, "You cannot read from a renderbuffer"), l = n.next.colorAttachments[0].texture._texture.type, J.optional(function() {
					o.oes_texture_float ? (J(l === ea || l === na, "Reading from a framebuffer is only allowed for the types 'uint8' and 'float'"), l === na && J(s.readFloat, "Reading 'float' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float")) : J(l === ea, "Reading from a framebuffer is only allowed for the type 'uint8'");
				}));
				var u = 0, d = 0, f = i.framebufferWidth, p = i.framebufferHeight, m = null;
				e(c) ? m = c : c && (J.type(c, "object", "invalid arguments to regl.read()"), u = c.x | 0, d = c.y | 0, J(u >= 0 && u < i.framebufferWidth, "invalid x offset for regl.read"), J(d >= 0 && d < i.framebufferHeight, "invalid y offset for regl.read"), f = (c.width || i.framebufferWidth - u) | 0, p = (c.height || i.framebufferHeight - d) | 0, m = c.data || null), m && (l === ea ? J(m instanceof Uint8Array, "buffer must be 'Uint8Array' when reading from a framebuffer of type 'uint8'") : l === na && J(m instanceof Float32Array, "buffer must be 'Float32Array' when reading from a framebuffer of type 'float'")), J(f > 0 && f + u <= i.framebufferWidth, "invalid width for read pixels"), J(p > 0 && p + d <= i.framebufferHeight, "invalid height for read pixels"), r();
				var h = f * p * 4;
				return m || (l === ea ? m = new Uint8Array(h) : l === na && (m ||= new Float32Array(h))), J.isTypedArray(m, "data buffer for regl.read() must be a typedarray"), J(m.byteLength >= h, "data buffer for regl.read() too small"), t.pixelStorei(ta, 4), t.readPixels(u, d, f, p, $i, l, m), m;
			}
			function l(e) {
				var t;
				return n.setFBO({ framebuffer: e.framebuffer }, function() {
					t = c(e);
				}), t;
			}
			function u(e) {
				return !e || !("framebuffer" in e) ? c(e) : l(e);
			}
			return u;
		}
		function ia(e) {
			return Array.prototype.slice.call(e);
		}
		function aa(e) {
			return ia(e).join("");
		}
		function oa() {
			var e = 0, n = [], r = [];
			function i(t) {
				for (var i = 0; i < r.length; ++i) if (r[i] === t) return n[i];
				var a = "g" + e++;
				return n.push(a), r.push(t), a;
			}
			function a() {
				var n = [];
				function r() {
					n.push.apply(n, ia(arguments));
				}
				var i = [];
				function a() {
					var t = "v" + e++;
					return i.push(t), arguments.length > 0 && (n.push(t, "="), n.push.apply(n, ia(arguments)), n.push(";")), t;
				}
				return t(r, {
					def: a,
					toString: function() {
						return aa([i.length > 0 ? "var " + i.join(",") + ";" : "", aa(n)]);
					}
				});
			}
			function o() {
				var e = a(), n = a(), r = e.toString, i = n.toString;
				function o(t, r) {
					n(t, r, "=", e.def(t, r), ";");
				}
				return t(function() {
					e.apply(e, ia(arguments));
				}, {
					def: e.def,
					entry: e,
					exit: n,
					save: o,
					set: function(t, n, r) {
						o(t, n), e(t, n, "=", r, ";");
					},
					toString: function() {
						return r() + i();
					}
				});
			}
			function s() {
				var e = aa(arguments), n = o(), r = o(), i = n.toString, a = r.toString;
				return t(n, {
					then: function() {
						return n.apply(n, ia(arguments)), this;
					},
					else: function() {
						return r.apply(r, ia(arguments)), this;
					},
					toString: function() {
						var t = a();
						return t &&= "else{" + t + "}", aa([
							"if(",
							e,
							"){",
							i(),
							"}",
							t
						]);
					}
				});
			}
			var c = a(), l = {};
			function u(e, n) {
				var r = [];
				function i() {
					var e = "a" + r.length;
					return r.push(e), e;
				}
				n ||= 0;
				for (var a = 0; a < n; ++a) i();
				var s = o(), c = s.toString;
				return l[e] = t(s, {
					arg: i,
					toString: function() {
						return aa([
							"function(",
							r.join(),
							"){",
							c(),
							"}"
						]);
					}
				});
			}
			function d() {
				var e = [
					"\"use strict\";",
					c,
					"return {"
				];
				Object.keys(l).forEach(function(t) {
					e.push("\"", t, "\":", l[t].toString(), ",");
				}), e.push("}");
				var t = aa(e).replace(/;/g, ";\n").replace(/}/g, "}\n").replace(/{/g, "{\n");
				return Function.apply(null, n.concat(t)).apply(null, r);
			}
			return {
				global: c,
				link: i,
				block: a,
				proc: u,
				scope: o,
				cond: s,
				compile: d
			};
		}
		var sa = "xyzw".split(""), ca = 5121, la = 1, ua = 2, da = 0, fa = 1, pa = 2, ma = 3, ha = 4, ga = 5, _a = 6, va = "dither", ya = "blend.enable", ba = "blend.color", xa = "blend.equation", Sa = "blend.func", Ca = "depth.enable", wa = "depth.func", Ta = "depth.range", Ea = "depth.mask", Da = "colorMask", Oa = "cull.enable", ka = "cull.face", Aa = "frontFace", ja = "lineWidth", Ma = "polygonOffset.enable", Na = "polygonOffset.offset", Pa = "sample.alpha", Fa = "sample.enable", Ia = "sample.coverage", La = "stencil.enable", Ra = "stencil.mask", za = "stencil.func", Ba = "stencil.opFront", Va = "stencil.opBack", Ha = "scissor.enable", Ua = "scissor.box", Wa = "viewport", Ga = "profile", Ka = "framebuffer", qa = "vert", Ja = "frag", Ya = "elements", Xa = "primitive", Za = "count", Qa = "offset", $a = "instances", eo = "vao", to = "Width", no = "Height", ro = Ka + to, io = Ka + no, ao = Wa + to, oo = Wa + no, so = "drawingBuffer", co = so + to, lo = so + no, uo = [
			Sa,
			xa,
			za,
			Ba,
			Va,
			Ia,
			Wa,
			Ua,
			Na
		], fo = 34962, po = 34963, mo = 35632, ho = 35633, go = 3553, _o = 34067, vo = 2884, yo = 3042, bo = 3024, xo = 2960, So = 2929, Co = 3089, wo = 32823, To = 32926, Eo = 32928, Do = 5126, Oo = 35664, ko = 35665, Ao = 35666, jo = 5124, Mo = 35667, No = 35668, Po = 35669, Fo = 35670, Io = 35671, Lo = 35672, Ro = 35673, zo = 35674, Bo = 35675, Vo = 35676, Ho = 35678, Uo = 35680, Wo = 4, Go = 1028, Ko = 1029, qo = 2304, Jo = 2305, Yo = 32775, Xo = 32776, Zo = 519, Qo = 7680, $o = 0, es = 1, ts = 32774, ns = 513, rs = 36160, is = 36064, as = {
			0: 0,
			1: 1,
			zero: 0,
			one: 1,
			"src color": 768,
			"one minus src color": 769,
			"src alpha": 770,
			"one minus src alpha": 771,
			"dst color": 774,
			"one minus dst color": 775,
			"dst alpha": 772,
			"one minus dst alpha": 773,
			"constant color": 32769,
			"one minus constant color": 32770,
			"constant alpha": 32771,
			"one minus constant alpha": 32772,
			"src alpha saturate": 776
		}, os = [
			"constant color, constant alpha",
			"one minus constant color, constant alpha",
			"constant color, one minus constant alpha",
			"one minus constant color, one minus constant alpha",
			"constant alpha, constant color",
			"constant alpha, one minus constant color",
			"one minus constant alpha, constant color",
			"one minus constant alpha, one minus constant color"
		], ss = {
			never: 512,
			less: 513,
			"<": 513,
			equal: 514,
			"=": 514,
			"==": 514,
			"===": 514,
			lequal: 515,
			"<=": 515,
			greater: 516,
			">": 516,
			notequal: 517,
			"!=": 517,
			"!==": 517,
			gequal: 518,
			">=": 518,
			always: 519
		}, cs = {
			0: 0,
			zero: 0,
			keep: 7680,
			replace: 7681,
			increment: 7682,
			decrement: 7683,
			"increment wrap": 34055,
			"decrement wrap": 34056,
			invert: 5386
		}, ls = {
			frag: mo,
			vert: ho
		}, us = {
			cw: qo,
			ccw: Jo
		};
		function ds(t) {
			return Array.isArray(t) || e(t) || Ot(t);
		}
		function fs(e) {
			return e.sort(function(e, t) {
				return e === Wa ? -1 : t === Wa ? 1 : e < t ? -1 : 1;
			});
		}
		function ps(e, t, n, r) {
			this.thisDep = e, this.contextDep = t, this.propDep = n, this.append = r;
		}
		function ms(e) {
			return e && !(e.thisDep || e.contextDep || e.propDep);
		}
		function hs(e) {
			return new ps(!1, !1, !1, e);
		}
		function gs(e, t) {
			var n = e.type;
			if (n === da) {
				var r = e.data.length;
				return new ps(!0, r >= 1, r >= 2, t);
			}
			if (n === ha) {
				var i = e.data;
				return new ps(i.thisDep, i.contextDep, i.propDep, t);
			}
			if (n === ga) return new ps(!1, !1, !1, t);
			if (n === _a) {
				for (var a = !1, o = !1, s = !1, c = 0; c < e.data.length; ++c) {
					var l = e.data[c];
					if (l.type === fa) s = !0;
					else if (l.type === pa) o = !0;
					else if (l.type === ma) a = !0;
					else if (l.type === da) {
						a = !0;
						var u = l.data;
						u >= 1 && (o = !0), u >= 2 && (s = !0);
					} else l.type === ha && (a ||= l.data.thisDep, o ||= l.data.contextDep, s ||= l.data.propDep);
				}
				return new ps(a, o, s, t);
			}
			return new ps(n === ma, n === pa, n === fa, t);
		}
		var _s = new ps(!1, !1, !1, function() {});
		function vs(e, n, r, i, a, o, s, c, l, u, d, f, p, m, h) {
			var g = u.Record, _ = {
				add: 32774,
				subtract: 32778,
				"reverse subtract": 32779
			};
			r.ext_blend_minmax && (_.min = Yo, _.max = Xo);
			var v = r.angle_instanced_arrays, y = r.webgl_draw_buffers, b = r.oes_vertex_array_object, x = {
				dirty: !0,
				profile: h.profile
			}, S = {}, C = [], w = {}, T = {};
			function E(e) {
				return e.replace(".", "_");
			}
			function D(e, t, n) {
				var r = E(e);
				C.push(e), S[r] = x[r] = !!n, w[r] = t;
			}
			function O(e, t, n) {
				var r = E(e);
				C.push(e), Array.isArray(n) ? (x[r] = n.slice(), S[r] = n.slice()) : x[r] = S[r] = n, T[r] = t;
			}
			D(va, bo), D(ya, yo), O(ba, "blendColor", [
				0,
				0,
				0,
				0
			]), O(xa, "blendEquationSeparate", [ts, ts]), O(Sa, "blendFuncSeparate", [
				es,
				$o,
				es,
				$o
			]), D(Ca, So, !0), O(wa, "depthFunc", ns), O(Ta, "depthRange", [0, 1]), O(Ea, "depthMask", !0), O(Da, Da, [
				!0,
				!0,
				!0,
				!0
			]), D(Oa, vo), O(ka, "cullFace", Ko), O(Aa, Aa, Jo), O(ja, ja, 1), D(Ma, wo), O(Na, "polygonOffset", [0, 0]), D(Pa, To), D(Fa, Eo), O(Ia, "sampleCoverage", [1, !1]), D(La, xo), O(Ra, "stencilMask", -1), O(za, "stencilFunc", [
				Zo,
				0,
				-1
			]), O(Ba, "stencilOpSeparate", [
				Go,
				Qo,
				Qo,
				Qo
			]), O(Va, "stencilOpSeparate", [
				Ko,
				Qo,
				Qo,
				Qo
			]), D(Ha, Co), O(Ua, "scissor", [
				0,
				0,
				e.drawingBufferWidth,
				e.drawingBufferHeight
			]), O(Wa, Wa, [
				0,
				0,
				e.drawingBufferWidth,
				e.drawingBufferHeight
			]);
			var k = {
				gl: e,
				context: p,
				strings: n,
				next: S,
				current: x,
				draw: f,
				elements: o,
				buffer: a,
				shader: d,
				attributes: u.state,
				vao: u,
				uniforms: l,
				framebuffer: c,
				extensions: r,
				timer: m,
				isBufferArgs: ds
			}, A = {
				primTypes: Xt,
				compareFuncs: ss,
				blendFuncs: as,
				blendEquations: _,
				stencilOps: cs,
				glTypes: Lt,
				orientationType: us
			};
			J.optional(function() {
				k.isArrayLike = hn;
			}), y && (A.backBuffer = [Ko], A.drawBuffer = Me(i.maxDrawbuffers, function(e) {
				return e === 0 ? [0] : Me(e, function(e) {
					return is + e;
				});
			}));
			var j = 0;
			function M() {
				var e = oa(), t = e.link, r = e.global;
				e.id = j++, e.batchId = "0";
				var i = t(k), a = e.shared = { props: "a0" };
				Object.keys(k).forEach(function(e) {
					a[e] = r.def(i, ".", e);
				}), J.optional(function() {
					e.CHECK = t(J), e.commandStr = J.guessCommand(), e.command = t(e.commandStr), e.assert = function(e, n, r) {
						e("if(!(", n, "))", this.CHECK, ".commandRaise(", t(r), ",", this.command, ");");
					}, A.invalidBlendCombinations = os;
				});
				var o = e.next = {}, s = e.current = {};
				Object.keys(T).forEach(function(e) {
					Array.isArray(x[e]) && (o[e] = r.def(a.next, ".", e), s[e] = r.def(a.current, ".", e));
				});
				var c = e.constants = {};
				Object.keys(A).forEach(function(e) {
					c[e] = r.def(JSON.stringify(A[e]));
				}), e.invoke = function(n, r) {
					switch (r.type) {
						case da:
							var i = [
								"this",
								a.context,
								a.props,
								e.batchId
							];
							return n.def(t(r.data), ".call(", i.slice(0, Math.max(r.data.length + 1, 4)), ")");
						case fa: return n.def(a.props, r.data);
						case pa: return n.def(a.context, r.data);
						case ma: return n.def("this", r.data);
						case ha: return r.data.append(e, n), r.data.ref;
						case ga: return r.data.toString();
						case _a: return r.data.map(function(t) {
							return e.invoke(n, t);
						});
					}
				}, e.attribCache = {};
				var l = {};
				return e.scopeAttrib = function(e) {
					var r = n.id(e);
					if (r in l) return l[r];
					var i = u.scope[r];
					return i ||= u.scope[r] = new g(), l[r] = t(i);
				}, e;
			}
			function N(e) {
				var t = e.static, n = e.dynamic, r;
				if (Ga in t) {
					var i = !!t[Ga];
					r = hs(function(e, t) {
						return i;
					}), r.enable = i;
				} else if (Ga in n) {
					var a = n[Ga];
					r = gs(a, function(e, t) {
						return e.invoke(t, a);
					});
				}
				return r;
			}
			function P(e, t) {
				var n = e.static, r = e.dynamic;
				if (Ka in n) {
					var i = n[Ka];
					return i ? (i = c.getFramebuffer(i), J.command(i, "invalid framebuffer object"), hs(function(e, t) {
						var n = e.link(i), r = e.shared;
						t.set(r.framebuffer, ".next", n);
						var a = r.context;
						return t.set(a, "." + ro, n + ".width"), t.set(a, "." + io, n + ".height"), n;
					})) : hs(function(e, t) {
						var n = e.shared;
						t.set(n.framebuffer, ".next", "null");
						var r = n.context;
						return t.set(r, "." + ro, r + "." + co), t.set(r, "." + io, r + "." + lo), "null";
					});
				}
				if (Ka in r) {
					var a = r[Ka];
					return gs(a, function(e, t) {
						var n = e.invoke(t, a), r = e.shared, i = r.framebuffer, o = t.def(i, ".getFramebuffer(", n, ")");
						J.optional(function() {
							e.assert(t, "!" + n + "||" + o, "invalid framebuffer object");
						}), t.set(i, ".next", o);
						var s = r.context;
						return t.set(s, "." + ro, o + "?" + o + ".width:" + s + "." + co), t.set(s, "." + io, o + "?" + o + ".height:" + s + "." + lo), o;
					});
				}
				return null;
			}
			function F(e, t, n) {
				var r = e.static, i = e.dynamic;
				function a(e) {
					if (e in r) {
						var a = r[e];
						J.commandType(a, "object", "invalid " + e, n.commandStr);
						var o = !0, s = a.x | 0, c = a.y | 0, l, u;
						return "width" in a ? (l = a.width | 0, J.command(l >= 0, "invalid " + e, n.commandStr)) : o = !1, "height" in a ? (u = a.height | 0, J.command(u >= 0, "invalid " + e, n.commandStr)) : o = !1, new ps(!o && t && t.thisDep, !o && t && t.contextDep, !o && t && t.propDep, function(e, t) {
							var n = e.shared.context, r = l;
							"width" in a || (r = t.def(n, ".", ro, "-", s));
							var i = u;
							return "height" in a || (i = t.def(n, ".", io, "-", c)), [
								s,
								c,
								r,
								i
							];
						});
					}
					if (e in i) {
						var d = i[e], f = gs(d, function(t, n) {
							var r = t.invoke(n, d);
							J.optional(function() {
								t.assert(n, r + "&&typeof " + r + "===\"object\"", "invalid " + e);
							});
							var i = t.shared.context, a = n.def(r, ".x|0"), o = n.def(r, ".y|0"), s = n.def("\"width\" in ", r, "?", r, ".width|0:", "(", i, ".", ro, "-", a, ")"), c = n.def("\"height\" in ", r, "?", r, ".height|0:", "(", i, ".", io, "-", o, ")");
							return J.optional(function() {
								t.assert(n, s + ">=0&&" + c + ">=0", "invalid " + e);
							}), [
								a,
								o,
								s,
								c
							];
						});
						return t && (f.thisDep = f.thisDep || t.thisDep, f.contextDep = f.contextDep || t.contextDep, f.propDep = f.propDep || t.propDep), f;
					}
					return t ? new ps(t.thisDep, t.contextDep, t.propDep, function(e, t) {
						var n = e.shared.context;
						return [
							0,
							0,
							t.def(n, ".", ro),
							t.def(n, ".", io)
						];
					}) : null;
				}
				var o = a(Wa);
				if (o) {
					var s = o;
					o = new ps(o.thisDep, o.contextDep, o.propDep, function(e, t) {
						var n = s.append(e, t), r = e.shared.context;
						return t.set(r, "." + ao, n[2]), t.set(r, "." + oo, n[3]), n;
					});
				}
				return {
					viewport: o,
					scissor_box: a(Ua)
				};
			}
			function I(e, t) {
				var n = e.static;
				if (typeof n[Ja] == "string" && typeof n[qa] == "string") {
					if (Object.keys(t.dynamic).length > 0) return null;
					var r = t.static, i = Object.keys(r);
					if (i.length > 0 && typeof r[i[0]] == "number") {
						for (var a = [], o = 0; o < i.length; ++o) J(typeof r[i[o]] == "number", "must specify all vertex attribute locations when using vaos"), a.push([r[i[o]] | 0, i[o]]);
						return a;
					}
				}
				return null;
			}
			function L(e, t, r) {
				var i = e.static, a = e.dynamic;
				function o(e) {
					if (e in i) {
						var t = n.id(i[e]);
						J.optional(function() {
							d.shader(ls[e], t, J.guessCommand());
						});
						var r = hs(function() {
							return t;
						});
						return r.id = t, r;
					}
					if (e in a) {
						var o = a[e];
						return gs(o, function(t, n) {
							var r = t.invoke(n, o), i = n.def(t.shared.strings, ".id(", r, ")");
							return J.optional(function() {
								n(t.shared.shader, ".shader(", ls[e], ",", i, ",", t.command, ");");
							}), i;
						});
					}
					return null;
				}
				var s = o(Ja), c = o(qa), l = null, u;
				return ms(s) && ms(c) ? (l = d.program(c.id, s.id, null, r), u = hs(function(e, t) {
					return e.link(l);
				})) : u = new ps(s && s.thisDep || c && c.thisDep, s && s.contextDep || c && c.contextDep, s && s.propDep || c && c.propDep, function(e, t) {
					var n = e.shared.shader, r = s ? s.append(e, t) : t.def(n, ".", Ja), i = c ? c.append(e, t) : t.def(n, ".", qa), a = n + ".program(" + i + "," + r;
					return J.optional(function() {
						a += "," + e.command;
					}), t.def(a + ")");
				}), {
					frag: s,
					vert: c,
					progVar: u,
					program: l
				};
			}
			function R(e, t) {
				var n = e.static, r = e.dynamic, i = {}, a = !1;
				function s() {
					if (eo in n) {
						var e = n[eo];
						return e !== null && u.getVAO(e) === null && (e = u.createVAO(e)), a = !0, i.vao = e, hs(function(t) {
							var n = u.getVAO(e);
							return n ? t.link(n) : "null";
						});
					}
					if (eo in r) {
						a = !0;
						var t = r[eo];
						return gs(t, function(e, n) {
							var r = e.invoke(n, t);
							return n.def(e.shared.vao + ".getVAO(" + r + ")");
						});
					}
					return null;
				}
				var c = s(), l = !1;
				function d() {
					if (Ya in n) {
						var e = n[Ya];
						if (i.elements = e, ds(e)) {
							var s = i.elements = o.create(e, !0);
							e = o.getElements(s), l = !0;
						} else e && (e = o.getElements(e), l = !0, J.command(e, "invalid elements", t.commandStr));
						var u = hs(function(t, n) {
							if (e) {
								var r = t.link(e);
								return t.ELEMENTS = r, r;
							}
							return t.ELEMENTS = null, null;
						});
						return u.value = e, u;
					}
					if (Ya in r) {
						l = !0;
						var d = r[Ya];
						return gs(d, function(e, t) {
							var n = e.shared, r = n.isBufferArgs, i = n.elements, a = e.invoke(t, d), o = t.def("null"), s = t.def(r, "(", a, ")"), c = e.cond(s).then(o, "=", i, ".createStream(", a, ");").else(o, "=", i, ".getElements(", a, ");");
							return J.optional(function() {
								e.assert(c.else, "!" + a + "||" + o, "invalid elements");
							}), t.entry(c), t.exit(e.cond(s).then(i, ".destroyStream(", o, ");")), e.ELEMENTS = o, o;
						});
					}
					return a ? new ps(c.thisDep, c.contextDep, c.propDep, function(e, t) {
						return t.def(e.shared.vao + ".currentVAO?" + e.shared.elements + ".getElements(" + e.shared.vao + ".currentVAO.elements):null");
					}) : null;
				}
				var f = d();
				function p() {
					if (Xa in n) {
						var e = n[Xa];
						return i.primitive = e, J.commandParameter(e, Xt, "invalid primitve", t.commandStr), hs(function(t, n) {
							return Xt[e];
						});
					}
					if (Xa in r) {
						var o = r[Xa];
						return gs(o, function(e, t) {
							var n = e.constants.primTypes, r = e.invoke(t, o);
							return J.optional(function() {
								e.assert(t, r + " in " + n, "invalid primitive, must be one of " + Object.keys(Xt));
							}), t.def(n, "[", r, "]");
						});
					}
					return l ? ms(f) ? f.value ? hs(function(e, t) {
						return t.def(e.ELEMENTS, ".primType");
					}) : hs(function() {
						return Wo;
					}) : new ps(f.thisDep, f.contextDep, f.propDep, function(e, t) {
						var n = e.ELEMENTS;
						return t.def(n, "?", n, ".primType:", Wo);
					}) : a ? new ps(c.thisDep, c.contextDep, c.propDep, function(e, t) {
						return t.def(e.shared.vao + ".currentVAO?" + e.shared.vao + ".currentVAO.primitive:" + Wo);
					}) : null;
				}
				function m(e, o) {
					if (e in n) {
						var s = n[e] | 0;
						return o ? i.offset = s : i.instances = s, J.command(!o || s >= 0, "invalid " + e, t.commandStr), hs(function(e, t) {
							return o && (e.OFFSET = s), s;
						});
					}
					if (e in r) {
						var u = r[e];
						return gs(u, function(t, n) {
							var r = t.invoke(n, u);
							return o && (t.OFFSET = r, J.optional(function() {
								t.assert(n, r + ">=0", "invalid " + e);
							})), r;
						});
					}
					if (o) {
						if (l) return hs(function(e, t) {
							return e.OFFSET = 0, 0;
						});
						if (a) return new ps(c.thisDep, c.contextDep, c.propDep, function(e, t) {
							return t.def(e.shared.vao + ".currentVAO?" + e.shared.vao + ".currentVAO.offset:0");
						});
					} else if (a) return new ps(c.thisDep, c.contextDep, c.propDep, function(e, t) {
						return t.def(e.shared.vao + ".currentVAO?" + e.shared.vao + ".currentVAO.instances:-1");
					});
					return null;
				}
				var h = m(Qa, !0);
				function g() {
					if (Za in n) {
						var e = n[Za] | 0;
						return i.count = e, J.command(typeof e == "number" && e >= 0, "invalid vertex count", t.commandStr), hs(function() {
							return e;
						});
					}
					if (Za in r) {
						var o = r[Za];
						return gs(o, function(e, t) {
							var n = e.invoke(t, o);
							return J.optional(function() {
								e.assert(t, "typeof " + n + "===\"number\"&&" + n + ">=0&&" + n + "===(" + n + "|0)", "invalid vertex count");
							}), n;
						});
					}
					if (l) {
						if (ms(f)) {
							if (f) return h ? new ps(h.thisDep, h.contextDep, h.propDep, function(e, t) {
								var n = t.def(e.ELEMENTS, ".vertCount-", e.OFFSET);
								return J.optional(function() {
									e.assert(t, n + ">=0", "invalid vertex offset/element buffer too small");
								}), n;
							}) : hs(function(e, t) {
								return t.def(e.ELEMENTS, ".vertCount");
							});
							var s = hs(function() {
								return -1;
							});
							return J.optional(function() {
								s.MISSING = !0;
							}), s;
						}
						var u = new ps(f.thisDep || h.thisDep, f.contextDep || h.contextDep, f.propDep || h.propDep, function(e, t) {
							var n = e.ELEMENTS;
							return e.OFFSET ? t.def(n, "?", n, ".vertCount-", e.OFFSET, ":-1") : t.def(n, "?", n, ".vertCount:-1");
						});
						return J.optional(function() {
							u.DYNAMIC = !0;
						}), u;
					}
					return a ? new ps(c.thisDep, c.contextDep, c.propDep, function(e, t) {
						return t.def(e.shared.vao, ".currentVAO?", e.shared.vao, ".currentVAO.count:-1");
					}) : null;
				}
				return {
					elements: f,
					primitive: p(),
					count: g(),
					instances: m($a, !1),
					offset: h,
					vao: c,
					vaoActive: a,
					elementsActive: l,
					static: i
				};
			}
			function ee(e, t) {
				var n = e.static, r = e.dynamic, a = {};
				return C.forEach(function(e) {
					var o = E(e);
					function s(t, i) {
						if (e in n) {
							var s = t(n[e]);
							a[o] = hs(function() {
								return s;
							});
						} else if (e in r) {
							var c = r[e];
							a[o] = gs(c, function(e, t) {
								return i(e, t, e.invoke(t, c));
							});
						}
					}
					switch (e) {
						case Oa:
						case ya:
						case va:
						case La:
						case Ca:
						case Ha:
						case Ma:
						case Pa:
						case Fa:
						case Ea: return s(function(n) {
							return J.commandType(n, "boolean", e, t.commandStr), n;
						}, function(t, n, r) {
							return J.optional(function() {
								t.assert(n, "typeof " + r + "===\"boolean\"", "invalid flag " + e, t.commandStr);
							}), r;
						});
						case wa: return s(function(n) {
							return J.commandParameter(n, ss, "invalid " + e, t.commandStr), ss[n];
						}, function(t, n, r) {
							var i = t.constants.compareFuncs;
							return J.optional(function() {
								t.assert(n, r + " in " + i, "invalid " + e + ", must be one of " + Object.keys(ss));
							}), n.def(i, "[", r, "]");
						});
						case Ta: return s(function(e) {
							return J.command(hn(e) && e.length === 2 && typeof e[0] == "number" && typeof e[1] == "number" && e[0] <= e[1], "depth range is 2d array", t.commandStr), e;
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, e.shared.isArrayLike + "(" + n + ")&&" + n + ".length===2&&typeof " + n + "[0]===\"number\"&&typeof " + n + "[1]===\"number\"&&" + n + "[0]<=" + n + "[1]", "depth range must be a 2d array");
							}), [t.def("+", n, "[0]"), t.def("+", n, "[1]")];
						});
						case Sa: return s(function(e) {
							J.commandType(e, "object", "blend.func", t.commandStr);
							var n = "srcRGB" in e ? e.srcRGB : e.src, r = "srcAlpha" in e ? e.srcAlpha : e.src, i = "dstRGB" in e ? e.dstRGB : e.dst, a = "dstAlpha" in e ? e.dstAlpha : e.dst;
							return J.commandParameter(n, as, o + ".srcRGB", t.commandStr), J.commandParameter(r, as, o + ".srcAlpha", t.commandStr), J.commandParameter(i, as, o + ".dstRGB", t.commandStr), J.commandParameter(a, as, o + ".dstAlpha", t.commandStr), J.command(os.indexOf(n + ", " + i) === -1, "unallowed blending combination (srcRGB, dstRGB) = (" + n + ", " + i + ")", t.commandStr), [
								as[n],
								as[i],
								as[r],
								as[a]
							];
						}, function(t, n, r) {
							var i = t.constants.blendFuncs;
							J.optional(function() {
								t.assert(n, r + "&&typeof " + r + "===\"object\"", "invalid blend func, must be an object");
							});
							function a(a, o) {
								var s = n.def("\"", a, o, "\" in ", r, "?", r, ".", a, o, ":", r, ".", a);
								return J.optional(function() {
									t.assert(n, s + " in " + i, "invalid " + e + "." + a + o + ", must be one of " + Object.keys(as));
								}), s;
							}
							var o = a("src", "RGB"), s = a("dst", "RGB");
							J.optional(function() {
								var e = t.constants.invalidBlendCombinations;
								t.assert(n, e + ".indexOf(" + o + "+\", \"+" + s + ") === -1 ", "unallowed blending combination for (srcRGB, dstRGB)");
							});
							var c = n.def(i, "[", o, "]"), l = n.def(i, "[", a("src", "Alpha"), "]");
							return [
								c,
								n.def(i, "[", s, "]"),
								l,
								n.def(i, "[", a("dst", "Alpha"), "]")
							];
						});
						case xa: return s(function(n) {
							if (typeof n == "string") return J.commandParameter(n, _, "invalid " + e, t.commandStr), [_[n], _[n]];
							if (typeof n == "object") return J.commandParameter(n.rgb, _, e + ".rgb", t.commandStr), J.commandParameter(n.alpha, _, e + ".alpha", t.commandStr), [_[n.rgb], _[n.alpha]];
							J.commandRaise("invalid blend.equation", t.commandStr);
						}, function(t, n, r) {
							var i = t.constants.blendEquations, a = n.def(), o = n.def(), s = t.cond("typeof ", r, "===\"string\"");
							return J.optional(function() {
								function n(e, n, r) {
									t.assert(e, r + " in " + i, "invalid " + n + ", must be one of " + Object.keys(_));
								}
								n(s.then, e, r), t.assert(s.else, r + "&&typeof " + r + "===\"object\"", "invalid " + e), n(s.else, e + ".rgb", r + ".rgb"), n(s.else, e + ".alpha", r + ".alpha");
							}), s.then(a, "=", o, "=", i, "[", r, "];"), s.else(a, "=", i, "[", r, ".rgb];", o, "=", i, "[", r, ".alpha];"), n(s), [a, o];
						});
						case ba: return s(function(e) {
							return J.command(hn(e) && e.length === 4, "blend.color must be a 4d array", t.commandStr), Me(4, function(t) {
								return +e[t];
							});
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, e.shared.isArrayLike + "(" + n + ")&&" + n + ".length===4", "blend.color must be a 4d array");
							}), Me(4, function(e) {
								return t.def("+", n, "[", e, "]");
							});
						});
						case Ra: return s(function(e) {
							return J.commandType(e, "number", o, t.commandStr), e | 0;
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, "typeof " + n + "===\"number\"", "invalid stencil.mask");
							}), t.def(n, "|0");
						});
						case za: return s(function(n) {
							J.commandType(n, "object", o, t.commandStr);
							var r = n.cmp || "keep", i = n.ref || 0, a = "mask" in n ? n.mask : -1;
							return J.commandParameter(r, ss, e + ".cmp", t.commandStr), J.commandType(i, "number", e + ".ref", t.commandStr), J.commandType(a, "number", e + ".mask", t.commandStr), [
								ss[r],
								i,
								a
							];
						}, function(e, t, n) {
							var r = e.constants.compareFuncs;
							return J.optional(function() {
								function i() {
									e.assert(t, Array.prototype.join.call(arguments, ""), "invalid stencil.func");
								}
								i(n + "&&typeof ", n, "===\"object\""), i("!(\"cmp\" in ", n, ")||(", n, ".cmp in ", r, ")");
							}), [
								t.def("\"cmp\" in ", n, "?", r, "[", n, ".cmp]", ":", Qo),
								t.def(n, ".ref|0"),
								t.def("\"mask\" in ", n, "?", n, ".mask|0:-1")
							];
						});
						case Ba:
						case Va: return s(function(n) {
							J.commandType(n, "object", o, t.commandStr);
							var r = n.fail || "keep", i = n.zfail || "keep", a = n.zpass || "keep";
							return J.commandParameter(r, cs, e + ".fail", t.commandStr), J.commandParameter(i, cs, e + ".zfail", t.commandStr), J.commandParameter(a, cs, e + ".zpass", t.commandStr), [
								e === Va ? Ko : Go,
								cs[r],
								cs[i],
								cs[a]
							];
						}, function(t, n, r) {
							var i = t.constants.stencilOps;
							J.optional(function() {
								t.assert(n, r + "&&typeof " + r + "===\"object\"", "invalid " + e);
							});
							function a(a) {
								return J.optional(function() {
									t.assert(n, "!(\"" + a + "\" in " + r + ")||(" + r + "." + a + " in " + i + ")", "invalid " + e + "." + a + ", must be one of " + Object.keys(cs));
								}), n.def("\"", a, "\" in ", r, "?", i, "[", r, ".", a, "]:", Qo);
							}
							return [
								e === Va ? Ko : Go,
								a("fail"),
								a("zfail"),
								a("zpass")
							];
						});
						case Na: return s(function(e) {
							J.commandType(e, "object", o, t.commandStr);
							var n = e.factor | 0, r = e.units | 0;
							return J.commandType(n, "number", o + ".factor", t.commandStr), J.commandType(r, "number", o + ".units", t.commandStr), [n, r];
						}, function(t, n, r) {
							return J.optional(function() {
								t.assert(n, r + "&&typeof " + r + "===\"object\"", "invalid " + e);
							}), [n.def(r, ".factor|0"), n.def(r, ".units|0")];
						});
						case ka: return s(function(e) {
							var n = 0;
							return e === "front" ? n = Go : e === "back" && (n = Ko), J.command(!!n, o, t.commandStr), n;
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, n + "===\"front\"||" + n + "===\"back\"", "invalid cull.face");
							}), t.def(n, "===\"front\"?", Go, ":", Ko);
						});
						case ja: return s(function(e) {
							return J.command(typeof e == "number" && e >= i.lineWidthDims[0] && e <= i.lineWidthDims[1], "invalid line width, must be a positive number between " + i.lineWidthDims[0] + " and " + i.lineWidthDims[1], t.commandStr), e;
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, "typeof " + n + "===\"number\"&&" + n + ">=" + i.lineWidthDims[0] + "&&" + n + "<=" + i.lineWidthDims[1], "invalid line width");
							}), n;
						});
						case Aa: return s(function(e) {
							return J.commandParameter(e, us, o, t.commandStr), us[e];
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, n + "===\"cw\"||" + n + "===\"ccw\"", "invalid frontFace, must be one of cw,ccw");
							}), t.def(n + "===\"cw\"?" + qo + ":" + Jo);
						});
						case Da: return s(function(e) {
							return J.command(hn(e) && e.length === 4, "color.mask must be length 4 array", t.commandStr), e.map(function(e) {
								return !!e;
							});
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, e.shared.isArrayLike + "(" + n + ")&&" + n + ".length===4", "invalid color.mask");
							}), Me(4, function(e) {
								return "!!" + n + "[" + e + "]";
							});
						});
						case Ia: return s(function(e) {
							J.command(typeof e == "object" && e, o, t.commandStr);
							var n = "value" in e ? e.value : 1, r = !!e.invert;
							return J.command(typeof n == "number" && n >= 0 && n <= 1, "sample.coverage.value must be a number between 0 and 1", t.commandStr), [n, r];
						}, function(e, t, n) {
							return J.optional(function() {
								e.assert(t, n + "&&typeof " + n + "===\"object\"", "invalid sample.coverage");
							}), [t.def("\"value\" in ", n, "?+", n, ".value:1"), t.def("!!", n, ".invert")];
						});
					}
				}), a;
			}
			function z(e, t) {
				var n = e.static, r = e.dynamic, i = {};
				return Object.keys(n).forEach(function(e) {
					var r = n[e], a;
					if (typeof r == "number" || typeof r == "boolean") a = hs(function() {
						return r;
					});
					else if (typeof r == "function") {
						var o = r._reglType;
						o === "texture2d" || o === "textureCube" ? a = hs(function(e) {
							return e.link(r);
						}) : o === "framebuffer" || o === "framebufferCube" ? (J.command(r.color.length > 0, "missing color attachment for framebuffer sent to uniform \"" + e + "\"", t.commandStr), a = hs(function(e) {
							return e.link(r.color[0]);
						})) : J.commandRaise("invalid data for uniform \"" + e + "\"", t.commandStr);
					} else hn(r) ? a = hs(function(t) {
						return t.global.def("[", Me(r.length, function(n) {
							return J.command(typeof r[n] == "number" || typeof r[n] == "boolean", "invalid uniform " + e, t.commandStr), r[n];
						}), "]");
					}) : J.commandRaise("invalid or missing data for uniform \"" + e + "\"", t.commandStr);
					a.value = r, i[e] = a;
				}), Object.keys(r).forEach(function(e) {
					var t = r[e];
					i[e] = gs(t, function(e, n) {
						return e.invoke(n, t);
					});
				}), i;
			}
			function B(e, t) {
				var r = e.static, i = e.dynamic, o = {};
				return Object.keys(r).forEach(function(e) {
					var i = r[e], s = n.id(e), c = new g();
					if (ds(i)) c.state = la, c.buffer = a.getBuffer(a.create(i, fo, !1, !0)), c.type = 0;
					else {
						var l = a.getBuffer(i);
						if (l) c.state = la, c.buffer = l, c.type = 0;
						else if (J.command(typeof i == "object" && i, "invalid data for attribute " + e, t.commandStr), "constant" in i) {
							var u = i.constant;
							c.buffer = "null", c.state = ua, typeof u == "number" ? c.x = u : (J.command(hn(u) && u.length > 0 && u.length <= 4, "invalid constant for attribute " + e, t.commandStr), sa.forEach(function(e, t) {
								t < u.length && (c[e] = u[t]);
							}));
						} else {
							l = ds(i.buffer) ? a.getBuffer(a.create(i.buffer, fo, !1, !0)) : a.getBuffer(i.buffer), J.command(!!l, "missing buffer for attribute \"" + e + "\"", t.commandStr);
							var d = i.offset | 0;
							J.command(d >= 0, "invalid offset for attribute \"" + e + "\"", t.commandStr);
							var f = i.stride | 0;
							J.command(f >= 0 && f < 256, "invalid stride for attribute \"" + e + "\", must be integer betweeen [0, 255]", t.commandStr);
							var p = i.size | 0;
							J.command(!("size" in i) || p > 0 && p <= 4, "invalid size for attribute \"" + e + "\", must be 1,2,3,4", t.commandStr);
							var m = !!i.normalized, h = 0;
							"type" in i && (J.commandParameter(i.type, Lt, "invalid type for attribute " + e, t.commandStr), h = Lt[i.type]);
							var _ = i.divisor | 0;
							J.optional(function() {
								"divisor" in i && (J.command(_ === 0 || v, "cannot specify divisor for attribute \"" + e + "\", instancing not supported", t.commandStr), J.command(_ >= 0, "invalid divisor for attribute \"" + e + "\"", t.commandStr));
								var n = t.commandStr, r = [
									"buffer",
									"offset",
									"divisor",
									"normalized",
									"type",
									"size",
									"stride"
								];
								Object.keys(i).forEach(function(t) {
									J.command(r.indexOf(t) >= 0, "unknown parameter \"" + t + "\" for attribute pointer \"" + e + "\" (valid parameters are " + r + ")", n);
								});
							}), c.buffer = l, c.state = la, c.size = p, c.normalized = m, c.type = h || l.dtype, c.offset = d, c.stride = f, c.divisor = _;
						}
					}
					o[e] = hs(function(e, t) {
						var n = e.attribCache;
						if (s in n) return n[s];
						var r = { isStream: !1 };
						return Object.keys(c).forEach(function(e) {
							r[e] = c[e];
						}), c.buffer && (r.buffer = e.link(c.buffer), r.type = r.type || r.buffer + ".dtype"), n[s] = r, r;
					});
				}), Object.keys(i).forEach(function(e) {
					var t = i[e];
					function n(n, r) {
						var i = n.invoke(r, t), a = n.shared, o = n.constants, s = a.isBufferArgs, c = a.buffer;
						J.optional(function() {
							n.assert(r, i + "&&(typeof " + i + "===\"object\"||typeof " + i + "===\"function\")&&(" + s + "(" + i + ")||" + c + ".getBuffer(" + i + ")||" + c + ".getBuffer(" + i + ".buffer)||" + s + "(" + i + ".buffer)||(\"constant\" in " + i + "&&(typeof " + i + ".constant===\"number\"||" + a.isArrayLike + "(" + i + ".constant))))", "invalid dynamic attribute \"" + e + "\"");
						});
						var l = { isStream: r.def(!1) }, u = new g();
						u.state = la, Object.keys(u).forEach(function(e) {
							l[e] = r.def("" + u[e]);
						});
						var d = l.buffer, f = l.type;
						r("if(", s, "(", i, ")){", l.isStream, "=true;", d, "=", c, ".createStream(", fo, ",", i, ");", f, "=", d, ".dtype;", "}else{", d, "=", c, ".getBuffer(", i, ");", "if(", d, "){", f, "=", d, ".dtype;", "}else if(\"constant\" in ", i, "){", l.state, "=", ua, ";", "if(typeof " + i + ".constant === \"number\"){", l[sa[0]], "=", i, ".constant;", sa.slice(1).map(function(e) {
							return l[e];
						}).join("="), "=0;", "}else{", sa.map(function(e, t) {
							return l[e] + "=" + i + ".constant.length>" + t + "?" + i + ".constant[" + t + "]:0;";
						}).join(""), "}}else{", "if(", s, "(", i, ".buffer)){", d, "=", c, ".createStream(", fo, ",", i, ".buffer);", "}else{", d, "=", c, ".getBuffer(", i, ".buffer);", "}", f, "=\"type\" in ", i, "?", o.glTypes, "[", i, ".type]:", d, ".dtype;", l.normalized, "=!!", i, ".normalized;");
						function p(e) {
							r(l[e], "=", i, ".", e, "|0;");
						}
						return p("size"), p("offset"), p("stride"), p("divisor"), r("}}"), r.exit("if(", l.isStream, "){", c, ".destroyStream(", d, ");", "}"), l;
					}
					o[e] = gs(t, n);
				}), o;
			}
			function V(e) {
				var t = e.static, n = e.dynamic, r = {};
				return Object.keys(t).forEach(function(e) {
					var n = t[e];
					r[e] = hs(function(e, t) {
						return typeof n == "number" || typeof n == "boolean" ? "" + n : e.link(n);
					});
				}), Object.keys(n).forEach(function(e) {
					var t = n[e];
					r[e] = gs(t, function(e, n) {
						return e.invoke(n, t);
					});
				}), r;
			}
			function H(e, t, n, i, a) {
				var o = e.static, s = e.dynamic;
				J.optional(function() {
					var e = [
						Ka,
						qa,
						Ja,
						Ya,
						Xa,
						Qa,
						Za,
						$a,
						Ga,
						eo
					].concat(C);
					function t(t) {
						Object.keys(t).forEach(function(t) {
							J.command(e.indexOf(t) >= 0, "unknown parameter \"" + t + "\"", a.commandStr);
						});
					}
					t(o), t(s);
				});
				var c = I(e, t), l = P(e, a), d = F(e, l, a), f = R(e, a), p = ee(e, a), m = L(e, a, c);
				function h(e) {
					var t = d[e];
					t && (p[e] = t);
				}
				h(Wa), h(E(Ua));
				var g = {
					framebuffer: l,
					draw: f,
					shader: m,
					state: p,
					dirty: Object.keys(p).length > 0,
					scopeVAO: null,
					drawVAO: null,
					useVAO: !1,
					attributes: {}
				};
				if (g.profile = N(e, a), g.uniforms = z(n, a), g.drawVAO = g.scopeVAO = f.vao, !g.drawVAO && m.program && !c && r.angle_instanced_arrays && f.static.elements) {
					var _ = !0, v = m.program.attributes.map(function(e) {
						var n = t.static[e];
						return _ &&= !!n, n;
					});
					if (_ && v.length > 0) {
						var y = u.getVAO(u.createVAO({
							attributes: v,
							elements: f.static.elements
						}));
						g.drawVAO = new ps(null, null, null, function(e, t) {
							return e.link(y);
						}), g.useVAO = !0;
					}
				}
				return c ? g.useVAO = !0 : g.attributes = B(t, a), g.context = V(i, a), g;
			}
			function te(e, t, n) {
				var r = e.shared.context, i = e.scope();
				Object.keys(n).forEach(function(a) {
					t.save(r, "." + a);
					var o = n[a].append(e, t);
					Array.isArray(o) ? i(r, ".", a, "=[", o.join(), "];") : i(r, ".", a, "=", o, ";");
				}), t(i);
			}
			function U(e, t, n, r) {
				var i = e.shared, a = i.gl, o = i.framebuffer, s;
				y && (s = t.def(i.extensions, ".webgl_draw_buffers"));
				var c = e.constants, l = c.drawBuffer, u = c.backBuffer, d = n ? n.append(e, t) : t.def(o, ".next");
				r || t("if(", d, "!==", o, ".cur){"), t("if(", d, "){", a, ".bindFramebuffer(", rs, ",", d, ".framebuffer);"), y && t(s, ".drawBuffersWEBGL(", l, "[", d, ".colorAttachments.length]);"), t("}else{", a, ".bindFramebuffer(", rs, ",null);"), y && t(s, ".drawBuffersWEBGL(", u, ");"), t("}", o, ".cur=", d, ";"), r || t("}");
			}
			function W(e, t, n) {
				var r = e.shared, i = r.gl, a = e.current, o = e.next, s = r.current, c = r.next, l = e.cond(s, ".dirty");
				C.forEach(function(t) {
					var r = E(t);
					if (!(r in n.state)) {
						var u, d;
						if (r in o) {
							u = o[r], d = a[r];
							var f = Me(x[r].length, function(e) {
								return l.def(u, "[", e, "]");
							});
							l(e.cond(f.map(function(e, t) {
								return e + "!==" + d + "[" + t + "]";
							}).join("||")).then(i, ".", T[r], "(", f, ");", f.map(function(e, t) {
								return d + "[" + t + "]=" + e;
							}).join(";"), ";"));
						} else {
							u = l.def(c, ".", r);
							var p = e.cond(u, "!==", s, ".", r);
							l(p), r in w ? p(e.cond(u).then(i, ".enable(", w[r], ");").else(i, ".disable(", w[r], ");"), s, ".", r, "=", u, ";") : p(i, ".", T[r], "(", u, ");", s, ".", r, "=", u, ";");
						}
					}
				}), Object.keys(n.state).length === 0 && l(s, ".dirty=false;"), t(l);
			}
			function G(e, t, n, r) {
				var i = e.shared, a = e.current, o = i.current, s = i.gl;
				fs(Object.keys(n)).forEach(function(i) {
					var c = n[i];
					if (!(r && !r(c))) {
						var l = c.append(e, t);
						if (w[i]) {
							var u = w[i];
							ms(c) ? l ? t(s, ".enable(", u, ");") : t(s, ".disable(", u, ");") : t(e.cond(l).then(s, ".enable(", u, ");").else(s, ".disable(", u, ");")), t(o, ".", i, "=", l, ";");
						} else if (hn(l)) {
							var d = a[i];
							t(s, ".", T[i], "(", l, ");", l.map(function(e, t) {
								return d + "[" + t + "]=" + e;
							}).join(";"), ";");
						} else t(s, ".", T[i], "(", l, ");", o, ".", i, "=", l, ";");
					}
				});
			}
			function ne(e, t) {
				v && (e.instancing = t.def(e.shared.extensions, ".angle_instanced_arrays"));
			}
			function K(e, t, n, r, i) {
				var a = e.shared, o = e.stats, s = a.current, c = a.timer, l = n.profile;
				function u() {
					return typeof performance > "u" ? "Date.now()" : "performance.now()";
				}
				var d, f;
				function p(e) {
					d = t.def(), e(d, "=", u(), ";"), typeof i == "string" ? e(o, ".count+=", i, ";") : e(o, ".count++;"), m && (r ? (f = t.def(), e(f, "=", c, ".getNumPendingQueries();")) : e(c, ".beginQuery(", o, ");"));
				}
				function h(e) {
					e(o, ".cpuTime+=", u(), "-", d, ";"), m && (r ? e(c, ".pushScopeStats(", f, ",", c, ".getNumPendingQueries(),", o, ");") : e(c, ".endQuery();"));
				}
				function g(e) {
					var n = t.def(s, ".profile");
					t(s, ".profile=", e, ";"), t.exit(s, ".profile=", n, ";");
				}
				var _;
				if (l) {
					if (ms(l)) {
						l.enable ? (p(t), h(t.exit), g("true")) : g("false");
						return;
					}
					_ = l.append(e, t), g(_);
				} else _ = t.def(s, ".profile");
				var v = e.block();
				p(v), t("if(", _, "){", v, "}");
				var y = e.block();
				h(y), t.exit("if(", _, "){", y, "}");
			}
			function re(e, t, n, r, i) {
				var a = e.shared;
				function o(e) {
					switch (e) {
						case Oo:
						case Mo:
						case Io: return 2;
						case ko:
						case No:
						case Lo: return 3;
						case Ao:
						case Po:
						case Ro: return 4;
						default: return 1;
					}
				}
				function s(n, r, i) {
					var o = a.gl, s = t.def(n, ".location"), c = t.def(a.attributes, "[", s, "]"), l = i.state, u = i.buffer, d = [
						i.x,
						i.y,
						i.z,
						i.w
					], f = [
						"buffer",
						"normalized",
						"offset",
						"stride"
					];
					function p() {
						t("if(!", c, ".buffer){", o, ".enableVertexAttribArray(", s, ");}");
						var n = i.type, a = i.size ? t.def(i.size, "||", r) : r;
						if (t("if(", c, ".type!==", n, "||", c, ".size!==", a, "||", f.map(function(e) {
							return c + "." + e + "!==" + i[e];
						}).join("||"), "){", o, ".bindBuffer(", fo, ",", u, ".buffer);", o, ".vertexAttribPointer(", [
							s,
							a,
							n,
							i.normalized,
							i.stride,
							i.offset
						], ");", c, ".type=", n, ";", c, ".size=", a, ";", f.map(function(e) {
							return c + "." + e + "=" + i[e] + ";";
						}).join(""), "}"), v) {
							var l = i.divisor;
							t("if(", c, ".divisor!==", l, "){", e.instancing, ".vertexAttribDivisorANGLE(", [s, l], ");", c, ".divisor=", l, ";}");
						}
					}
					function m() {
						t("if(", c, ".buffer){", o, ".disableVertexAttribArray(", s, ");", c, ".buffer=null;", "}if(", sa.map(function(e, t) {
							return c + "." + e + "!==" + d[t];
						}).join("||"), "){", o, ".vertexAttrib4f(", s, ",", d, ");", sa.map(function(e, t) {
							return c + "." + e + "=" + d[t] + ";";
						}).join(""), "}");
					}
					l === la ? p() : l === ua ? m() : (t("if(", l, "===", la, "){"), p(), t("}else{"), m(), t("}"));
				}
				r.forEach(function(r) {
					var a = r.name, c = n.attributes[a], l;
					if (c) {
						if (!i(c)) return;
						l = c.append(e, t);
					} else {
						if (!i(_s)) return;
						var u = e.scopeAttrib(a);
						J.optional(function() {
							e.assert(t, u + ".state", "missing attribute " + a);
						}), l = {}, Object.keys(new g()).forEach(function(e) {
							l[e] = t.def(u, ".", e);
						});
					}
					s(e.link(r), o(r.info.type), l);
				});
			}
			function ie(e, t, r, i, a, o) {
				for (var s = e.shared, c = s.gl, l, u = 0; u < i.length; ++u) {
					var d = i[u], f = d.name, p = d.info.type, m = r.uniforms[f], h = e.link(d) + ".location", g;
					if (m) {
						if (!a(m)) continue;
						if (ms(m)) {
							var _ = m.value;
							if (J.command(_ != null, "missing uniform \"" + f + "\"", e.commandStr), p === Ho || p === Uo) {
								J.command(typeof _ == "function" && (p === Ho && (_._reglType === "texture2d" || _._reglType === "framebuffer") || p === Uo && (_._reglType === "textureCube" || _._reglType === "framebufferCube")), "invalid texture for uniform " + f, e.commandStr);
								var v = e.link(_._texture || _.color[0]._texture);
								t(c, ".uniform1i(", h, ",", v + ".bind());"), t.exit(v, ".unbind();");
							} else if (p === zo || p === Bo || p === Vo) {
								J.optional(function() {
									J.command(hn(_), "invalid matrix for uniform " + f, e.commandStr), J.command(p === zo && _.length === 4 || p === Bo && _.length === 9 || p === Vo && _.length === 16, "invalid length for matrix uniform " + f, e.commandStr);
								});
								var y = e.global.def("new Float32Array([" + Array.prototype.slice.call(_) + "])"), b = 2;
								p === Bo ? b = 3 : p === Vo && (b = 4), t(c, ".uniformMatrix", b, "fv(", h, ",false,", y, ");");
							} else {
								switch (p) {
									case Do:
										J.commandType(_, "number", "uniform " + f, e.commandStr), l = "1f";
										break;
									case Oo:
										J.command(hn(_) && _.length === 2, "uniform " + f, e.commandStr), l = "2f";
										break;
									case ko:
										J.command(hn(_) && _.length === 3, "uniform " + f, e.commandStr), l = "3f";
										break;
									case Ao:
										J.command(hn(_) && _.length === 4, "uniform " + f, e.commandStr), l = "4f";
										break;
									case Fo:
										J.commandType(_, "boolean", "uniform " + f, e.commandStr), l = "1i";
										break;
									case jo:
										J.commandType(_, "number", "uniform " + f, e.commandStr), l = "1i";
										break;
									case Io:
										J.command(hn(_) && _.length === 2, "uniform " + f, e.commandStr), l = "2i";
										break;
									case Mo:
										J.command(hn(_) && _.length === 2, "uniform " + f, e.commandStr), l = "2i";
										break;
									case Lo:
										J.command(hn(_) && _.length === 3, "uniform " + f, e.commandStr), l = "3i";
										break;
									case No:
										J.command(hn(_) && _.length === 3, "uniform " + f, e.commandStr), l = "3i";
										break;
									case Ro:
										J.command(hn(_) && _.length === 4, "uniform " + f, e.commandStr), l = "4i";
										break;
									case Po: J.command(hn(_) && _.length === 4, "uniform " + f, e.commandStr), l = "4i";
								}
								t(c, ".uniform", l, "(", h, ",", hn(_) ? Array.prototype.slice.call(_) : _, ");");
							}
							continue;
						}
						g = m.append(e, t);
					} else {
						if (!a(_s)) continue;
						g = t.def(s.uniforms, "[", n.id(f), "]");
					}
					p === Ho ? (J(!Array.isArray(g), "must specify a scalar prop for textures"), t("if(", g, "&&", g, "._reglType===\"framebuffer\"){", g, "=", g, ".color[0];", "}")) : p === Uo && (J(!Array.isArray(g), "must specify a scalar prop for cube maps"), t("if(", g, "&&", g, "._reglType===\"framebufferCube\"){", g, "=", g, ".color[0];", "}")), J.optional(function() {
						function n(n, r) {
							e.assert(t, n, "bad data or missing for uniform \"" + f + "\".  " + r);
						}
						function r(e) {
							J(!Array.isArray(g), "must not specify an array type for uniform"), n("typeof " + g + "===\"" + e + "\"", "invalid type, expected " + e);
						}
						function i(t, r) {
							Array.isArray(g) ? J(g.length === t, "must have length " + t) : n(s.isArrayLike + "(" + g + ")&&" + g + ".length===" + t, "invalid vector, should have length " + t, e.commandStr);
						}
						function a(t) {
							J(!Array.isArray(g), "must not specify a value type"), n("typeof " + g + "===\"function\"&&" + g + "._reglType===\"texture" + (t === go ? "2d" : "Cube") + "\"", "invalid texture type", e.commandStr);
						}
						switch (p) {
							case jo:
								r("number");
								break;
							case Mo:
								i(2, "number");
								break;
							case No:
								i(3, "number");
								break;
							case Po:
								i(4, "number");
								break;
							case Do:
								r("number");
								break;
							case Oo:
								i(2, "number");
								break;
							case ko:
								i(3, "number");
								break;
							case Ao:
								i(4, "number");
								break;
							case Fo:
								r("boolean");
								break;
							case Io:
								i(2, "boolean");
								break;
							case Lo:
								i(3, "boolean");
								break;
							case Ro:
								i(4, "boolean");
								break;
							case zo:
								i(4, "number");
								break;
							case Bo:
								i(9, "number");
								break;
							case Vo:
								i(16, "number");
								break;
							case Ho:
								a(go);
								break;
							case Uo: a(_o);
						}
					});
					var x = 1;
					switch (p) {
						case Ho:
						case Uo:
							var S = t.def(g, "._texture");
							t(c, ".uniform1i(", h, ",", S, ".bind());"), t.exit(S, ".unbind();");
							continue;
						case jo:
						case Fo:
							l = "1i";
							break;
						case Mo:
						case Io:
							l = "2i", x = 2;
							break;
						case No:
						case Lo:
							l = "3i", x = 3;
							break;
						case Po:
						case Ro:
							l = "4i", x = 4;
							break;
						case Do:
							l = "1f";
							break;
						case Oo:
							l = "2f", x = 2;
							break;
						case ko:
							l = "3f", x = 3;
							break;
						case Ao:
							l = "4f", x = 4;
							break;
						case zo:
							l = "Matrix2fv";
							break;
						case Bo:
							l = "Matrix3fv";
							break;
						case Vo: l = "Matrix4fv";
					}
					if (l.charAt(0) === "M") {
						t(c, ".uniform", l, "(", h, ",");
						var C = (p - zo + 2) ** 2, w = e.global.def("new Float32Array(", C, ")");
						Array.isArray(g) ? t("false,(", Me(C, function(e) {
							return w + "[" + e + "]=" + g[e];
						}), ",", w, ")") : t("false,(Array.isArray(", g, ")||", g, " instanceof Float32Array)?", g, ":(", Me(C, function(e) {
							return w + "[" + e + "]=" + g + "[" + e + "]";
						}), ",", w, ")"), t(");");
					} else if (x > 1) {
						for (var T = [], E = [], D = 0; D < x; ++D) Array.isArray(g) ? E.push(g[D]) : E.push(t.def(g + "[" + D + "]")), o && T.push(t.def());
						o && t("if(!", e.batchId, "||", T.map(function(e, t) {
							return e + "!==" + E[t];
						}).join("||"), "){", T.map(function(e, t) {
							return e + "=" + E[t] + ";";
						}).join("")), t(c, ".uniform", l, "(", h, ",", E.join(","), ");"), o && t("}");
					} else {
						if (J(!Array.isArray(g), "uniform value must not be an array"), o) {
							var O = t.def();
							t("if(!", e.batchId, "||", O, "!==", g, "){", O, "=", g, ";");
						}
						t(c, ".uniform", l, "(", h, ",", g, ");"), o && t("}");
					}
				}
			}
			function q(e, t, n, r) {
				var i = e.shared, a = i.gl, o = i.draw, s = r.draw;
				function c() {
					var c = s.elements, l, u = t;
					return c ? ((c.contextDep && r.contextDynamic || c.propDep) && (u = n), l = c.append(e, u), s.elementsActive && u("if(" + l + ")" + a + ".bindBuffer(" + po + "," + l + ".buffer.buffer);")) : (l = u.def(), u(l, "=", o, ".", Ya, ";", "if(", l, "){", a, ".bindBuffer(", po, ",", l, ".buffer.buffer);}", "else if(", i.vao, ".currentVAO){", l, "=", e.shared.elements + ".getElements(" + i.vao, ".currentVAO.elements);", b ? "" : "if(" + l + ")" + a + ".bindBuffer(" + po + "," + l + ".buffer.buffer);", "}")), l;
				}
				function l() {
					var i = s.count, a, c = t;
					return i ? ((i.contextDep && r.contextDynamic || i.propDep) && (c = n), a = i.append(e, c), J.optional(function() {
						i.MISSING && e.assert(t, "false", "missing vertex count"), i.DYNAMIC && e.assert(c, a + ">=0", "missing vertex count");
					})) : (a = c.def(o, ".", Za), J.optional(function() {
						e.assert(c, a + ">=0", "missing vertex count");
					})), a;
				}
				var u = c();
				function d(i) {
					var a = s[i];
					return a ? a.contextDep && r.contextDynamic || a.propDep ? a.append(e, n) : a.append(e, t) : t.def(o, ".", i);
				}
				var f = d(Xa), p = d(Qa), m = l();
				if (typeof m == "number") {
					if (m === 0) return;
				} else n("if(", m, "){"), n.exit("}");
				var h, g;
				v && (h = d($a), g = e.instancing);
				var _ = u + ".type", y = s.elements && ms(s.elements) && !s.vaoActive;
				function x() {
					function e() {
						n(g, ".drawElementsInstancedANGLE(", [
							f,
							m,
							_,
							p + "<<((" + _ + "-" + ca + ")>>1)",
							h
						], ");");
					}
					function t() {
						n(g, ".drawArraysInstancedANGLE(", [
							f,
							p,
							m,
							h
						], ");");
					}
					u && u !== "null" ? y ? e() : (n("if(", u, "){"), e(), n("}else{"), t(), n("}")) : t();
				}
				function S() {
					function e() {
						n(a + ".drawElements(" + [
							f,
							m,
							_,
							p + "<<((" + _ + "-" + ca + ")>>1)"
						] + ");");
					}
					function t() {
						n(a + ".drawArrays(" + [
							f,
							p,
							m
						] + ");");
					}
					u && u !== "null" ? y ? e() : (n("if(", u, "){"), e(), n("}else{"), t(), n("}")) : t();
				}
				v && (typeof h != "number" || h >= 0) ? typeof h == "string" ? (n("if(", h, ">0){"), x(), n("}else if(", h, "<0){"), S(), n("}")) : x() : S();
			}
			function ae(e, t, n, r, i) {
				var a = M(), o = a.proc("body", i);
				return J.optional(function() {
					a.commandStr = t.commandStr, a.command = a.link(t.commandStr);
				}), v && (a.instancing = o.def(a.shared.extensions, ".angle_instanced_arrays")), e(a, o, n, r), a.compile().body;
			}
			function oe(e, t, n, r) {
				ne(e, t), n.useVAO ? n.drawVAO ? t(e.shared.vao, ".setVAO(", n.drawVAO.append(e, t), ");") : t(e.shared.vao, ".setVAO(", e.shared.vao, ".targetVAO);") : (t(e.shared.vao, ".setVAO(null);"), re(e, t, n, r.attributes, function() {
					return !0;
				})), ie(e, t, n, r.uniforms, function() {
					return !0;
				}, !1), q(e, t, t, n);
			}
			function se(e, t) {
				var n = e.proc("draw", 1);
				ne(e, n), te(e, n, t.context), U(e, n, t.framebuffer), W(e, n, t), G(e, n, t.state), K(e, n, t, !1, !0);
				var r = t.shader.progVar.append(e, n);
				if (n(e.shared.gl, ".useProgram(", r, ".program);"), t.shader.program) oe(e, n, t, t.shader.program);
				else {
					n(e.shared.vao, ".setVAO(null);");
					var i = e.global.def("{}"), a = n.def(r, ".id"), o = n.def(i, "[", a, "]");
					n(e.cond(o).then(o, ".call(this,a0);").else(o, "=", i, "[", a, "]=", e.link(function(n) {
						return ae(oe, e, t, n, 1);
					}), "(", r, ");", o, ".call(this,a0);"));
				}
				Object.keys(t.state).length > 0 && n(e.shared.current, ".dirty=true;"), e.shared.vao && n(e.shared.vao, ".setVAO(null);");
			}
			function ce(e, t, n, r) {
				e.batchId = "a1", ne(e, t);
				function i() {
					return !0;
				}
				re(e, t, n, r.attributes, i), ie(e, t, n, r.uniforms, i, !1), q(e, t, t, n);
			}
			function le(e, t, n, r) {
				ne(e, t);
				var i = n.contextDep, a = t.def(), o = "a0", s = "a1", c = t.def();
				e.shared.props = c, e.batchId = a;
				var l = e.scope(), u = e.scope();
				t(l.entry, "for(", a, "=0;", a, "<", s, ";++", a, "){", c, "=", o, "[", a, "];", u, "}", l.exit);
				function d(e) {
					return e.contextDep && i || e.propDep;
				}
				function f(e) {
					return !d(e);
				}
				if (n.needsContext && te(e, u, n.context), n.needsFramebuffer && U(e, u, n.framebuffer), G(e, u, n.state, d), n.profile && d(n.profile) && K(e, u, n, !1, !0), r) n.useVAO ? n.drawVAO ? d(n.drawVAO) ? u(e.shared.vao, ".setVAO(", n.drawVAO.append(e, u), ");") : l(e.shared.vao, ".setVAO(", n.drawVAO.append(e, l), ");") : l(e.shared.vao, ".setVAO(", e.shared.vao, ".targetVAO);") : (l(e.shared.vao, ".setVAO(null);"), re(e, l, n, r.attributes, f), re(e, u, n, r.attributes, d)), ie(e, l, n, r.uniforms, f, !1), ie(e, u, n, r.uniforms, d, !0), q(e, l, u, n);
				else {
					var p = e.global.def("{}"), m = n.shader.progVar.append(e, u), h = u.def(m, ".id"), g = u.def(p, "[", h, "]");
					u(e.shared.gl, ".useProgram(", m, ".program);", "if(!", g, "){", g, "=", p, "[", h, "]=", e.link(function(t) {
						return ae(ce, e, n, t, 2);
					}), "(", m, ");}", g, ".call(this,a0[", a, "],", a, ");");
				}
			}
			function ue(e, t) {
				var n = e.proc("batch", 2);
				e.batchId = "0", ne(e, n);
				var r = !1, i = !0;
				Object.keys(t.context).forEach(function(e) {
					r ||= t.context[e].propDep;
				}), r || (te(e, n, t.context), i = !1);
				var a = t.framebuffer, o = !1;
				a ? (a.propDep ? r = o = !0 : a.contextDep && r && (o = !0), o || U(e, n, a)) : U(e, n, null), t.state.viewport && t.state.viewport.propDep && (r = !0);
				function s(e) {
					return e.contextDep && r || e.propDep;
				}
				W(e, n, t), G(e, n, t.state, function(e) {
					return !s(e);
				}), (!t.profile || !s(t.profile)) && K(e, n, t, !1, "a1"), t.contextDep = r, t.needsContext = i, t.needsFramebuffer = o;
				var c = t.shader.progVar;
				if (c.contextDep && r || c.propDep) le(e, n, t, null);
				else {
					var l = c.append(e, n);
					if (n(e.shared.gl, ".useProgram(", l, ".program);"), t.shader.program) le(e, n, t, t.shader.program);
					else {
						n(e.shared.vao, ".setVAO(null);");
						var u = e.global.def("{}"), d = n.def(l, ".id"), f = n.def(u, "[", d, "]");
						n(e.cond(f).then(f, ".call(this,a0,a1);").else(f, "=", u, "[", d, "]=", e.link(function(n) {
							return ae(le, e, t, n, 2);
						}), "(", l, ");", f, ".call(this,a0,a1);"));
					}
				}
				Object.keys(t.state).length > 0 && n(e.shared.current, ".dirty=true;"), e.shared.vao && n(e.shared.vao, ".setVAO(null);");
			}
			function de(e, t) {
				var r = e.proc("scope", 3);
				e.batchId = "a2";
				var i = e.shared, a = i.current;
				te(e, r, t.context), t.framebuffer && t.framebuffer.append(e, r), fs(Object.keys(t.state)).forEach(function(n) {
					var a = t.state[n].append(e, r);
					hn(a) ? a.forEach(function(t, i) {
						r.set(e.next[n], "[" + i + "]", t);
					}) : r.set(i.next, "." + n, a);
				}), K(e, r, t, !0, !0), [
					Ya,
					Qa,
					Za,
					$a,
					Xa
				].forEach(function(n) {
					var a = t.draw[n];
					a && r.set(i.draw, "." + n, "" + a.append(e, r));
				}), Object.keys(t.uniforms).forEach(function(a) {
					var o = t.uniforms[a].append(e, r);
					Array.isArray(o) && (o = "[" + o.join() + "]"), r.set(i.uniforms, "[" + n.id(a) + "]", o);
				}), Object.keys(t.attributes).forEach(function(n) {
					var i = t.attributes[n].append(e, r), a = e.scopeAttrib(n);
					Object.keys(new g()).forEach(function(e) {
						r.set(a, "." + e, i[e]);
					});
				}), t.scopeVAO && r.set(i.vao, ".targetVAO", t.scopeVAO.append(e, r));
				function o(n) {
					var a = t.shader[n];
					a && r.set(i.shader, "." + n, a.append(e, r));
				}
				o(qa), o(Ja), Object.keys(t.state).length > 0 && (r(a, ".dirty=true;"), r.exit(a, ".dirty=true;")), r("a1(", e.shared.context, ",a0,", e.batchId, ");");
			}
			function fe(e) {
				if (!(typeof e != "object" || hn(e))) {
					for (var t = Object.keys(e), n = 0; n < t.length; ++n) if (be.isDynamic(e[t[n]])) return !0;
					return !1;
				}
			}
			function pe(e, t, n) {
				var r = t.static[n];
				if (!r || !fe(r)) return;
				var i = e.global, a = Object.keys(r), o = !1, s = !1, c = !1, l = e.global.def("{}");
				a.forEach(function(t) {
					var n = r[t];
					if (be.isDynamic(n)) {
						typeof n == "function" && (n = r[t] = be.unbox(n));
						var a = gs(n, null);
						o ||= a.thisDep, c ||= a.propDep, s ||= a.contextDep;
					} else {
						switch (i(l, ".", t, "="), typeof n) {
							case "number":
								i(n);
								break;
							case "string":
								i("\"", n, "\"");
								break;
							case "object":
								Array.isArray(n) && i("[", n.join(), "]");
								break;
							default: i(e.link(n));
						}
						i(";");
					}
				});
				function u(e, t) {
					a.forEach(function(n) {
						var i = r[n];
						be.isDynamic(i) && t(l, ".", n, "=", e.invoke(t, i), ";");
					});
				}
				t.dynamic[n] = new be.DynamicVariable(ha, {
					thisDep: o,
					contextDep: s,
					propDep: c,
					ref: l,
					append: u
				}), delete t.static[n];
			}
			function me(e, n, r, i, a) {
				var o = M();
				o.stats = o.link(a), Object.keys(n.static).forEach(function(e) {
					pe(o, n, e);
				}), uo.forEach(function(t) {
					pe(o, e, t);
				});
				var s = H(e, n, r, i, o);
				return se(o, s), de(o, s), ue(o, s), t(o.compile(), { destroy: function() {
					s.shader.program.destroy();
				} });
			}
			return {
				next: S,
				current: x,
				procs: (function() {
					var e = M(), t = e.proc("poll"), n = e.proc("refresh"), a = e.block();
					t(a), n(a);
					var o = e.shared, s = o.gl, c = o.next, l = o.current;
					a(l, ".dirty=false;"), U(e, t), U(e, n, null, !0);
					var u;
					v && (u = e.link(v)), r.oes_vertex_array_object && n(e.link(r.oes_vertex_array_object), ".bindVertexArrayOES(null);");
					for (var d = 0; d < i.maxAttributes; ++d) {
						var f = n.def(o.attributes, "[", d, "]"), p = e.cond(f, ".buffer");
						p.then(s, ".enableVertexAttribArray(", d, ");", s, ".bindBuffer(", fo, ",", f, ".buffer.buffer);", s, ".vertexAttribPointer(", d, ",", f, ".size,", f, ".type,", f, ".normalized,", f, ".stride,", f, ".offset);").else(s, ".disableVertexAttribArray(", d, ");", s, ".vertexAttrib4f(", d, ",", f, ".x,", f, ".y,", f, ".z,", f, ".w);", f, ".buffer=null;"), n(p), v && n(u, ".vertexAttribDivisorANGLE(", d, ",", f, ".divisor);");
					}
					return n(e.shared.vao, ".currentVAO=null;", e.shared.vao, ".setVAO(", e.shared.vao, ".targetVAO);"), Object.keys(w).forEach(function(r) {
						var i = w[r], o = a.def(c, ".", r), u = e.block();
						u("if(", o, "){", s, ".enable(", i, ")}else{", s, ".disable(", i, ")}", l, ".", r, "=", o, ";"), n(u), t("if(", o, "!==", l, ".", r, "){", u, "}");
					}), Object.keys(T).forEach(function(r) {
						var i = T[r], o = x[r], u, d, f = e.block();
						if (f(s, ".", i, "("), hn(o)) {
							var p = o.length;
							u = e.global.def(c, ".", r), d = e.global.def(l, ".", r), f(Me(p, function(e) {
								return u + "[" + e + "]";
							}), ");", Me(p, function(e) {
								return d + "[" + e + "]=" + u + "[" + e + "];";
							}).join("")), t("if(", Me(p, function(e) {
								return u + "[" + e + "]!==" + d + "[" + e + "]";
							}).join("||"), "){", f, "}");
						} else u = a.def(c, ".", r), d = a.def(l, ".", r), f(u, ");", l, ".", r, "=", u, ";"), t("if(", u, "!==", d, "){", f, "}");
						n(f);
					}), e.compile();
				})(),
				compile: me
			};
		}
		function ys() {
			return {
				vaoCount: 0,
				bufferCount: 0,
				elementsCount: 0,
				framebufferCount: 0,
				shaderCount: 0,
				textureCount: 0,
				cubeCount: 0,
				renderbufferCount: 0,
				maxTextureUnits: 0
			};
		}
		var bs = 34918, xs = 34919, Ss = 35007, Cs = function(e, t) {
			if (!t.ext_disjoint_timer_query) return null;
			var n = [];
			function r() {
				return n.pop() || t.ext_disjoint_timer_query.createQueryEXT();
			}
			function i(e) {
				n.push(e);
			}
			var a = [];
			function o(e) {
				var n = r();
				t.ext_disjoint_timer_query.beginQueryEXT(Ss, n), a.push(n), p(a.length - 1, a.length, e);
			}
			function s() {
				t.ext_disjoint_timer_query.endQueryEXT(Ss);
			}
			function c() {
				this.startQueryIndex = -1, this.endQueryIndex = -1, this.sum = 0, this.stats = null;
			}
			var l = [];
			function u() {
				return l.pop() || new c();
			}
			function d(e) {
				l.push(e);
			}
			var f = [];
			function p(e, t, n) {
				var r = u();
				r.startQueryIndex = e, r.endQueryIndex = t, r.sum = 0, r.stats = n, f.push(r);
			}
			var m = [], h = [];
			function g() {
				var e, n, r = a.length;
				if (r !== 0) {
					h.length = Math.max(h.length, r + 1), m.length = Math.max(m.length, r + 1), m[0] = 0, h[0] = 0;
					var o = 0;
					for (e = 0, n = 0; n < a.length; ++n) {
						var s = a[n];
						t.ext_disjoint_timer_query.getQueryObjectEXT(s, xs) ? (o += t.ext_disjoint_timer_query.getQueryObjectEXT(s, bs), i(s)) : a[e++] = s, m[n + 1] = o, h[n + 1] = e;
					}
					for (a.length = e, e = 0, n = 0; n < f.length; ++n) {
						var c = f[n], l = c.startQueryIndex, u = c.endQueryIndex;
						c.sum += m[u] - m[l];
						var p = h[l], g = h[u];
						g === p ? (c.stats.gpuTime += c.sum / 1e6, d(c)) : (c.startQueryIndex = p, c.endQueryIndex = g, f[e++] = c);
					}
					f.length = e;
				}
			}
			return {
				beginQuery: o,
				endQuery: s,
				pushScopeStats: p,
				update: g,
				getNumPendingQueries: function() {
					return a.length;
				},
				clear: function() {
					n.push.apply(n, a);
					for (var e = 0; e < n.length; e++) t.ext_disjoint_timer_query.deleteQueryEXT(n[e]);
					a.length = 0, n.length = 0;
				},
				restore: function() {
					a.length = 0, n.length = 0;
				}
			};
		}, ws = 16384, Ts = 256, Es = 1024, Ds = 34962, Os = "webglcontextlost", ks = "webglcontextrestored", As = 1, js = 2, Ms = 3;
		function Ns(e, t) {
			for (var n = 0; n < e.length; ++n) if (e[n] === t) return n;
			return -1;
		}
		function Ps(e) {
			var n = Ae(e);
			if (!n) return null;
			var r = n.gl, i = r.getContextAttributes(), a = r.isContextLost(), o = je(r, n);
			if (!o) return null;
			var s = Ce(), c = ys(), l = o.extensions, u = Cs(r, l), d = Se(), f = r.drawingBufferWidth, p = r.drawingBufferHeight, m = {
				tick: 0,
				time: 0,
				viewportWidth: f,
				viewportHeight: p,
				framebufferWidth: f,
				framebufferHeight: p,
				drawingBufferWidth: f,
				drawingBufferHeight: p,
				pixelRatio: n.pixelRatio
			}, h = {}, g = {
				elements: null,
				primitive: 4,
				count: -1,
				offset: 0,
				instances: -1
			}, _ = Dt(r, l), v = Yt(r, c, n, x), y = un(r, l, v, c), b = qi(r, l, _, c, v, y, g);
			function x(e) {
				return b.destroyBuffer(e);
			}
			var S = Qi(r, s, c, n), C = Zr(r, l, _, function() {
				E.procs.poll();
			}, m, c, n), w = ui(r, l, _, c, n), T = Vi(r, l, _, C, w, c), E = vs(r, s, l, _, v, y, C, T, h, b, S, g, m, u, n), D = ra(r, T, E.procs.poll, m, i, l, _), O = E.next, k = r.canvas, A = [], j = [], M = [], N = [n.onDestroy], P = null;
			function F() {
				if (A.length === 0) {
					u && u.update(), P = null;
					return;
				}
				P = xe.next(F), G();
				for (var e = A.length - 1; e >= 0; --e) {
					var t = A[e];
					t && t(m, null, 0);
				}
				r.flush(), u && u.update();
			}
			function I() {
				!P && A.length > 0 && (P = xe.next(F));
			}
			function L() {
				P &&= (xe.cancel(F), null);
			}
			function R(e) {
				e.preventDefault(), a = !0, L(), j.forEach(function(e) {
					e();
				});
			}
			function ee(e) {
				r.getError(), a = !1, o.restore(), S.restore(), v.restore(), C.restore(), w.restore(), T.restore(), b.restore(), u && u.restore(), E.procs.refresh(), I(), M.forEach(function(e) {
					e();
				});
			}
			k && (k.addEventListener(Os, R, !1), k.addEventListener(ks, ee, !1));
			function z() {
				A.length = 0, L(), k && (k.removeEventListener(Os, R), k.removeEventListener(ks, ee)), S.clear(), T.clear(), w.clear(), b.clear(), C.clear(), y.clear(), v.clear(), u && u.clear(), N.forEach(function(e) {
					e();
				});
			}
			function B(e) {
				J(!!e, "invalid args to regl({...})"), J.type(e, "object", "invalid args to regl({...})");
				function n(e) {
					var n = t({}, e);
					delete n.uniforms, delete n.attributes, delete n.context, delete n.vao, "stencil" in n && n.stencil.op && (n.stencil.opBack = n.stencil.opFront = n.stencil.op, delete n.stencil.op);
					function r(e) {
						if (e in n) {
							var t = n[e];
							delete n[e], Object.keys(t).forEach(function(r) {
								n[e + "." + r] = t[r];
							});
						}
					}
					return r("blend"), r("depth"), r("cull"), r("stencil"), r("polygonOffset"), r("scissor"), r("sample"), "vao" in e && (n.vao = e.vao), n;
				}
				function r(e, t) {
					var n = {}, r = {};
					return Object.keys(e).forEach(function(i) {
						var a = e[i];
						if (be.isDynamic(a)) {
							r[i] = be.unbox(a, i);
							return;
						}
						if (t && Array.isArray(a)) {
							for (var o = 0; o < a.length; ++o) if (be.isDynamic(a[o])) {
								r[i] = be.unbox(a, i);
								return;
							}
						}
						n[i] = a;
					}), {
						dynamic: r,
						static: n
					};
				}
				var i = r(e.context || {}, !0), o = r(e.uniforms || {}, !0), s = r(e.attributes || {}, !1), c = r(n(e), !1), l = {
					gpuTime: 0,
					cpuTime: 0,
					count: 0
				}, u = E.compile(c, s, o, i, l), d = u.draw, f = u.batch, p = u.scope, m = [];
				function h(e) {
					for (; m.length < e;) m.push(null);
					return m;
				}
				function g(e, t) {
					var n;
					if (a && J.raise("context lost"), typeof e == "function") return p.call(this, null, e, 0);
					if (typeof t == "function") {
						if (typeof e == "number") for (n = 0; n < e; ++n) p.call(this, null, t, n);
						else if (Array.isArray(e)) for (n = 0; n < e.length; ++n) p.call(this, e[n], t, n);
						else return p.call(this, e, t, 0);
					} else if (typeof e == "number") {
						if (e > 0) return f.call(this, h(e | 0), e | 0);
					} else if (Array.isArray(e)) {
						if (e.length) return f.call(this, e, e.length);
					} else return d.call(this, e);
				}
				return t(g, {
					stats: l,
					destroy: function() {
						u.destroy();
					}
				});
			}
			var V = T.setFBO = B({ framebuffer: be.define.call(null, As, "framebuffer") });
			function H(e, t) {
				var n = 0;
				E.procs.poll();
				var i = t.color;
				i && (r.clearColor(+i[0] || 0, +i[1] || 0, +i[2] || 0, +i[3] || 0), n |= ws), "depth" in t && (r.clearDepth(+t.depth), n |= Ts), "stencil" in t && (r.clearStencil(t.stencil | 0), n |= Es), J(!!n, "called regl.clear with no buffer specified"), r.clear(n);
			}
			function te(e) {
				if (J(typeof e == "object" && e, "regl.clear() takes an object as input"), "framebuffer" in e) {
					if (e.framebuffer && e.framebuffer_reglType === "framebufferCube") for (var n = 0; n < 6; ++n) V(t({ framebuffer: e.framebuffer.faces[n] }, e), H);
					else V(e, H);
				} else H(null, e);
			}
			function U(e) {
				J.type(e, "function", "regl.frame() callback must be a function"), A.push(e);
				function t() {
					var t = Ns(A, e);
					J(t >= 0, "cannot cancel a frame twice");
					function n() {
						var e = Ns(A, n);
						A[e] = A[A.length - 1], --A.length, A.length <= 0 && L();
					}
					A[t] = n;
				}
				return I(), { cancel: t };
			}
			function W() {
				var e = O.viewport, t = O.scissor_box;
				e[0] = e[1] = t[0] = t[1] = 0, m.viewportWidth = m.framebufferWidth = m.drawingBufferWidth = e[2] = t[2] = r.drawingBufferWidth, m.viewportHeight = m.framebufferHeight = m.drawingBufferHeight = e[3] = t[3] = r.drawingBufferHeight;
			}
			function G() {
				m.tick += 1, m.time = K(), W(), E.procs.poll();
			}
			function ne() {
				C.refresh(), W(), E.procs.refresh(), u && u.update();
			}
			function K() {
				return (Se() - d) / 1e3;
			}
			ne();
			function re(e, t) {
				J.type(t, "function", "listener callback must be a function");
				var n;
				switch (e) {
					case "frame": return U(t);
					case "lost":
						n = j;
						break;
					case "restore":
						n = M;
						break;
					case "destroy":
						n = N;
						break;
					default: J.raise("invalid event, must be one of frame,lost,restore,destroy");
				}
				return n.push(t), { cancel: function() {
					for (var e = 0; e < n.length; ++e) if (n[e] === t) {
						n[e] = n[n.length - 1], n.pop();
						return;
					}
				} };
			}
			var ie = t(B, {
				clear: te,
				prop: be.define.bind(null, As),
				context: be.define.bind(null, js),
				this: be.define.bind(null, Ms),
				draw: B({}),
				buffer: function(e) {
					return v.create(e, Ds, !1, !1);
				},
				elements: function(e) {
					return y.create(e, !1);
				},
				texture: C.create2D,
				cube: C.createCube,
				renderbuffer: w.create,
				framebuffer: T.create,
				framebufferCube: T.createCube,
				vao: b.createVAO,
				attributes: i,
				frame: U,
				on: re,
				limits: _,
				hasExtension: function(e) {
					return _.extensions.indexOf(e.toLowerCase()) >= 0;
				},
				read: D,
				destroy: z,
				_gl: r,
				_refresh: ne,
				poll: function() {
					G(), u && u.update();
				},
				now: K,
				stats: c
			});
			return n.onDone(null, ie), ie;
		}
		return Ps;
	}));
})))()), x = 1e-6, S = typeof Float32Array < "u" ? Float32Array : Array;
Math.hypot || (Math.hypot = function() {
	for (var e = 0, t = arguments.length; t--;) e += arguments[t] * arguments[t];
	return Math.sqrt(e);
});
function C() {
	var e = new S(16);
	return S != Float32Array && (e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0), e[0] = 1, e[5] = 1, e[10] = 1, e[15] = 1, e;
}
function w(e) {
	var t = new S(16);
	return t[0] = e[0], t[1] = e[1], t[2] = e[2], t[3] = e[3], t[4] = e[4], t[5] = e[5], t[6] = e[6], t[7] = e[7], t[8] = e[8], t[9] = e[9], t[10] = e[10], t[11] = e[11], t[12] = e[12], t[13] = e[13], t[14] = e[14], t[15] = e[15], t;
}
function T(e, t) {
	var n = t[0], r = t[1], i = t[2], a = t[3], o = t[4], s = t[5], c = t[6], l = t[7], u = t[8], d = t[9], f = t[10], p = t[11], m = t[12], h = t[13], g = t[14], _ = t[15], v = n * s - r * o, y = n * c - i * o, b = n * l - a * o, x = r * c - i * s, S = r * l - a * s, C = i * l - a * c, w = u * h - d * m, T = u * g - f * m, E = u * _ - p * m, D = d * g - f * h, O = d * _ - p * h, k = f * _ - p * g, A = v * k - y * O + b * D + x * E - S * T + C * w;
	return A ? (A = 1 / A, e[0] = (s * k - c * O + l * D) * A, e[1] = (i * O - r * k - a * D) * A, e[2] = (h * C - g * S + _ * x) * A, e[3] = (f * S - d * C - p * x) * A, e[4] = (c * E - o * k - l * T) * A, e[5] = (n * k - i * E + a * T) * A, e[6] = (g * b - m * C - _ * y) * A, e[7] = (u * C - f * b + p * y) * A, e[8] = (o * O - s * E + l * w) * A, e[9] = (r * E - n * O - a * w) * A, e[10] = (m * S - h * b + _ * v) * A, e[11] = (d * b - u * S - p * v) * A, e[12] = (s * T - o * D - c * w) * A, e[13] = (n * D - r * T + i * w) * A, e[14] = (h * y - m * x - g * v) * A, e[15] = (u * x - d * y + f * v) * A, e) : null;
}
function E(e, t, n) {
	var r = t[0], i = t[1], a = t[2], o = t[3], s = t[4], c = t[5], l = t[6], u = t[7], d = t[8], f = t[9], p = t[10], m = t[11], h = t[12], g = t[13], _ = t[14], v = t[15], y = n[0], b = n[1], x = n[2], S = n[3];
	return e[0] = y * r + b * s + x * d + S * h, e[1] = y * i + b * c + x * f + S * g, e[2] = y * a + b * l + x * p + S * _, e[3] = y * o + b * u + x * m + S * v, y = n[4], b = n[5], x = n[6], S = n[7], e[4] = y * r + b * s + x * d + S * h, e[5] = y * i + b * c + x * f + S * g, e[6] = y * a + b * l + x * p + S * _, e[7] = y * o + b * u + x * m + S * v, y = n[8], b = n[9], x = n[10], S = n[11], e[8] = y * r + b * s + x * d + S * h, e[9] = y * i + b * c + x * f + S * g, e[10] = y * a + b * l + x * p + S * _, e[11] = y * o + b * u + x * m + S * v, y = n[12], b = n[13], x = n[14], S = n[15], e[12] = y * r + b * s + x * d + S * h, e[13] = y * i + b * c + x * f + S * g, e[14] = y * a + b * l + x * p + S * _, e[15] = y * o + b * u + x * m + S * v, e;
}
function D(e, t) {
	return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = t[0], e[13] = t[1], e[14] = t[2], e[15] = 1, e;
}
function O(e, t) {
	return e[0] = t[0], e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = t[1], e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = t[2], e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e;
}
function k(e, t, n) {
	var r = n[0], i = n[1], a = n[2], o = Math.hypot(r, i, a), s, c, l;
	return o < x ? null : (o = 1 / o, r *= o, i *= o, a *= o, s = Math.sin(t), c = Math.cos(t), l = 1 - c, e[0] = r * r * l + c, e[1] = i * r * l + a * s, e[2] = a * r * l - i * s, e[3] = 0, e[4] = r * i * l - a * s, e[5] = i * i * l + c, e[6] = a * i * l + r * s, e[7] = 0, e[8] = r * a * l + i * s, e[9] = i * a * l - r * s, e[10] = a * a * l + c, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e);
}
function A(e, t) {
	return e[0] = t[12], e[1] = t[13], e[2] = t[14], e;
}
function j(e, t) {
	var n = t[0], r = t[1], i = t[2], a = t[4], o = t[5], s = t[6], c = t[8], l = t[9], u = t[10];
	return e[0] = Math.hypot(n, r, i), e[1] = Math.hypot(a, o, s), e[2] = Math.hypot(c, l, u), e;
}
function M() {
	var e = new S(4);
	return S != Float32Array && (e[0] = 0, e[1] = 0, e[2] = 0, e[3] = 0), e;
}
function N(e, t, n) {
	var r = t[0], i = t[1], a = t[2], o = t[3];
	return e[0] = n[0] * r + n[4] * i + n[8] * a + n[12] * o, e[1] = n[1] * r + n[5] * i + n[9] * a + n[13] * o, e[2] = n[2] * r + n[6] * i + n[10] * a + n[14] * o, e[3] = n[3] * r + n[7] * i + n[11] * a + n[15] * o, e;
}
(function() {
	var e = M();
	return function(t, n, r, i, a, o) {
		var s, c;
		for (n ||= 4, r ||= 0, c = i ? Math.min(i * n + r, t.length) : t.length, s = r; s < c; s += n) e[0] = t[s], e[1] = t[s + 1], e[2] = t[s + 2], e[3] = t[s + 3], a(e, e, o), t[s] = e[0], t[s + 1] = e[1], t[s + 2] = e[2], t[s + 3] = e[3];
		return t;
	};
})();
function P() {
	var e = new S(2);
	return S != Float32Array && (e[0] = 0, e[1] = 0), e;
}
function F(e, t) {
	var n = e[0], r = e[1], i = t[0], a = t[1], o = Math.sqrt(n * n + r * r) * Math.sqrt(i * i + a * a), s = o && (n * i + r * a) / o;
	return Math.acos(Math.min(Math.max(s, -1), 1));
}
(function() {
	var e = P();
	return function(t, n, r, i, a, o) {
		var s, c;
		for (n ||= 2, r ||= 0, c = i ? Math.min(i * n + r, t.length) : t.length, s = r; s < c; s += n) e[0] = t[s], e[1] = t[s + 1], a(e, e, o), t[s] = e[0], t[s + 1] = e[1];
		return t;
	};
})();
var I = (e = [0, 0], t = 1, n = 0, r = [0, 0], i = [[0, Infinity], [0, Infinity]], a = [[-Infinity, Infinity], [-Infinity, Infinity]]) => {
	let o = /* @__PURE__ */ new Float32Array(16), s = /* @__PURE__ */ new Float32Array(16), c = /* @__PURE__ */ new Float32Array(16), l = C(), u = [
		...r.slice(0, 2),
		0,
		1
	], d = Array.isArray(i[0]) ? [...i[0]] : [...i], f = Array.isArray(i[0]) ? [...i[1]] : [...i], p = Array.isArray(a[0]) ? [...a[0]] : [...a], m = Array.isArray(a[0]) ? [...a[1]] : [...a], h = () => j(o, l).slice(0, 2), g = () => {
		let e = h();
		return Math.min(e[0], e[1]);
	}, _ = () => {
		let e = h();
		return Math.max(e[0], e[1]);
	}, v = () => Math.acos(l[0] / _()), y = () => [[...d], [...f]], b = () => [[...p], [...m]], x = () => {
		let e = h();
		return [1 / e[0], 1 / e[1]];
	}, S = () => 1 / g(), w = () => 1 / _(), M = () => A(o, l).slice(0, 2), P = () => N(o, u, T(c, l)).slice(0, 2), F = () => l, I = () => u.slice(0, 2), L = ([e = 0, t = 0] = [], n = 1, r = 0) => {
		l = C(), R([-e, -t]), z(r), ee(1 / n);
	}, R = ([e = 0, t = 0] = []) => {
		o[0] = e, o[1] = t, o[2] = 0;
		let n = D(s, o);
		E(l, n, l);
	}, ee = (e, t) => {
		let n = Array.isArray(e), r = n ? e[0] : e, i = n ? e[1] : e;
		if (r <= 0 || i <= 0 || r === 1 && i === 1) return;
		let a = h(), p = a[0] * r, m = a[1] * i;
		if (r = Math.max(d[0], Math.min(p, d[1])) / a[0], i = Math.max(f[0], Math.min(m, f[1])) / a[1], r === 1 && i === 1) return;
		o[0] = r, o[1] = i, o[2] = 1;
		let g = O(s, o), _ = t ? [...t, 0] : u, v = D(o, _);
		E(l, v, E(l, g, E(l, T(c, v), l)));
	}, z = (e) => {
		let t = C();
		k(t, e, [
			0,
			0,
			1
		]), E(l, t, l);
	}, B = (e) => {
		let t = Array.isArray(e[0]);
		d[0] = t ? e[0][0] : e[0], d[1] = t ? e[0][1] : e[1], f[0] = t ? e[1][0] : e[0], f[1] = t ? e[1][1] : e[1];
	}, V = (e) => {
		let t = Array.isArray(e[0]);
		p[0] = t ? e[0][0] : e[0], p[1] = t ? e[0][1] : e[1], m[0] = t ? e[1][0] : e[0], m[1] = t ? e[1][1] : e[1];
	}, H = (e) => {
		!e || e.length < 16 || (l = e);
	};
	return L(e, t, n), {
		get translation() {
			return M();
		},
		get target() {
			return P();
		},
		get scaling() {
			return h();
		},
		get minScaling() {
			return g();
		},
		get maxScaling() {
			return _();
		},
		get scaleBounds() {
			return y();
		},
		get translationBounds() {
			return b();
		},
		get distance() {
			return x();
		},
		get minDistance() {
			return S();
		},
		get maxDistance() {
			return w();
		},
		get rotation() {
			return v();
		},
		get view() {
			return F();
		},
		get viewCenter() {
			return I();
		},
		lookAt: L,
		translate: R,
		pan: R,
		rotate: z,
		scale: ee,
		zoom: ee,
		reset: () => {
			L(e, t, n);
		},
		set: (...e) => (console.warn("`set()` is deprecated. Please use `setView()` instead."), H(...e)),
		setScaleBounds: B,
		setTranslationBounds: V,
		setView: H,
		setViewCenter: (e) => {
			u = [
				...e.slice(0, 2),
				0,
				1
			];
		}
	};
}, L = ["pan", "rotate"], R = {
	alt: "altKey",
	cmd: "metaKey",
	ctrl: "ctrlKey",
	meta: "metaKey",
	shift: "shiftKey"
}, ee = (e, { distance: t = 1, target: n = [0, 0], rotation: r = 0, isNdc: i = !0, isFixed: a = !1, isPan: o = !0, isPanInverted: s = [!1, !0], panSpeed: c = 1, isRotate: l = !0, rotateSpeed: u = 1, defaultMouseDownMoveAction: d = "pan", mouseDownMoveModKey: f = "alt", isZoom: p = !0, zoomSpeed: m = 1, viewCenter: h, scaleBounds: g, translationBounds: _, onKeyDown: v = () => {}, onKeyUp: y = () => {}, onMouseDown: b = () => {}, onMouseUp: x = () => {}, onMouseMove: S = () => {}, onWheel: C = () => {} } = {}) => {
	let w = I(n, t, r, h, g, _), T = 0, E = 0, D = 0, O = 0, k = 0, A = 0, j = !1, M = 0, N = 1, P = 1, ee = 1, z = !1, B = !1, V = !1, H = d === "pan", te = o, U = o, W = s, G = s, ne = p, K = p, re = () => {
		te = Array.isArray(o) ? !!o[0] : o, U = Array.isArray(o) ? !!o[1] : o, W = Array.isArray(s) ? !!s[0] : s, G = Array.isArray(s) ? !!s[1] : s, ne = Array.isArray(p) ? !!p[0] : p, K = Array.isArray(p) ? !!p[1] : p;
	};
	re();
	let ie = i ? (e) => e / N * 2 * ee : (e) => e, q = i ? (e) => e / P * 2 : (e) => -e, ae = i ? (e) => (-1 + e / N * 2) * ee : (e) => e, oe = i ? (e) => 1 - e / P * 2 : (e) => e, se = () => {
		if (a) {
			let e = B;
			return B = !1, e;
		}
		z = !1;
		let e = T, t = E;
		if ((te || U) && j && (H && !V || !H && V)) {
			let n = W ? k - e : e - k, r = te ? ie(c * n) : 0, i = G ? A - t : t - A, a = U ? q(c * i) : 0;
			(r !== 0 || a !== 0) && (w.pan([r, a]), z = !0);
		}
		if ((ne || K) && M) {
			let e = m * Math.exp(M / P), t = ae(D), n = oe(O);
			w.scale([ne ? 1 / e : 1, K ? 1 / e : 1], [t, n]), z = !0;
		}
		if (l && j && (H && V || !H && !V) && Math.abs(k - e) + Math.abs(A - t) > 0) {
			let n = N / 2, r = P / 2, i = k - n, a = r - A, o = e - n, s = r - t, c = F([i, a], [o, s]), l = i * s - o * a;
			w.rotate(u * c * Math.sign(l)), z = !0;
		}
		M = 0, k = e, A = t;
		let n = z || B;
		return B = !1, n;
	}, ce = ({ defaultMouseDownMoveAction: e = null, isFixed: t = null, isPan: n = null, isPanInverted: r = null, isRotate: i = null, isZoom: h = null, panSpeed: g = null, rotateSpeed: _ = null, zoomSpeed: v = null, mouseDownMoveModKey: y = null } = {}) => {
		d = e !== null && L.includes(e) ? e : d, H = d === "pan", a = t === null ? a : t, o = n === null ? o : n, s = r === null ? s : r, l = i === null ? l : i, p = h === null ? p : h, c = +g > 0 ? g : c, u = +_ > 0 ? _ : u, m = +v > 0 ? v : m, re(), f = y !== null && Object.keys(R).includes(y) ? y : f;
	}, J = () => {
		let t = e.getBoundingClientRect();
		N = t.width, P = t.height, ee = N / P;
	}, le = (e) => {
		V = !1, y(e);
	}, ue = (e) => {
		V = e[R[f]], v(e);
	}, de = (e) => {
		j = !1, x(e);
	}, fe = (e) => {
		j = e.buttons === 1, b(e);
	}, pe = document.createEvent("MouseEvent").offsetX === void 0 ? (t) => {
		let n = e.getBoundingClientRect();
		D = t.clientX - n.left, O = t.clientY - n.top;
	} : (e) => {
		D = e.offsetX, O = e.offsetY;
	}, me = (e) => {
		T = e.clientX, E = e.clientY;
	}, he = (e) => {
		me(e), S(e);
	}, ge = (e) => {
		if (ne || K) {
			e.preventDefault(), me(e), pe(e);
			let t = e.deltaMode === 1 ? 12 : 1;
			M += t * (e.deltaY || e.deltaX || 0);
		}
		C(e);
	};
	window.addEventListener("keydown", ue, { passive: !0 }), window.addEventListener("keyup", le, { passive: !0 }), e.addEventListener("mousedown", fe, { passive: !0 }), window.addEventListener("mouseup", de, { passive: !0 }), window.addEventListener("mousemove", he, { passive: !0 }), e.addEventListener("wheel", ge, { passive: !1 }), w.config = ce, w.dispose = () => {
		w = void 0, window.removeEventListener("keydown", ue), window.removeEventListener("keyup", le), e.removeEventListener("mousedown", fe), window.removeEventListener("mouseup", de), window.removeEventListener("mousemove", he), e.removeEventListener("wheel", ge);
	}, w.refresh = J, w.tick = se;
	let _e = (e) => function() {
		e.apply(null, arguments), B = !0;
	};
	return w.lookAt = _e(w.lookAt), w.translate = _e(w.translate), w.pan = _e(w.pan), w.rotate = _e(w.rotate), w.scale = _e(w.scale), w.zoom = _e(w.zoom), w.reset = _e(w.reset), w.set = _e(w.set), w.setScaleBounds = _e(w.setScaleBounds), w.setTranslationBounds = _e(w.setTranslationBounds), w.setView = _e(w.setView), w.setViewCenter = _e(w.setViewCenter), J(), w;
}, z = "\nprecision mediump float;\nvarying vec4 color;\nvoid main() {\n  gl_FragColor = color;\n}", B = "\nuniform mat4 projectionViewModel;\nuniform float aspectRatio;\n\nuniform sampler2D colorTex;\nuniform float colorTexRes;\nuniform float colorTexEps;\nuniform float width;\nuniform float useOpacity;\nuniform float useColorOpacity;\nuniform int miter;\n\nattribute vec3 prevPosition;\nattribute vec3 currPosition;\nattribute vec3 nextPosition;\nattribute float opacity;\nattribute float offsetScale;\nattribute float colorIndex;\n\nvarying vec4 color;\n\nvoid main() {\n  vec2 aspectVec = vec2(aspectRatio, 1.0);\n  vec4 prevProjected = projectionViewModel * vec4(prevPosition, 1.0);\n  vec4 currProjected = projectionViewModel * vec4(currPosition, 1.0);\n  vec4 nextProjected = projectionViewModel * vec4(nextPosition, 1.0);\n\n  // get 2D screen space with W divide and aspect correction\n  vec2 prevScreen = prevProjected.xy / prevProjected.w * aspectVec;\n  vec2 currScreen = currProjected.xy / currProjected.w * aspectVec;\n  vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;\n\n  // starting point uses (next - current)\n  vec2 dir = vec2(0.0);\n  if (currScreen == prevScreen) {\n    dir = normalize(nextScreen - currScreen);\n  }\n  // ending point uses (current - previous)\n  else if (currScreen == nextScreen) {\n    dir = normalize(currScreen - prevScreen);\n  }\n  // somewhere in middle, needs a join\n  else {\n    // get directions from (C - B) and (B - A)\n    vec2 dirA = normalize((currScreen - prevScreen));\n    if (miter == 1) {\n      vec2 dirB = normalize((nextScreen - currScreen));\n      // now compute the miter join normal and length\n      vec2 tangent = normalize(dirA + dirB);\n      vec2 perp = vec2(-dirA.y, dirA.x);\n      vec2 miter = vec2(-tangent.y, tangent.x);\n      dir = tangent;\n    } else {\n      dir = dirA;\n    }\n  }\n\n  vec2 normal = vec2(-dir.y, dir.x) * width;\n  normal.x /= aspectRatio;\n  vec4 offset = vec4(normal * offsetScale, 0.0, 0.0);\n  gl_Position = currProjected + offset;\n\n  // Get color from texture\n  float colorRowIndex = floor((colorIndex + colorTexEps) / colorTexRes);\n  vec2 colorTexIndex = vec2(\n    (colorIndex / colorTexRes) - colorRowIndex + colorTexEps,\n    colorRowIndex / colorTexRes + colorTexEps\n  );\n\n  color = texture2D(colorTex, colorTexIndex);\n  color.a = useColorOpacity * color.a + useOpacity * opacity;\n}", { push: V, splice: H } = Array.prototype, te = new Float32Array([
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1
]), U = Float32Array.BYTES_PER_ELEMENT, W = (e, t = []) => {
	let n = 0;
	return e.forEach((e) => {
		for (let r = 0; r < e - 1; r++) {
			let e = n + r * 2, i = e + 1, a = e + 2, o = e + 3;
			t.push(e, i, a, a, i, o);
		}
		n += (e + 2) * 2;
	}), t;
}, G = {
	duplicate(e, t = 1, n = 1) {
		let r = [], i = Array(t * 2);
		for (let a = 0, o = e.length / t; a < o; a++) {
			let o = a * t;
			for (let r = 0; r < t; r++) {
				let a = e[o + r];
				i[r] = a, i[r + t] = a * n;
			}
			V.apply(r, i);
		}
		return r;
	},
	mapElement(e, t, n, r) {
		for (let i = 0, a = e.length / n; i < a; i++) {
			let a = t + i * n;
			e[a] = r(e[a], a, i);
		}
		return e;
	},
	copyElement(e, t, n, r) {
		let i = Array(r), a = t * r;
		for (let t = 0; t < r; t++) i[t] = e[a + t];
		return H.call(e, n * r, 0, ...i), e;
	},
	increaseStride(e, t, n, r = 0) {
		let i = [], a = Array(n).fill(r);
		for (let n = 0, r = e.length / t; n < r; n++) {
			let r = n * t;
			for (let n = 0; n < t; n++) a[n] = e[r + n];
			V.apply(i, a);
		}
		return i;
	}
}, ne = (e, { projection: t = te, model: n = te, view: r = te, points: i = [], colorIndices: a = [], color: o = [
	.8,
	.5,
	0,
	1
], opacity: s = null, opacities: c = [], width: l = 1, widths: u = [], miter: d = 1, is2d: f = !1, zPos2d: p = 0 } = {}) => {
	if (!e) {
		console.error("Regl instance is undefined.");
		return;
	}
	let m = /* @__PURE__ */ new Float32Array(16), h, g, _, v, y, b, x, S, C, w, T, D, O, k, A, j, M, N, P = f ? 2 : 3, F = () => +(c.length === g || s !== null), I = () => {
		w = e.buffer(), T = e.buffer(), D = e.buffer(), A = e.buffer(), j = {
			prevPosition: {
				buffer: () => w,
				offset: 0,
				stride: U * 3
			},
			currPosition: {
				buffer: () => w,
				offset: U * 3 * 2,
				stride: U * 3
			},
			nextPosition: {
				buffer: () => w,
				offset: U * 3 * 4,
				stride: U * 3
			},
			opacity: {
				buffer: () => T,
				offset: U * 2,
				stride: U
			},
			offsetScale: {
				buffer: () => D,
				offset: U * 2,
				stride: U
			},
			colorIndex: {
				buffer: () => A,
				offset: U * 2,
				stride: U
			}
		}, M = e.elements(), N = e({
			attributes: j,
			depth: { enable: !f },
			blend: {
				enable: !0,
				func: {
					srcRGB: "src alpha",
					srcAlpha: "one",
					dstRGB: "one minus src alpha",
					dstAlpha: "one minus src alpha"
				}
			},
			uniforms: {
				projectionViewModel: (e, t) => {
					let n = e.projection || t.projection, r = e.model || t.model, i = e.view || t.view;
					return E(m, n, E(m, i, r));
				},
				aspectRatio: ({ viewportWidth: e, viewportHeight: t }) => e / t,
				colorTex: () => O,
				colorTexRes: () => k,
				colorTexEps: () => .5 / k,
				pixelRatio: ({ pixelRatio: e }) => e,
				width: ({ pixelRatio: e, viewportHeight: t }) => l / t * e,
				useOpacity: F,
				useColorOpacity: () => +!F(),
				miter: d
			},
			elements: () => M,
			vert: B,
			frag: z
		});
	}, L = () => {
		h === 1 && i.length % P > 0 && console.warn(`The length of points (${g}) does not match the dimensions (${P}). Incomplete points are ignored.`), v = i.flat().slice(0, g * P), f && (v = G.increaseStride(v, 2, 3, p)), a.length !== g && (a = Array(g).fill(0)), u.length !== g && (u = Array(g).fill(1));
		let e = a.slice(), t = c.length === g ? c.slice() : Array(g).fill(+s), n = u.slice(), r = 0;
		_.forEach((i) => {
			let a = r + i - 1;
			G.copyElement(v, a, a, 3), G.copyElement(v, r, r, 3), G.copyElement(e, a, a, 1), G.copyElement(e, r, r, 1), G.copyElement(t, a, a, 1), G.copyElement(t, r, r, 1), G.copyElement(n, a, a, 1), G.copyElement(n, r, r, 1), r += i + 2;
		}), y = new Float32Array(G.duplicate(v, 3)), b = G.duplicate(e), x = G.duplicate(t), S = G.duplicate(n, 1, -1), C = W(_), w({
			usage: "dynamic",
			type: "float",
			length: y.length * U,
			data: y
		}), T({
			usage: "dynamic",
			type: "float",
			length: x.length * U,
			data: x
		}), D({
			usage: "dynamic",
			type: "float",
			length: S.length * U,
			data: S
		}), A({
			usage: "dynamic",
			type: "float",
			length: b.length * U,
			data: b
		}), M({
			primitive: "triangles",
			usage: "dynamic",
			type: C.length > 2 ** 16 ? "uint32" : "uint16",
			data: C
		});
	}, R = () => {
		ee(), I();
	}, ee = () => {
		i = null, v = null, y = null, S = null, C = null, w.destroy(), D.destroy(), M.destroy();
	}, V = ({ projection: e, model: a, view: o } = {}) => {
		e && (t = e), a && (n = a), o && (r = o), i && i.length > 1 && N({
			projection: t,
			model: n,
			view: r
		});
	}, H = (e, t) => {
		let n = t.flat(2);
		return n.length === g ? n : n.length === h ? _.map((e, t) => Array(e).fill(n[t])).flat() : e;
	}, ne = () => i, K = (e = [], { colorIndices: t = a, opacities: n = c, widths: r = u, is2d: o = f } = {}) => {
		i = e, f = o, P = f ? 2 : 3, h = Array.isArray(i[0]) ? i.length : 1, _ = h > 1 ? i.map((e) => Math.floor(e.length / P)) : [Math.floor(i.length / P)], g = _.reduce((e, t) => e + t, 0), a = H(a, t), c = H(c, n), u = H(u, r), i && g > 1 ? L() : R();
	}, re = (e, t = -1) => Array.isArray(e) ? e.length && !Array.isArray(e[0]) ? t + 1 : re(e[0], ++t) : t, ie = () => {
		let t = re(o) === 0 ? [o] : o;
		k = Math.max(2, Math.ceil(Math.sqrt(t.length)));
		let n = new Uint8Array(k ** 2 * 4);
		t.forEach((e, t) => {
			n[t * 4] = Math.min(255, Math.max(0, Math.round(e[0] * 255))), n[t * 4 + 1] = Math.min(255, Math.max(0, Math.round(e[1] * 255))), n[t * 4 + 2] = Math.min(255, Math.max(0, Math.round(e[2] * 255))), n[t * 4 + 3] = Number.isNaN(+e[3]) ? 255 : Math.min(255, Math.max(0, Math.round(e[3] * 255)));
		}), O = e.texture({
			data: n,
			shape: [
				k,
				k,
				4
			]
		});
	}, q = (e, t = s) => {
		o = e, s = t, O && O.destroy(), ie();
	};
	return I(), ie(), i && i.length > 1 && K(i), {
		clear: R,
		destroy: ee,
		draw: V,
		getPoints: ne,
		setPoints: K,
		getData: () => ({
			points: y,
			widths: S,
			opacities: x,
			colorIndices: b
		}),
		getBuffer: () => ({
			points: w,
			widths: D,
			opacities: T,
			colorIndices: A
		}),
		getStyle: () => ({
			color: o,
			miter: d,
			width: l
		}),
		setStyle: ({ color: e, opacity: t, miter: n, width: r } = {}) => {
			e && q(e, t), n && (d = n), +r > 0 && (l = r);
		}
	};
}, K = (e) => e * e * e, re = (e) => e < .5 ? 4 * e * e * e : (e - 1) * (2 * e - 2) * (2 * e - 2) + 1, ie = (e) => --e * e * e + 1, q = (e) => e, ae = (e) => e * e, oe = (e) => e < .5 ? 2 * e * e : -1 + (4 - 2 * e) * e, se = (e) => e * (2 - e), ce = (e) => e, J = (e, t) => {
	if (e === t) return !0;
	if (e.length !== t.length) return !1;
	let n = new Set(e), r = new Set(t);
	return n.size === r.size && t.every((e) => n.has(e));
}, le = (e) => e.reduce((e, t) => t > e ? t : e, -Infinity), ue = (e, t = (e) => e) => {
	let n = [];
	for (let r = 0; r < e; r++) n.push(t(r, e));
	return n;
}, de = (e, t) => {
	let n = [];
	return e.forEach((e) => {
		n[e] = !0;
	}), t.forEach((e) => {
		n[e] = !0;
	}), n.reduce((e, t, n) => (t && e.push(n), e), []);
}, fe = (e, ...t) => (t.forEach((t) => {
	let n = Object.keys(t).reduce((e, n) => (e[n] = Object.getOwnPropertyDescriptor(t, n), e), {});
	Object.getOwnPropertySymbols(t).forEach((e) => {
		let r = Object.getOwnPropertyDescriptor(t, e);
		r.enumerable && (n[e] = r);
	}), Object.defineProperties(e, n);
}), e), pe = (...e) => (t) => e.reduce((e, t) => t(e), t), me = (e) => (t) => fe({ __proto__: { constructor: e } }, t), he = (e, t) => (n) => fe(n, { get [e]() {
	return t;
} }), ge = (e, t, n, r) => Math.sqrt((e - n) ** 2 + (t - r) ** 2), _e = (e) => new Worker(window.URL.createObjectURL(new Blob([`(${e.toString()})()`], { type: "text/javascript" }))), ve = (e = 1) => new Promise((t) => {
	let n = 0, r = () => requestAnimationFrame(() => {
		n++, n < e ? r() : t();
	});
	r();
}), ye = (e, t, n = null) => {
	let r, i = 0;
	n = n === null ? t : n;
	let a = (...t) => {
		clearTimeout(r), r = setTimeout(() => {
			i > 0 && (e(...t), i = 0);
		}, n);
	}, o = !1, s = (...n) => {
		o ? (i++, a(...n)) : (e(...n), a(...n), o = !0, i = 0, setTimeout(() => {
			o = !1;
		}, t));
	};
	return s.reset = () => {
		o = !1;
	}, s.cancel = () => {
		clearTimeout(r);
	}, s.now = (...t) => e(...t), s;
}, be = () => {
	let e = [
		Int8Array,
		Uint8Array,
		Uint8ClampedArray,
		Int16Array,
		Uint16Array,
		Int32Array,
		Uint32Array,
		Float32Array,
		Float64Array
	];
	class t {
		static from(n) {
			if (!(n instanceof ArrayBuffer)) throw Error("Data must be an instance of ArrayBuffer.");
			let [r, i] = new Uint8Array(n, 0, 2);
			if (r !== 219) throw Error("Data does not appear to be in a KDBush format.");
			let a = i >> 4;
			if (a !== 1) throw Error(`Got v${a} data when expected v1.`);
			let o = e[i & 15];
			if (!o) throw Error("Unrecognized array type.");
			let [s] = new Uint16Array(n, 2, 1), [c] = new Uint32Array(n, 4, 1);
			return new t(c, s, o, n);
		}
		constructor(t, n = 64, r = Float64Array, i) {
			if (isNaN(t) || t < 0) throw Error(`Unexpected numItems value: ${t}.`);
			this.numItems = +t, this.nodeSize = Math.min(Math.max(+n, 2), 65535), this.ArrayType = r, this.IndexArrayType = t < 65536 ? Uint16Array : Uint32Array;
			let a = e.indexOf(this.ArrayType), o = t * 2 * this.ArrayType.BYTES_PER_ELEMENT, s = t * this.IndexArrayType.BYTES_PER_ELEMENT, c = (8 - s % 8) % 8;
			if (a < 0) throw Error(`Unexpected typed array class: ${r}.`);
			i && i instanceof ArrayBuffer ? (this.data = i, this.ids = new this.IndexArrayType(this.data, 8, t), this.coords = new this.ArrayType(this.data, 8 + s + c, t * 2), this._pos = t * 2, this._finished = !0) : (this.data = new ArrayBuffer(8 + o + s + c), this.ids = new this.IndexArrayType(this.data, 8, t), this.coords = new this.ArrayType(this.data, 8 + s + c, t * 2), this._pos = 0, this._finished = !1, new Uint8Array(this.data, 0, 2).set([219, 16 + a]), new Uint16Array(this.data, 2, 1)[0] = n, new Uint32Array(this.data, 4, 1)[0] = t);
		}
		add(e, t) {
			let n = this._pos >> 1;
			return this.ids[n] = n, this.coords[this._pos++] = e, this.coords[this._pos++] = t, n;
		}
		finish() {
			let e = this._pos >> 1;
			if (e !== this.numItems) throw Error(`Added ${e} items when expected ${this.numItems}.`);
			return n(this.ids, this.coords, this.nodeSize, 0, this.numItems - 1, 0), this._finished = !0, this;
		}
		range(e, t, n, r) {
			if (!this._finished) throw Error("Data not yet indexed - call index.finish().");
			let { ids: i, coords: a, nodeSize: o } = this, s = [
				0,
				i.length - 1,
				0
			], c = [];
			for (; s.length;) {
				let l = s.pop() || 0, u = s.pop() || 0, d = s.pop() || 0;
				if (u - d <= o) {
					for (let o = d; o <= u; o++) {
						let s = a[2 * o], l = a[2 * o + 1];
						s >= e && s <= n && l >= t && l <= r && c.push(i[o]);
					}
					continue;
				}
				let f = d + u >> 1, p = a[2 * f], m = a[2 * f + 1];
				p >= e && p <= n && m >= t && m <= r && c.push(i[f]), (l === 0 ? e <= p : t <= m) && (s.push(d), s.push(f - 1), s.push(1 - l)), (l === 0 ? n >= p : r >= m) && (s.push(f + 1), s.push(u), s.push(1 - l));
			}
			return c;
		}
		within(e, t, n) {
			if (!this._finished) throw Error("Data not yet indexed - call index.finish().");
			let { ids: r, coords: i, nodeSize: a } = this, s = [
				0,
				r.length - 1,
				0
			], c = [], l = n * n;
			for (; s.length;) {
				let u = s.pop() || 0, d = s.pop() || 0, f = s.pop() || 0;
				if (d - f <= a) {
					for (let n = f; n <= d; n++) o(i[2 * n], i[2 * n + 1], e, t) <= l && c.push(r[n]);
					continue;
				}
				let p = f + d >> 1, m = i[2 * p], h = i[2 * p + 1];
				o(m, h, e, t) <= l && c.push(r[p]), (u === 0 ? e - n <= m : t - n <= h) && (s.push(f), s.push(p - 1), s.push(1 - u)), (u === 0 ? e + n >= m : t + n >= h) && (s.push(p + 1), s.push(d), s.push(1 - u));
			}
			return c;
		}
	}
	function n(e, t, i, a, o, s) {
		if (o - a <= i) return;
		let c = a + o >> 1;
		r(e, t, c, a, o, s), n(e, t, i, a, c - 1, 1 - s), n(e, t, i, c + 1, o, 1 - s);
	}
	function r(e, t, n, a, o, s) {
		for (; o > a;) {
			if (o - a > 600) {
				let i = o - a + 1, c = n - a + 1, l = Math.log(i), u = .5 * Math.exp(2 * l / 3), d = .5 * Math.sqrt(l * u * (i - u) / i) * (c - i / 2 < 0 ? -1 : 1);
				r(e, t, n, Math.max(a, Math.floor(n - c * u / i + d)), Math.min(o, Math.floor(n + (i - c) * u / i + d)), s);
			}
			let c = t[2 * n + s], l = a, u = o;
			for (i(e, t, a, n), t[2 * o + s] > c && i(e, t, a, o); l < u;) {
				for (i(e, t, l, u), l++, u--; t[2 * l + s] < c;) l++;
				for (; t[2 * u + s] > c;) u--;
			}
			t[2 * a + s] === c ? i(e, t, a, u) : (u++, i(e, t, u, o)), u <= n && (a = u + 1), n <= u && (o = u - 1);
		}
	}
	function i(e, t, n, r) {
		a(e, n, r), a(t, 2 * n, 2 * r), a(t, 2 * n + 1, 2 * r + 1);
	}
	function a(e, t, n) {
		let r = e[t];
		e[t] = e[n], e[n] = r;
	}
	function o(e, t, n, r) {
		let i = e - n, a = t - r;
		return i * i + a * a;
	}
	return t;
}, xe = () => {
	addEventListener("message", (e) => {
		let t = e.data.points;
		t.length || self.postMessage({ error: /* @__PURE__ */ Error("Invalid point data") });
		let n = new KDBush(t.length, e.data.nodeSize);
		for (let e = 0; e < t.length; ++e) n.add(t[e][0], t[e][1]);
		n.finish(), postMessage(n.data, [n.data]);
	});
}, Se = be(), Ce = 1e6, we = (e) => {
	let t = be.toString();
	t = t.substring(10, t.length - 18);
	let n = e.toString();
	return n = n.substring(10, n.length - 2), new Worker(window.URL.createObjectURL(new Blob([`${t};${n}`], { type: "text/javascript" })));
}, Te = (e, t = {
	nodeSize: 16,
	useWorker: void 0
}) => new Promise((n, r) => {
	if (e instanceof ArrayBuffer) n(Se.from(e));
	else if ((e.length < Ce || t.useWorker === !1) && t.useWorker !== !0) {
		let r = new Se(e.length, t.nodeSize);
		for (let t = 0; t < e.length; ++t) r.add(e[t][0], e[t][1]);
		r.finish(), n(r);
	} else {
		let i = we(xe);
		i.onmessage = (e) => {
			e.data.error ? r(e.data.error) : n(Se.from(e.data)), i.terminate();
		}, i.postMessage({
			points: e,
			nodeSize: t.nodeSize
		});
	}
}), Ee = "auto", De = 0, Oe = 1, ke = 2, Ae = 3, je = 4, Me = Float32Array.BYTES_PER_ELEMENT, Ne = [
	"OES_texture_float",
	"OES_element_index_uint",
	"WEBGL_color_buffer_float",
	"EXT_float_blend"
], Pe = {
	color: [
		0,
		0,
		0,
		0
	],
	depth: 1
}, Fe = "panZoom", Ie = "lasso", Le = "rotate", Re = [
	Fe,
	Ie,
	Le
], ze = Fe, Be = {
	cubicIn: K,
	cubicInOut: re,
	cubicOut: ie,
	linear: q,
	quadIn: ae,
	quadInOut: oe,
	quadOut: se
}, Ve = re, He = "continuous", Y = "categorical", Ue = [He, Y], We = "deselect", Ge = "lassoEnd", Ke = [We, Ge], qe = [
	0,
	.666666667,
	1,
	1
], Je = 2, Ye = !1, Xe = 10, Ze = 3, Qe = Ge, $e = !1, et = 750, tt = 500, nt = 100, rt = 250, it = "lasso", at = "rotate", ot = "merge", st = [
	it,
	at,
	ot
], ct = "alt", lt = "cmd", ut = "ctrl", dt = "meta", ft = "shift", pt = [
	ct,
	lt,
	ut,
	dt,
	ft
], mt = {
	[ct]: at,
	[ft]: it,
	[lt]: ot
}, ht = 1, gt = Ee, _t = Ee, vt = 1, yt = 1, bt = 6, xt = 2, St = 2, Ct = null, wt = 2, Tt = 2, Et = null, Dt = null, Ot = null, kt = .66, X = 1, At = null, jt = .15, Mt = 25, Nt = 1, Pt = 1, Ft = null, It = [
	.66,
	.66,
	.66,
	X
], Lt = [
	0,
	.55,
	1,
	1
], Rt = [
	1,
	1,
	1,
	1
], zt = [
	0,
	0,
	0,
	1
], Bt = null, Vt = [
	.66,
	.66,
	.66,
	.2
], Ht = [
	0,
	.55,
	1,
	1
], Ut = [
	1,
	1,
	1,
	1
], Wt = [0, 0], Gt = 1, Kt = 0, qt = new Float32Array([
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	0,
	1
]), Jt = "IMAGE_LOAD_ERROR", Yt = null, Xt = !1, Zt = [
	1,
	1,
	1,
	.5
], Qt = !0, $t = !0, en = !1, tn = 100, nn = 1 / 500, rn = "auto", an = !1, on = 200, sn = 500, cn = /* @__PURE__ */ new Set([
	"z",
	"valueZ",
	"valueA",
	"value1",
	"category"
]), ln = /* @__PURE__ */ new Set([
	"w",
	"valueW",
	"valueB",
	"value2",
	"value"
]), un = 15e3, dn = void 0, fn = "Points have not been drawn", pn = (e, t) => e ? Ne.reduce((n, r) => e.hasExtension(r) ? n : (t || console.warn(`WebGL: ${r} extension not supported. Scatterplot might not render properly`), !1), !0) : !1, mn = (e) => {
	let t = e.getContext("webgl", {
		antialias: !0,
		preserveDrawingBuffer: !0
	}), n = [];
	return Ne.forEach((e) => {
		t.getExtension(e) ? n.push(e) : console.warn(`WebGL: ${e} extension not supported. Scatterplot might not render properly`);
	}), (0, b.default)({
		gl: t,
		extensions: n
	});
}, hn = (e, t, n, r) => Math.sqrt((e - n) ** 2 + (t - r) ** 2), gn = (e) => {
	let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
	for (let a = 0; a < e.length; a += 2) t = e[a] < t ? e[a] : t, n = e[a] > n ? e[a] : n, r = e[a + 1] < r ? e[a + 1] : r, i = e[a + 1] > i ? e[a + 1] : i;
	return [
		t,
		r,
		n,
		i
	];
}, _n = ([e, t, n, r]) => Number.isFinite(e) && Number.isFinite(t) && Number.isFinite(n) && Number.isFinite(r) && n - e > 0 && r - t > 0, Z = (e, t = !1) => e.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (e, t, n, r) => `#${t}${t}${n}${n}${r}${r}`).substring(1).match(/.{2}/g).map((e) => parseInt(e, 16) / 255 ** t), vn = (e, t, { minLength: n = 0 } = {}) => Array.isArray(e) && e.length >= n && e.every(t), yn = (e) => !Number.isNaN(+e) && +e >= 0, bn = (e) => !Number.isNaN(+e) && +e > 0, xn = (e, t) => (n) => e.indexOf(n) >= 0 ? n : t, Sn = (e, t = !1, n = un) => new Promise((r, i) => {
	let a = new Image();
	t && (a.crossOrigin = "anonymous"), a.src = e, a.onload = () => {
		r(a);
	};
	let o = () => {
		i(/* @__PURE__ */ Error(Jt));
	};
	a.onerror = o, setTimeout(o, n);
}), Cn = (e, t, n = un) => new Promise((r, i) => {
	Sn(t, t.indexOf(window.location.origin) !== 0 && t.indexOf("base64") === -1, n).then((t) => {
		r(e.texture(t));
	}).catch((e) => {
		i(e);
	});
}), wn = (e, t = !1) => [...Z(e, t), 255 ** !t], Tn = (e) => /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(e), En = (e) => e >= 0 && e <= 1, Dn = (e) => Array.isArray(e) && e.every(En), On = (e, [t, n] = []) => {
	let r, i, a, o, s = !1;
	for (let c = 0, l = e.length - 2; c < e.length; c += 2) r = e[c], i = e[c + 1], a = e[l], o = e[l + 1], i > n != o > n && t < (a - r) * (n - i) / (o - i) + r && (s = !s), l = c;
	return s;
}, kn = (e) => typeof e == "string" || e instanceof String, An = (e) => Number.isInteger(e) && e >= 0 && e <= 255, jn = (e) => Array.isArray(e) && e.every(An), Mn = (e) => e.length === 3 && (Dn(e) || jn(e)), Nn = (e) => e.length === 4 && (Dn(e) || jn(e)), Pn = (e) => Array.isArray(e) && e.length && (Array.isArray(e[0]) || kn(e[0])), Fn = (e, t) => e > t ? e : t, In = (e, t) => e < t ? e : t, Ln = (e, t) => {
	if (Nn(e)) {
		let n = Dn(e);
		return t && n || !t && !n ? e : t && !n ? e.map((e) => e / 255) : e.map((e) => e * 255);
	}
	if (Mn(e)) {
		let n = 255 ** !t, r = Dn(e);
		return t && r || !t && !r ? [...e, n] : t && !r ? [...e.map((e) => e / 255), n] : [...e.map((e) => e * 255), n];
	}
	return Tn(e) ? wn(e, t) : (console.warn("Only HEX, RGB, and RGBA are handled by this function. Returning white instead."), t ? [
		1,
		1,
		1,
		1
	] : [
		255,
		255,
		255,
		255
	]);
}, Rn = (e) => Object.entries(e).reduce((e, [t, n]) => (e[n] = e[n] ? [...e[n], t] : t, e), {}), zn = (e) => .21 * e[0] + .72 * e[1] + .07 * e[2], Bn = (e, t, n) => Math.min(n, Math.max(t, e)), Vn = (e) => new Promise((t, n) => {
	if (!e || Array.isArray(e)) t(e);
	else {
		let r = Array.isArray(e.x) || ArrayBuffer.isView(e.x) ? e.x.length : 0, i = (Array.isArray(e.x) || ArrayBuffer.isView(e.x)) && ((t) => e.x[t]), a = (Array.isArray(e.y) || ArrayBuffer.isView(e.y)) && ((t) => e.y[t]), o = (Array.isArray(e.line) || ArrayBuffer.isView(e.line)) && ((t) => e.line[t]), s = (Array.isArray(e.lineOrder) || ArrayBuffer.isView(e.lineOrder)) && ((t) => e.lineOrder[t]), c = Object.keys(e), l = (() => {
			let t = c.find((e) => cn.has(e));
			return t && (Array.isArray(e[t]) || ArrayBuffer.isView(e[t])) && ((n) => e[t][n]);
		})(), u = (() => {
			let t = c.find((e) => ln.has(e));
			return t && (Array.isArray(e[t]) || ArrayBuffer.isView(e[t])) && ((n) => e[t][n]);
		})();
		i && a && l && u && o && s ? t(e.x.map((e, t) => [
			e,
			a(t),
			l(t),
			u(t),
			o(t),
			s(t)
		])) : i && a && l && u && o ? t(Array.from({ length: r }, (e, t) => [
			i(t),
			a(t),
			l(t),
			u(t),
			o(t)
		])) : i && a && l && u ? t(Array.from({ length: r }, (e, t) => [
			i(t),
			a(t),
			l(t),
			u(t)
		])) : i && a && l ? t(Array.from({ length: r }, (e, t) => [
			i(t),
			a(t),
			l(t)
		])) : i && a ? t(Array.from({ length: r }, (e, t) => [i(t), a(t)])) : n(/* @__PURE__ */ Error("You need to specify at least x and y"));
	}
}), Hn = (e = {}) => {
	let { regl: t, canvas: n = document.createElement("canvas"), gamma: r = vt } = e, i = !1;
	t ||= mn(n);
	let a = pn(t), o = [n.width, n.height], s = t.framebuffer({
		width: o[0],
		height: o[1],
		colorFormat: "rgba",
		colorType: "float"
	}), c = t({
		vert: "\n      precision highp float;\n      attribute vec2 xy;\n      void main () {\n        gl_Position = vec4(xy, 0, 1);\n      }",
		frag: "\n      precision highp float;\n      uniform vec2 srcRes;\n      uniform sampler2D src;\n      uniform float gamma;\n\n      vec3 approxLinearToSRGB (vec3 rgb, float gamma) {\n        return pow(clamp(rgb, vec3(0), vec3(1)), vec3(1.0 / gamma));\n      }\n\n      void main () {\n        vec4 color = texture2D(src, gl_FragCoord.xy / srcRes);\n        gl_FragColor = vec4(approxLinearToSRGB(color.rgb, gamma), color.a);\n      }",
		attributes: { xy: [
			-4,
			-4,
			4,
			-4,
			0,
			4
		] },
		uniforms: {
			src: () => s,
			srcRes: () => o,
			gamma: () => r
		},
		count: 3,
		depth: { enable: !1 },
		blend: {
			enable: !0,
			func: {
				srcRGB: "one",
				srcAlpha: "one",
				dstRGB: "one minus src alpha",
				dstAlpha: "one minus src alpha"
			}
		}
	}), l = (e) => {
		let t = e.getContext("2d");
		t.clearRect(0, 0, e.width, e.height), t.drawImage(n, (n.width - e.width) / 2, (n.height - e.height) / 2, e.width, e.height, 0, 0, e.width, e.height);
	}, u = (e, n) => {
		t.clear(Pe), s.use(() => {
			t.clear(Pe), e();
		}), c(), l(n);
	}, d = () => {
		t.poll();
	}, f = /* @__PURE__ */ new Set(), p = (e) => (f.add(e), () => {
		f.delete(e);
	}), m = t.frame(() => {
		let e = f.values(), t = e.next();
		for (; !t.done;) t.value(), t = e.next();
	}), h = () => {
		n.width = window.innerWidth * window.devicePixelRatio, n.height = window.innerHeight * window.devicePixelRatio, o[0] = n.width, o[1] = n.height, s.resize(...o);
	};
	return e.canvas || (window.addEventListener("resize", h), window.addEventListener("orientationchange", h), h()), {
		get canvas() {
			return n;
		},
		get regl() {
			return t;
		},
		get gamma() {
			return r;
		},
		set gamma(e) {
			r = +e;
		},
		get isSupported() {
			return a;
		},
		get isDestroyed() {
			return i;
		},
		render: u,
		onFrame: p,
		refresh: d,
		destroy: () => {
			i = !0, window.removeEventListener("resize", h), window.removeEventListener("orientationchange", h), m.cancel(), n = void 0, t.destroy(), t = void 0;
		}
	};
}, Un = !0, Wn = 8, Gn = 2, Kn = 2500, qn = 250, Jn = () => {
	let e = document.createElement("div");
	e.id = `lasso-long-press-${Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5)}`, e.style.position = "fixed", e.style.width = "1.25rem", e.style.height = "1.25rem", e.style.pointerEvents = "none", e.style.transform = "translate(-50%,-50%)";
	let t = document.createElement("div");
	t.style.position = "absolute", t.style.top = 0, t.style.left = 0, t.style.width = "1.25rem", t.style.height = "1.25rem", t.style.clipPath = "inset(0px 0px 0px 50%)", t.style.opacity = 0, e.appendChild(t);
	let n = document.createElement("div");
	n.style.position = "absolute", n.style.top = 0, n.style.left = 0, n.style.width = "0.8rem", n.style.height = "0.8rem", n.style.border = "0.2rem solid currentcolor", n.style.borderRadius = "0.8rem", n.style.clipPath = "inset(0px 50% 0px 0px)", n.style.transform = "rotate(0deg)", t.appendChild(n);
	let r = document.createElement("div");
	r.style.position = "absolute", r.style.top = 0, r.style.left = 0, r.style.width = "0.8rem", r.style.height = "0.8rem", r.style.border = "0.2rem solid currentcolor", r.style.borderRadius = "0.8rem", r.style.clipPath = "inset(0px 50% 0px 0px)", r.style.transform = "rotate(0deg)", t.appendChild(r);
	let i = document.createElement("div");
	return i.style.position = "absolute", i.style.top = 0, i.style.left = 0, i.style.width = "1.25rem", i.style.height = "1.25rem", i.style.borderRadius = "1.25rem", i.style.background = "currentcolor", i.style.transform = "scale(0)", i.style.opacity = 0, e.appendChild(i), {
		longPress: e,
		longPressCircle: t,
		longPressCircleLeft: n,
		longPressCircleRight: r,
		longPressEffect: i
	};
}, Yn = (e, t, n) => (1 - e) * t + n, Xn = (e, t) => `${e}ms ease-out mainIn ${t}ms 1 normal forwards`, Zn = (e, t) => `${e}ms ease-out effectIn ${t}ms 1 normal forwards`, Qn = (e, t) => `${e}ms linear leftSpinIn ${t}ms 1 normal forwards`, $n = (e, t) => `${e}ms linear rightSpinIn ${t}ms 1 normal forwards`, er = (e, t) => `${e}ms linear circleIn ${t}ms 1 normal forwards`, tr = (e, t, n) => `
  @keyframes mainIn {
    0% {
      color: ${t};
      opacity: 0;
    }
    0%, ${e}% {
      color: ${t};
      opacity: 1;
    }
    100% {
      color: ${n};
      opacity: 0.8;
    }
  }
`, nr = (e, t, n, r) => `
  @keyframes effectIn {
    0%, ${e}% {
      opacity: ${n};
      transform: scale(${r});
    }
    ${t}% {
      opacity: 0.66;
      transform: scale(1.5);
    }
    99% {
      opacity: 0;
      transform: scale(2);
    }
    100% {
      opacity: 0;
      transform: scale(0);
    }
  }
`, rr = (e, t, n) => `
  @keyframes circleIn {
    0% {
      clip-path: ${t};
      opacity: ${n};
    }
    ${e}% {
      clip-path: ${t};
      opacity: 1;
    }
    ${e + .01}%, 100% {
      clip-path: inset(0);
      opacity: 1;
    }
  }
`, ir = (e, t) => `
  @keyframes leftSpinIn {
    0% {
      transform: rotate(${t}deg);
    }
    ${e}%, 100% {
      transform: rotate(360deg);
    }
  }
`, ar = (e, t) => `
  @keyframes rightSpinIn {
    0% {
      transform: rotate(${t}deg);
    }
    ${e}%, 100% {
      transform: rotate(180deg);
    }
  }
`, Q = ({ time: e = et, extraTime: t = tt, delay: n = nt, currentColor: r, targetColor: i, effectOpacity: a, effectScale: o, circleLeftRotation: s, circleRightRotation: c, circleClipPath: l, circleOpacity: u }) => {
	let d = s / 360, f = Yn(d, e, t), p = Math.round((1 - d) * e / f * 100), m = Math.round(p / 2), h = p + (100 - p) / 4;
	return {
		rules: {
			main: tr(p, r, i),
			effect: nr(p, h, a, o),
			circleRight: ar(m, c),
			circleLeft: ir(p, s),
			circle: rr(m, l, u)
		},
		names: {
			main: Xn(f, n),
			effect: Zn(f, n),
			circleLeft: Qn(f, n),
			circleRight: $n(f, n),
			circle: er(f, n)
		}
	};
}, or = (e) => `${e}ms linear mainOut 0s 1 normal forwards`, sr = (e) => `${e}ms linear effectOut 0s 1 normal forwards`, cr = (e) => `${e}ms linear leftSpinOut 0s 1 normal forwards`, lr = (e) => `${e}ms linear rightSpinOut 0s 1 normal forwards`, ur = (e) => `${e}ms linear circleOut 0s 1 normal forwards`, dr = (e, t) => `
  @keyframes mainOut {
    0% {
      color: ${e};
    }
    100% {
      color: ${t};
    }
  }
`, fr = (e, t) => `
  @keyframes effectOut {
    0% {
      opacity: ${e};
      transform: scale(${t});
    }
    99% {
      opacity: 0;
      transform: scale(${t + .5});
    }
    100% {
      opacity: 0;
      transform: scale(0);
    }
  }
`, pr = (e, t) => `
  @keyframes rightSpinOut {
    0%, ${e}% {
      transform: rotate(${t}deg);
    }
    100% {
      transform: rotate(0deg);
    }
`, mr = (e) => `
  @keyframes leftSpinOut {
    0% {
      transform: rotate(${e}deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
`, hr = (e, t, n) => `
  @keyframes circleOut {
    0%, ${e}% {
      clip-path: ${t};
      opacity: ${n};
    }
    ${e + .01}% {
      clip-path: inset(0 0 0 50%);
      opacity: ${n};
    }
    100% {
      clip-path: inset(0 0 0 50%);
      opacity: 0;
    }
  }
`, gr = ({ time: e = rt, currentColor: t, targetColor: n, effectOpacity: r, effectScale: i, circleLeftRotation: a, circleRightRotation: o, circleClipPath: s, circleOpacity: c }) => {
	let l = a / 360, u = l * e, d = Math.min(100, l * 100), f = d > 50 ? Math.round((1 - 50 / d) * 100) : 0;
	return {
		rules: {
			main: dr(t, n),
			effect: fr(r, i),
			circleRight: pr(f, o),
			circleLeft: mr(a),
			circle: hr(f, s, c)
		},
		names: {
			main: or(u),
			effect: sr(u),
			circleRight: cr(u),
			circleLeft: lr(u),
			circle: ur(u)
		}
	};
}, _r = (e, t = null) => e === null ? t : e, vr, yr = () => {
	if (!vr) {
		let e = document.createElement("style");
		document.head.appendChild(e), vr = e.sheet;
	}
	return vr;
}, br = (e) => {
	let t = yr(), n = t.rules.length;
	return t.insertRule(e, n), n;
}, xr = (e) => {
	yr().deleteRule(e);
}, Sr = `${Kn}ms ease scaleInFadeOut 0s 1 normal backwards`, Cr = (e, t, n) => `
@keyframes scaleInFadeOut {
  0% {
    opacity: ${e};
    transform: translate(-50%,-50%) scale(${t}) rotate(${n}deg);
  }
  10% {
    opacity: 1;
    transform: translate(-50%,-50%) scale(1) rotate(${n + 20}deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%,-50%) scale(0.9) rotate(${n + 60}deg);
  }
}
`, wr = null, Tr = `${qn}ms ease fadeScaleOut 0s 1 normal backwards`, Er = (e, t, n) => `
@keyframes fadeScaleOut {
  0% {
    opacity: ${e};
    transform: translate(-50%,-50%) scale(${t}) rotate(${n}deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%,-50%) scale(0) rotate(${n}deg);
  }
}
`, Dr = null, Or = (e, { onDraw: t = ce, onStart: n = ce, onEnd: r = ce, enableInitiator: i = Un, initiatorParentElement: a = document.body, longPressIndicatorParentElement: o = document.body, minDelay: s = Wn, minDist: c = Gn, pointNorm: l = ce } = {}) => {
	let u = i, d = a, f = o, p = t, m = n, h = r, g = l, _ = document.createElement("div");
	_.id = `lasso-initiator-${Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5)}`, _.style.position = "fixed", _.style.display = "flex", _.style.justifyContent = "center", _.style.alignItems = "center", _.style.zIndex = 99, _.style.width = "4rem", _.style.height = "4rem", _.style.borderRadius = "4rem", _.style.opacity = .5, _.style.transform = "translate(-50%,-50%) scale(0) rotate(0deg)";
	let { longPress: v, longPressCircle: y, longPressCircleLeft: b, longPressCircleRight: x, longPressEffect: S } = Jn(), C = !1, w = !1, T = [], E = [], D, O = !1, k = null, A = null, j = null, M = null, N = null, P = null, F = null, I = null, L = null, R = null, ee = () => {
		C = !1;
	}, z = (t) => {
		let { left: n, top: r } = e.getBoundingClientRect();
		return [t.clientX - n, t.clientY - r];
	};
	window.addEventListener("mouseup", ee);
	let B = () => {
		_.style.opacity = .5, _.style.transform = "translate(-50%,-50%) scale(0) rotate(0deg)";
	}, V = (e, t) => {
		let n = getComputedStyle(e), r = +n.opacity, i = n.transform.match(/([0-9.-]+)+/g), a = +i[0], o = +i[1], s = Math.sqrt(a * a + o * o), c = 180 / Math.PI * Math.atan2(o, a);
		return c = t && c <= 0 ? 360 + c : c, {
			opacity: r,
			scale: s,
			rotate: c
		};
	}, H = (e) => {
		if (!u || C) return;
		let t = e.clientX, n = e.clientY;
		_.style.top = `${n}px`, _.style.left = `${t}px`;
		let r = V(_), i = r.opacity, a = r.scale, o = r.rotate;
		_.style.opacity = i, _.style.transform = `translate(-50%,-50%) scale(${a}) rotate(${o}deg)`, _.style.animation = "none", ve().then(() => {
			wr !== null && xr(wr), wr = br(Cr(i, a, o)), _.style.animation = Sr, ve().then(() => {
				B();
			});
		});
	}, te = () => {
		let { opacity: e, scale: t, rotate: n } = V(_);
		_.style.opacity = e, _.style.transform = `translate(-50%,-50%) scale(${t}) rotate(${n}deg)`, _.style.animation = "none", ve(2).then(() => {
			Dr !== null && xr(Dr), Dr = br(Er(e, t, n)), _.style.animation = Tr, ve().then(() => {
				B();
			});
		});
	}, U = (e, t, { time: n = et, extraTime: r = tt, delay: i = nt } = {
		time: et,
		extraTime: tt,
		delay: nt
	}) => {
		O = !0;
		let a = getComputedStyle(v);
		v.style.color = a.color, v.style.top = `${t}px`, v.style.left = `${e}px`, v.style.animation = "none";
		let o = getComputedStyle(y);
		y.style.clipPath = o.clipPath, y.style.opacity = o.opacity, y.style.animation = "none";
		let s = V(S);
		S.style.opacity = s.opacity, S.style.transform = `scale(${s.scale})`, S.style.animation = "none";
		let c = V(b);
		b.style.transform = `rotate(${c.rotate}deg)`, b.style.animation = "none";
		let l = V(x);
		x.style.transform = `rotate(${l.rotate}deg)`, x.style.animation = "none", ve().then(() => {
			if (!O) return;
			N !== null && xr(N), M !== null && xr(M), j !== null && xr(j), A !== null && xr(A), k !== null && xr(k);
			let { rules: e, names: t } = Q({
				time: n,
				extraTime: r,
				delay: i,
				currentColor: a.color || "currentcolor",
				targetColor: v.dataset.activeColor,
				effectOpacity: s.opacity || 0,
				effectScale: s.scale || 0,
				circleLeftRotation: c.rotate || 0,
				circleRightRotation: l.rotate || 0,
				circleClipPath: o.clipPath || "inset(0 0 0 50%)",
				circleOpacity: o.opacity || 0
			});
			k = br(e.main), A = br(e.effect), j = br(e.circleLeft), M = br(e.circleRight), N = br(e.circle), v.style.animation = t.main, S.style.animation = t.effect, b.style.animation = t.circleLeft, x.style.animation = t.circleRight, y.style.animation = t.circle;
		});
	}, W = ({ time: e = rt } = { time: rt }) => {
		if (!O) return;
		O = !1;
		let t = getComputedStyle(v);
		v.style.color = t.color, v.style.animation = "none";
		let n = getComputedStyle(y);
		y.style.clipPath = n.clipPath, y.style.opacity = n.opacity, y.style.animation = "none";
		let r = V(S);
		S.style.opacity = r.opacity, S.style.transform = `scale(${r.scale})`, S.style.animation = "none";
		let i = n.clipPath.slice(-2, -1) === "x", a = V(b, i);
		b.style.transform = `rotate(${a.rotate}deg)`, b.style.animation = "none";
		let o = V(x);
		x.style.transform = `rotate(${o.rotate}deg)`, x.style.animation = "none", ve().then(() => {
			R !== null && xr(R), L !== null && xr(L), I !== null && xr(I), F !== null && xr(F), P !== null && xr(P);
			let { rules: i, names: s } = gr({
				time: e,
				currentColor: t.color || "currentcolor",
				targetColor: v.dataset.color,
				effectOpacity: r.opacity || 0,
				effectScale: r.scale || 0,
				circleLeftRotation: a.rotate || 0,
				circleRightRotation: o.rotate || 0,
				circleClipPath: n.clipPath || "inset(0px)",
				circleOpacity: n.opacity || 1
			});
			P = br(i.main), F = br(i.effect), I = br(i.circleLeft), L = br(i.circleRight), R = br(i.circle), v.style.animation = s.main, S.style.animation = s.effect, b.style.animation = s.circleLeft, x.style.animation = s.circleRight, y.style.animation = s.circle;
		});
	}, G = () => {
		p(T, E);
	}, ne = (e) => {
		if (!D) {
			w || (w = !0, m()), D = e;
			let t = g(e);
			T = [t], E = [t[0], t[1]];
		} else if (ge(e[0], e[1], D[0], D[1]) > Gn) {
			D = e;
			let t = g(e);
			T.push(t), E.push(t[0], t[1]), T.length > 1 && G();
		}
	}, K = ye(ne, Wn, Wn), re = (e, t) => {
		let n = z(e);
		return t ? K(n) : ne(n);
	}, ie = () => {
		T = [], E = [], D = void 0, G();
	}, q = (e) => {
		H(e);
	}, ae = () => {
		C = !0, w = !0, ie(), m();
	}, oe = () => {
		te();
	}, se = ({ merge: e = !1 } = {}) => {
		w = !1;
		let t = [...T], n = [...E];
		return K.cancel(), ie(), t.length && h(t, n, { merge: e }), t;
	}, J = ({ onDraw: e = null, onStart: t = null, onEnd: n = null, enableInitiator: r = null, initiatorParentElement: i = null, longPressIndicatorParentElement: a = null, minDelay: o = null, minDist: s = null, pointNorm: c = null } = {}) => {
		p = _r(e, p), m = _r(t, m), h = _r(n, h), u = _r(r, u), g = _r(c, g), i !== null && i !== d && (d.removeChild(_), i.appendChild(_), d = i), a !== null && a !== f && (f.removeChild(v), a.appendChild(v), f = a), u ? (_.addEventListener("click", q), _.addEventListener("mousedown", ae), _.addEventListener("mouseleave", oe)) : (_.removeEventListener("mousedown", ae), _.removeEventListener("mouseleave", oe));
	}, le = () => {
		d.removeChild(_), f.removeChild(v), window.removeEventListener("mouseup", ee), _.removeEventListener("click", q), _.removeEventListener("mousedown", ae), _.removeEventListener("mouseleave", oe);
	};
	return d.appendChild(_), f.appendChild(v), J({
		onDraw: p,
		onStart: m,
		onEnd: h,
		enableInitiator: u,
		initiatorParentElement: d
	}), pe(he("initiator", _), he("longPressIndicator", v), (e) => fe(e, {
		clear: ie,
		destroy: le,
		end: se,
		extend: re,
		set: J,
		showInitiator: H,
		hideInitiator: te,
		showLongPressIndicator: U,
		hideLongPressIndicator: W
	}), me(Or))({});
}, kr = "\nprecision mediump float;\n\nuniform sampler2D texture;\n\nvarying vec2 uv;\n\nvoid main () {\n  gl_FragColor = texture2D(texture, uv);\n}\n", Ar = "\nprecision mediump float;\n\nuniform mat4 modelViewProjection;\n\nattribute vec2 position;\n\nvarying vec2 uv;\n\nvoid main () {\n  uv = position;\n  gl_Position = modelViewProjection * vec4(-1.0 + 2.0 * uv.x, 1.0 - 2.0 * uv.y, 0, 1);\n}\n", jr = "\nprecision highp float;\n\nvarying vec4 color;\nvarying float finalPointSize;\n\nfloat linearstep(float edge0, float edge1, float x) {\n  return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);\n}\n\nvoid main() {\n  vec2 c = gl_PointCoord * 2.0 - 1.0;\n  float sdf = length(c) * finalPointSize;\n  float alpha = linearstep(finalPointSize + 0.5, finalPointSize - 0.5, sdf);\n\n  gl_FragColor = vec4(color.rgb, alpha * color.a);\n}\n", Mr = "precision highp float;\n\nvarying vec4 color;\n\nvoid main() {\n  gl_FragColor = color;\n}\n", Nr = (e) => `
precision highp float;

uniform sampler2D colorTex;
uniform float colorTexRes;
uniform float colorTexEps;
uniform sampler2D stateTex;
uniform float stateTexRes;
uniform float stateTexEps;
uniform float devicePixelRatio;
uniform sampler2D encodingTex;
uniform float encodingTexRes;
uniform float encodingTexEps;
uniform float pointSizeExtra;
uniform float pointOpacityMax;
uniform float pointOpacityScale;
uniform float numPoints;
uniform float globalState;
uniform float isColoredByZ;
uniform float isColoredByW;
uniform float isOpacityByZ;
uniform float isOpacityByW;
uniform float isOpacityByDensity;
uniform float isSizedByZ;
uniform float isSizedByW;
uniform float colorMultiplicator;
uniform float opacityMultiplicator;
uniform float opacityDensity;
uniform float sizeMultiplicator;
uniform float numColorStates;
uniform float pointScale;
uniform mat4 modelViewProjection;

attribute vec2 stateIndex;

varying vec4 color;
varying float finalPointSize;

void main() {
  vec4 state = texture2D(stateTex, stateIndex);

  gl_Position = modelViewProjection * vec4(state.x, state.y, 0.0, 1.0);

  // Determine color index
  float colorIndexZ =  isColoredByZ * floor(state.z * colorMultiplicator);
  float colorIndexW =  isColoredByW * floor(state.w * colorMultiplicator);

  // Multiply by the number of color states per color
  // I.e., normal, active, hover, background, etc.
  float colorIndex = (colorIndexZ + colorIndexW) * numColorStates;

  // Half a "pixel" or "texel" in texture coordinates
  float colorLinearIndex = colorIndex + globalState;

  // Need to add cEps here to avoid floating point issue that can lead to
  // dramatic changes in which color is loaded as floor(3/2.9999) = 1 but
  // floor(3/3.0001) = 0!
  float colorRowIndex = floor((colorLinearIndex + colorTexEps) / colorTexRes);

  vec2 colorTexIndex = vec2(
    (colorLinearIndex / colorTexRes) - colorRowIndex + colorTexEps,
    colorRowIndex / colorTexRes + colorTexEps
  );

  color = texture2D(colorTex, colorTexIndex);

  // Retrieve point size
  float pointSizeIndexZ = isSizedByZ * floor(state.z * sizeMultiplicator);
  float pointSizeIndexW = isSizedByW * floor(state.w * sizeMultiplicator);
  float pointSizeIndex = pointSizeIndexZ + pointSizeIndexW;

  float pointSizeRowIndex = floor((pointSizeIndex + encodingTexEps) / encodingTexRes);
  vec2 pointSizeTexIndex = vec2(
    (pointSizeIndex / encodingTexRes) - pointSizeRowIndex + encodingTexEps,
    pointSizeRowIndex / encodingTexRes + encodingTexEps
  );
  float pointSize = texture2D(encodingTex, pointSizeTexIndex).x;

  // Retrieve opacity
  ${e === 3 ? "" : `
        if (isOpacityByDensity < 0.5) {
          float opacityIndexZ = isOpacityByZ * floor(state.z * opacityMultiplicator);
          float opacityIndexW = isOpacityByW * floor(state.w * opacityMultiplicator);
          float opacityIndex = opacityIndexZ + opacityIndexW;

          float opacityRowIndex = floor((opacityIndex + encodingTexEps) / encodingTexRes);
          vec2 opacityTexIndex = vec2(
            (opacityIndex / encodingTexRes) - opacityRowIndex + encodingTexEps,
            opacityRowIndex / encodingTexRes + encodingTexEps
          );
          color.a = texture2D(encodingTex, opacityTexIndex)[${1 + e}];
        } else {
          color.a = min(1.0, opacityDensity + globalState);
        }
      `}

  color.a = min(pointOpacityMax, color.a) * pointOpacityScale;
  finalPointSize = (pointSize * pointScale) + pointSizeExtra;
  gl_PointSize = finalPointSize;
}
`, Pr = "precision highp float;\n\nuniform sampler2D startStateTex;\nuniform sampler2D endStateTex;\nuniform float t;\n\nvarying vec2 particleTextureIndex;\n\nvoid main() {\n  // Interpolate x, y, and value\n  vec3 start = texture2D(startStateTex, particleTextureIndex).xyw;\n  vec3 end = texture2D(endStateTex, particleTextureIndex).xyw;\n  vec3 curr = start * (1.0 - t) + end * t;\n\n  // The category cannot be interpolated\n  float endCategory = texture2D(endStateTex, particleTextureIndex).z;\n\n  gl_FragColor = vec4(curr.xy, endCategory, curr.z);\n}", Fr = "precision highp float;\n\nattribute vec2 position;\nvarying vec2 particleTextureIndex;\n\nvoid main() {\n  // map normalized device coords to texture coords\n  particleTextureIndex = 0.5 * (1.0 + position);\n\n  gl_Position = vec4(position, 0, 1);\n}", Ir = function() {
	let e = (e, t, n, r, i) => {
		let a = (r - t) * .5, o = (i - n) * .5;
		return (2 * n - 2 * r + a + o) * e * e * e + (-3 * n + 3 * r - 2 * a - o) * e * e + a * e + n;
	}, t = (t, n, r) => {
		let i = r * t, a = Math.floor(i), o = i - a, s = n[Math.max(0, a - 1)], c = n[a], l = n[Math.min(r, a + 1)], u = n[Math.min(r, a + 2)];
		return [e(o, s[0], c[0], l[0], u[0]), e(o, s[1], c[1], l[1], u[1])];
	}, n = (e, t, n, r) => (e - n) ** 2 + (t - r) ** 2, r = (e, t, n) => {
		let r = t[0], i = t[1], a = n[0] - r, o = n[1] - i;
		if (a !== 0 || o !== 0) {
			let t = ((e[0] - r) * a + (e[1] - i) * o) / (a * a + o * o);
			t > 1 ? (r = n[0], i = n[1]) : t > 0 && (r += a * t, i += o * t);
		}
		return a = e[0] - r, o = e[1] - i, a * a + o * o;
	}, i = (e, t, n, a, o) => {
		let s = a, c;
		for (let i = t + 1; i < n; i++) {
			let a = r(e[i], e[t], e[n]);
			a > s && (c = i, s = a);
		}
		s > a && (c - t > 1 && i(e, t, c, a, o), o.push(e[c]), n - c > 1 && i(e, c, n, a, o));
	}, a = (e, t) => {
		let n = e.length - 1, r = [e[0]];
		return i(e, 0, n, t, r), r.push(e[n]), r;
	}, o = (e, { maxIntPointsPerSegment: r = 100, tolerance: i = .002 } = {}) => {
		let o = e.length, s = o - 1, c = s * r + 1, l = i ** 2, u = [], d;
		for (let i = 0; i < o - 1; i++) {
			let o = [e[i].slice(0, 2)];
			d = e[i];
			for (let a = 1; a < r; a++) {
				let u = (i * r + a) / c, f = t(u, e, s);
				n(d[0], d[1], f[0], f[1]) > l && (o.push(f), d = f);
			}
			o.push(e[i + 1]), o = a(o, l), u = u.concat(o.slice(0, o.length - 1));
		}
		return u.push(e[e.length - 1].slice(0, 2)), u.flat();
	}, s = (e) => {
		let t = {}, n = !Number.isNaN(+e[0][5]);
		return e.forEach((e) => {
			let r = e[4];
			t[r] || (t[r] = []), n ? t[r][e[5]] = e : t[r].push(e);
		}), Object.entries(t).forEach((e) => {
			t[e[0]] = e[1].filter((e) => e), t[e[0]].reference = e[1][0];
		}), t;
	};
	self.onmessage = function(e) {
		e.data.points && +e.data.points.length || self.postMessage({ error: /* @__PURE__ */ Error("No points provided") }), e.data.points;
		let t = s(e.data.points);
		self.postMessage({ points: Object.entries(t).reduce((t, n) => (t[n[0]] = o(n[1], e.data.options), t[n[0]].reference = n[1].reference, t), {}) });
	};
}, Lr = (e, t = {
	tolerance: .002,
	maxIntPointsPerSegment: 100
}) => new Promise((n, r) => {
	let i = _e(Ir);
	i.onmessage = (e) => {
		e.data.error ? r(e.data.error) : n(e.data.points), i.terminate();
	}, i.postMessage({
		points: e,
		options: t
	});
}), Rr = "1.9.1", zr = {
	showRecticle: "showReticle",
	recticleColor: "reticleColor"
}, Br = (e) => {
	Object.keys(e).filter((e) => zr[e]).forEach((t) => {
		console.warn(`regl-scatterplot: the "${t}" property is deprecated. Please use "${zr[t]}" instead.`), e[zr[t]] = e[t], delete e[t];
	});
}, Vr = (e, t, { allowSegment: n = !1, allowDensity: r = !1 } = {}) => cn.has(e) ? "valueZ" : ln.has(e) ? "valueW" : e === "segment" ? n ? "segment" : t : e === "density" && r ? "density" : t, Hr = (e) => {
	switch (e) {
		case "valueZ": return 2;
		case "valueW": return 3;
		default: return null;
	}
}, Ur = (e = {}) => {
	let t = _({
		async: !e.syncEvents,
		caseInsensitive: !0
	}), n = /* @__PURE__ */ new Float32Array(16), r = /* @__PURE__ */ new Float32Array(16), i = [0, 0];
	Br(e);
	let { renderer: a, backgroundColor: o = zt, backgroundImage: s = Yt, canvas: c = document.createElement("canvas"), colorBy: l = Ft, deselectOnDblClick: u = Qt, deselectOnEscape: d = $t, lassoColor: f = qe, lassoLineWidth: p = Je, lassoMinDelay: m = Xe, lassoMinDist: h = Ze, lassoClearEvent: g = Qe, lassoInitiator: v = Ye, lassoInitiatorParentElement: y = document.body, lassoOnLongPress: b = $e, lassoLongPressTime: x = et, lassoLongPressAfterEffectTime: S = tt, lassoLongPressEffectDelay: C = nt, lassoLongPressRevertEffectTime: D = rt, keyMap: k = mt, mouseMode: A = ze, showReticle: j = Xt, reticleColor: M = Zt, pointColor: P = It, pointColorActive: F = Lt, pointColorHover: I = Rt, showPointConnections: L = en, pointConnectionColor: R = Vt, pointConnectionColorActive: z = Ht, pointConnectionColorHover: B = Ut, pointConnectionColorBy: V = Bt, pointConnectionOpacity: H = Dt, pointConnectionOpacityBy: te = Ot, pointConnectionOpacityActive: U = kt, pointConnectionSize: W = wt, pointConnectionSizeActive: G = Tt, pointConnectionSizeBy: K = Et, pointConnectionMaxIntPointsPerSegment: re = tn, pointConnectionTolerance: ie = nn, pointSize: q = bt, pointSizeSelected: ae = xt, pointSizeMouseDetection: oe = rn, pointOutlineWidth: se = St, opacity: fe = Ee, opacityBy: pe = At, opacityByDensityFill: me = jt, opacityInactiveMax: he = Nt, opacityInactiveScale: ge = Pt, sizeBy: _e = Ct, height: ve = _t, width: be = gt } = e, xe = be === Ee ? 1 : be, Se = ve === Ee ? 1 : ve, { performanceMode: Ce = an, opacityByDensityDebounceTime: we = Mt, spatialIndexUseWorker: Ne = dn } = e;
	a ||= Hn({
		regl: e.regl,
		gamma: e.gamma
	}), o = Ln(o, !0), f = Ln(f, !0), M = Ln(M, !0);
	let Pe = !1, vt = zn(o), X, Jt, cn = !1, ln = null, pn = [0, 0], mn = -1, Z = [], Sn = /* @__PURE__ */ new Set(), wn = /* @__PURE__ */ new Set(), Tn = !1, En = /* @__PURE__ */ new Set(), Dn = [], An = 0, jn = 0, Mn = !1, Nn = [], Un, Wn, Gn = e.aspectRatio || ht, Kn, qn, Jn, Yn, Xn, Zn, Qn, $n, er, tr = Rn(k), nr, rr, ir, ar = !1, Q = !0, or = !1, sr;
	P = Pn(P) ? [...P] : [P], F = Pn(F) ? [...F] : [F], I = Pn(I) ? [...I] : [I], P = P.map((e) => Ln(e, !0)), F = F.map((e) => Ln(e, !0)), I = I.map((e) => Ln(e, !0)), fe = !Array.isArray(fe) && Number.isNaN(+fe) ? P[0][3] : fe, fe = vn(fe, yn, { minLength: 1 }) ? [...fe] : [fe], q = vn(q, yn, { minLength: 1 }) ? [...q] : [q];
	let cr = yt / q[0];
	R === "inherit" ? R = [...P] : (R = Pn(R) ? [...R] : [R], R = R.map((e) => Ln(e, !0))), z === "inherit" ? z = [...F] : (z = Pn(z) ? [...z] : [z], z = z.map((e) => Ln(e, !0))), B === "inherit" ? B = [...I] : (B = Pn(B) ? [...B] : [B], B = B.map((e) => Ln(e, !0))), H = H === "inherit" ? [...fe] : vn(H, yn, { minLength: 1 }) ? [...H] : [H], W = W === "inherit" ? [...q] : vn(W, yn, { minLength: 1 }) ? [...W] : [W], l = Vr(l, Ft), pe = Vr(pe, At, { allowDensity: !0 }), _e = Vr(_e, Ct), V = Vr(V, Bt, { allowSegment: !0 }), te = Vr(te, Ot, { allowSegment: !0 }), K = Vr(K, Et, { allowSegment: !0 });
	let lr, ur, dr, fr, pr = 0, mr = 0, hr, gr, _r, vr, yr, br, xr, Sr = !1, Cr = null, wr, Tr, Er = j, Dr, Ir = 0, zr, Ur = 0, Wr = !1, Gr = !1, Kr = !1, qr = Y, Jr = Y, Yr, Xr = !1, Zr = e.xScale || null, $ = e.yScale || null, Qr = 0, $r = 0, ei = 0, ti = 0;
	Zr && (Qr = Zr.domain()[0], $r = Zr.domain()[1] - Zr.domain()[0], Zr.range([0, xe])), $ && (ei = $.domain()[0], ti = $.domain()[1] - $.domain()[0], $.range([Se, 0]));
	let ni = (e) => -1 + e / xe * 2, ri = (e) => 1 + e / Se * -2, ii = () => [ni(i[0]), ri(i[1])], ai = (e, t) => {
		let r = [
			e,
			t,
			1,
			1
		];
		return N(r, r, T(n, E(n, Kn, E(n, X.view, Jn)))), r.slice(0, 2);
	}, oi = (e = 0) => {
		let t = Ta(), n = (rr[1] - ir[1]) / c.height;
		return (er * t + e) * n;
	}, si = () => Tn ? Dn.filter((e, t) => En.has(t)) : Dn, ci = (e, t, n, r) => {
		let i = Un.range(e, t, n, r);
		return Tn ? i.filter((e) => En.has(e)) : i;
	}, li = () => {
		let [e, t] = ii(), [n, r] = ai(e, t), i = oi(4), a = ci(n - i, r - i, n + i, r + i), o = i, s = -1;
		return a.forEach((e) => {
			let [t, i] = Dn[e], a = hn(t, i, n, r);
			a < o && (o = a, s = e);
		}), s;
	}, ui = (e, n) => {
		Nn = e, Jt.setPoints(n), t.publish("lassoExtend", { coordinates: e });
	}, di = (e) => {
		let t = gn(e);
		if (!_n(t)) return [];
		let n = ci(...t), r = [];
		return n.forEach((t) => {
			On(e, Dn[t]) && r.push(t);
		}), r;
	}, fi = () => {
		Nn = [], Jt && Jt.clear();
	}, pi = (e) => e && e.length > 4, mi = (e, t) => {
		if (Zn || !L || !pi(Dn[e[0]])) return;
		let n = t === 0, r = t === 1 ? (e) => wn.add(e) : ce, i = Object.keys(e.reduce((e, t) => {
			let n = Dn[t], r = Array.isArray(n[4]) ? n[4][0] : n[4];
			return e[r] = !0, e;
		}, {})), a = Yn.getData().opacities;
		i.filter((e) => !wn.has(+e)).forEach((e) => {
			let t = Xn[e][0], i = Xn[e][2], o = Xn[e][3], s = t * 4 + o * 2, c = s + i * 2 + 4;
			a.__original__ === void 0 && (a.__original__ = a.slice());
			for (let e = s; e < c; e++) a[e] = n ? a.__original__[e] : U;
			r(e);
		}), Yn.getBuffer().opacities.subdata(a, 0);
	}, hi = (e) => [e % pr / pr + mr, Math.floor(e / pr) / pr + mr], gi = (e) => Tn && !En.has(e), _i = ({ preventEvent: e = !1 } = {}) => {
		g === We && fi(), Z.length && (e || t.publish("deselect"), wn.clear(), mi(Z, 0), Z = [], Sn.clear(), Q = !0);
	}, vi = (e, { merge: n = !1, preventEvent: r = !1 } = {}) => {
		let i = Array.isArray(e) ? e : [e], a = [...Z];
		if (n) {
			if (Z = de(Z, i), a.length === Z.length) {
				Q = !0;
				return;
			}
		} else {
			if (Z && Z.length && mi(Z, 0), a.length > 0 && i.length === 0) {
				_i({ preventEvent: r });
				return;
			}
			Z = i;
		}
		if (J(a, Z)) {
			Q = !0;
			return;
		}
		let o = [];
		Sn.clear(), wn.clear();
		for (let e = Z.length - 1; e >= 0; e--) {
			let t = Z[e];
			if (t < 0 || t >= An || gi(t)) {
				Z.splice(e, 1);
				continue;
			}
			Sn.add(t), o.push.apply(o, hi(t));
		}
		gr({
			usage: "dynamic",
			type: "float",
			data: o
		}), mi(Z, 1), r || t.publish("select", { points: Z }), Q = !0;
	}, yi = (e, { showReticleOnce: n = !1, preventEvent: r = !1 } = {}) => {
		let i = !1;
		if (e >= 0 && e < An) {
			i = !0;
			let n = Yr, a = e !== Yr;
			+n >= 0 && a && !Sn.has(n) && mi([n], 0), Yr = e, _r.subdata(hi(e)), Sn.has(e) || mi([e], 2), a && !r && t.publish("pointover", Yr);
		} else i = +Yr >= 0, i && (Sn.has(Yr) || mi([Yr], 0), r || t.publish("pointout", Yr)), Yr = void 0;
		i && (Q = !0, or = n);
	}, bi = (e) => {
		let t = c.getBoundingClientRect();
		return i[0] = e.clientX - t.left, i[1] = e.clientY - t.top, [...i];
	}, xi = Or(c, {
		onStart: () => {
			X.config({ isFixed: !0 }), cn = !0, Mn = !0, fi(), mn >= 0 && (clearTimeout(mn), mn = -1), t.publish("lassoStart");
		},
		onDraw: ui,
		onEnd: (e, n, { merge: r = !1 } = {}) => {
			X.config({ isFixed: !1 }), Nn = [...e];
			let i = di(n);
			vi(i, { merge: r }), t.publish("lassoEnd", { coordinates: Nn }), g === Ge && fi();
		},
		enableInitiator: v,
		initiatorParentElement: y,
		pointNorm: ([e, t]) => ai(ni(e), ri(t))
	}), Si = () => A === Ie, Ci = (e, t) => {
		switch (tr[t]) {
			case ct: return e.altKey;
			case lt: return e.metaKey;
			case ut: return e.ctrlKey;
			case dt: return e.metaKey;
			case ft: return e.shiftKey;
			default: return !1;
		}
	}, wi = (e) => document.elementsFromPoint(e.clientX, e.clientY).some((e) => e === c), Ti = (e) => {
		!Gr || e.buttons !== 1 || (cn = !0, ln = performance.now(), pn = bi(e), Mn = Si() || Ci(e, it), !Mn && b && (xi.showLongPressIndicator(e.clientX, e.clientY, {
			time: x,
			extraTime: S,
			delay: C
		}), mn = setTimeout(() => {
			mn = -1, Mn = !0;
		}, x)));
	}, Ei = (e) => {
		Gr && (cn = !1, mn >= 0 && (clearTimeout(mn), mn = -1), Mn && (e.preventDefault(), Mn = !1, xi.end({ merge: Ci(e, ot) })), b && xi.hideLongPressIndicator({ time: D }));
	}, Di = (e) => {
		if (!Gr || (e.preventDefault(), hn(...bi(e), ...pn) >= h)) return;
		let t = performance.now() - ln;
		if (!v || t < sn) {
			let t = li();
			t >= 0 ? (Z.length && g === We && fi(), vi([t], { merge: Ci(e, ot) })) : nr ||= setTimeout(() => {
				nr = null, xi.showInitiator(e);
			}, on);
		}
	}, Oi = (e) => {
		xi.hideInitiator(), nr &&= (clearTimeout(nr), null), u && (e.preventDefault(), _i());
	}, ki = (e) => {
		if (Kr ||= (Xr = wi(e), !0), !Gr || !Xr && !cn) return;
		let t = hn(...bi(e), ...pn) >= h;
		Xr && !Mn && yi(li()), Mn ? (e.preventDefault(), xi.extend(e, !0)) : cn && b && t && xi.hideLongPressIndicator({ time: D }), mn >= 0 && t && (clearTimeout(mn), mn = -1), cn && (Q = !0);
	}, Ai = () => {
		Yr = void 0, Xr = !1, Kr = !1, Gr && (+Yr >= 0 && !Sn.has(Yr) && mi([Yr], 0), Ei(), Q = !0);
	}, ji = () => {
		let e = Math.max(q.length, fe.length);
		Ur = Math.max(2, Math.ceil(Math.sqrt(e)));
		let t = new Float32Array(Ur ** 2 * 4);
		for (let n = 0; n < e; n++) {
			t[n * 4] = q[n] || 0, t[n * 4 + 1] = Math.min(1, fe[n] || 0);
			let e = Number((F[n] || F[0])[3]);
			t[n * 4 + 2] = Math.min(1, Number.isNaN(e) ? 1 : e);
			let r = Number((I[n] || I[0])[3]);
			t[n * 4 + 3] = Math.min(1, Number.isNaN(r) ? 1 : r);
		}
		return a.regl.texture({
			data: t,
			shape: [
				Ur,
				Ur,
				4
			],
			type: "float"
		});
	}, Mi = (e = P, t = F, n = I) => {
		let r = e.length, i = t.length, a = n.length, s = [];
		if (r === i && i === a) for (let i = 0; i < r; i++) s.push(e[i], t[i], n[i], o);
		else for (let i = 0; i < r; i++) {
			let r = [
				e[i][0],
				e[i][1],
				e[i][2],
				1
			], a = l === Ft ? t[0] : r, c = l === Ft ? n[0] : r;
			s.push(e[i], a, c, o);
		}
		return s;
	}, Ni = () => {
		let e = Mi(), t = e.length;
		Ir = Math.max(2, Math.ceil(Math.sqrt(t)));
		let n = new Float32Array(Ir ** 2 * 4);
		return e.forEach((e, t) => {
			n[t * 4] = e[0], n[t * 4 + 1] = e[1], n[t * 4 + 2] = e[2], n[t * 4 + 3] = e[3];
		}), a.regl.texture({
			data: n,
			shape: [
				Ir,
				Ir,
				4
			],
			type: "float"
		});
	}, Pi = (e, t) => {
		qn[0] = e / Wn, qn[5] = t;
	}, Fi = () => {
		Wn = xe / Se, Kn = O([], [
			1 / Wn,
			1,
			1
		]), qn = O([], [
			1 / Wn,
			1,
			1
		]), Jn = O([], [
			Gn,
			1,
			1
		]);
	}, Ii = (e) => {
		+e <= 0 || (Gn = e);
	}, Li = (e, t) => (n) => {
		if (!n || !n.length) return;
		let r = [...e()], i = Pn(n) ? n : [n];
		i = i.map((e) => Ln(e, !0)), Dr && Dr.destroy();
		try {
			t(i), Dr = Ni();
		} catch {
			console.error("Invalid colors. Switching back to default colors."), t(r), Dr = Ni();
		}
	}, Ri = Li(() => P, (e) => {
		P = e;
	}), zi = Li(() => F, (e) => {
		F = e;
	}), Bi = Li(() => I, (e) => {
		I = e;
	}), Vi = () => {
		let e = ai(-1, -1), t = ai(1, 1), n = (e[0] + 1) / 2, r = (t[0] + 1) / 2, i = (e[1] + 1) / 2, a = (t[1] + 1) / 2;
		return [[Qr + n * $r, Qr + r * $r], [ei + i * ti, ei + a * ti]];
	}, Hi = () => {
		if (!Zr && !$) return;
		let [e, t] = Vi();
		Zr && Zr.domain(e), $ && $.domain(t);
	}, Ui = (e) => {
		Se = Math.max(1, e), c.height = Math.floor(Se * window.devicePixelRatio), $ && ($.range([Se, 0]), Hi());
	}, Wi = (e) => {
		if (e === Ee) {
			ve = e, c.style.height = "100%", window.requestAnimationFrame(() => {
				c && Ui(c.getBoundingClientRect().height);
			});
			return;
		}
		!+e || +e <= 0 || (ve = +e, Ui(ve), c.style.height = `${ve}px`);
	}, Gi = () => {
		er = oe, oe === Ee && (er = Array.isArray(q) ? le(q) : q);
	}, Ki = (e) => {
		vn(e, yn, { minLength: 1 }) && (q = [...e]), bn(+e) && (q = [+e]), cr = yt / q[0], zr = ji(), Gi();
	}, qi = (e) => {
		!+e || +e < 0 || (ae = +e);
	}, Ji = (e) => {
		!+e || +e < 0 || (se = +e);
	}, Yi = (e) => {
		xe = Math.max(1, e), c.width = Math.floor(xe * window.devicePixelRatio), Zr && (Zr.range([0, xe]), Hi());
	}, Xi = (e) => {
		if (e === Ee) {
			be = e, c.style.width = "100%", window.requestAnimationFrame(() => {
				c && Yi(c.getBoundingClientRect().width);
			});
			return;
		}
		!+e || +e <= 0 || (be = +e, Yi(be), c.style.width = `${xe}px`);
	}, Zi = (e) => {
		vn(e, yn, { minLength: 1 }) && (fe = [...e]), bn(+e) && (fe = [+e]), zr = ji();
	}, Qi = (e) => {
		switch (e) {
			case "valueZ": return qr;
			case "valueW": return Jr;
			default: return null;
		}
	}, $i = (e, t) => {
		switch (e) {
			case He: return (e) => Math.round(e * (t.length - 1));
			case Y:
			default: return ce;
		}
	}, ea = (e) => {
		l = Vr(e, Ft);
	}, ta = (e) => {
		pe = Vr(e, At, { allowDensity: !0 });
	}, na = (e) => {
		_e = Vr(e, Ct);
	}, ra = (e) => {
		V = Vr(e, Bt, { allowSegment: !0 });
	}, ia = (e) => {
		te = Vr(e, Ot, { allowSegment: !0 });
	}, aa = (e) => {
		K = Vr(e, Et, { allowSegment: !0 });
	}, oa = () => [c.width, c.height], sa = () => s, ca = () => Dr, la = () => Ir, ua = () => .5 / Ir, da = () => window.devicePixelRatio, fa = () => hr, pa = () => gr, ma = () => zr, ha = () => Ur, ga = () => .5 / Ur, _a = () => 0, va = () => dr || lr, ya = () => pr, ba = () => .5 / pr, xa = () => qn, Sa = () => X.view, Ca = () => Jn, wa = () => E(r, qn, E(r, X.view, Jn)), Ta = () => X.scaling[0] > 1 ? Math.asinh(Fn(1, X.scaling[0])) / Math.asinh(1) * window.devicePixelRatio : Fn(cr, X.scaling[0]) * window.devicePixelRatio, Ea = () => Tn ? En.size : An, Da = () => Z.length, Oa = () => Da() > 0 ? he : 1, ka = () => Da() > 0 ? ge : 1, Aa = () => +(l === "valueZ"), ja = () => +(l === "valueW"), Ma = () => +(pe === "valueZ"), Na = () => +(pe === "valueW"), Pa = () => +(pe === "density"), Fa = () => +(_e === "valueZ"), Ia = () => +(_e === "valueW"), La = () => l === "valueZ" ? qr === He ? P.length - 1 : 1 : Jr === He ? P.length - 1 : 1, Ra = () => pe === "valueZ" ? qr === He ? fe.length - 1 : 1 : Jr === He ? fe.length - 1 : 1, za = () => _e === "valueZ" ? qr === He ? q.length - 1 : 1 : Jr === He ? q.length - 1 : 1, Ba = (e) => {
		if (pe !== "density") return 1;
		let t = Ta(), n = q[0] * t, r = 2 / (2 / X.view[0]) * (2 / (2 / X.view[5])), i = e.viewportHeight, a = e.viewportWidth, o = me * a * i / (jn * n * n) * In(1, r);
		o *= Ce ? 1 : 1 / (.25 * Math.PI);
		let s = Fn(yt, n) + .5;
		return o *= (n / s) ** 2, In(1, Fn(0, o));
	}, Va = a.regl({
		framebuffer: () => fr,
		vert: Fr,
		frag: Pr,
		attributes: { position: [
			-4,
			0,
			4,
			4,
			4,
			-4
		] },
		uniforms: {
			startStateTex: () => ur,
			endStateTex: () => lr,
			t: (e, t) => t.t
		},
		count: 3
	}), Ha = (e, t, n, r = De, i = Oa, o = ka) => a.regl({
		frag: Ce ? Mr : jr,
		vert: Nr(r),
		blend: {
			enable: !Ce,
			func: {
				srcRGB: "src alpha",
				srcAlpha: "one",
				dstRGB: "one minus src alpha",
				dstAlpha: "one minus src alpha"
			}
		},
		depth: { enable: !1 },
		attributes: { stateIndex: {
			buffer: n,
			size: 2
		} },
		uniforms: {
			resolution: oa,
			modelViewProjection: wa,
			devicePixelRatio: da,
			pointScale: Ta,
			encodingTex: ma,
			encodingTexRes: ha,
			encodingTexEps: ga,
			pointOpacityMax: i,
			pointOpacityScale: o,
			pointSizeExtra: e,
			globalState: r,
			colorTex: ca,
			colorTexRes: la,
			colorTexEps: ua,
			stateTex: va,
			stateTexRes: ya,
			stateTexEps: ba,
			isColoredByZ: Aa,
			isColoredByW: ja,
			isOpacityByZ: Ma,
			isOpacityByW: Na,
			isOpacityByDensity: Pa,
			isSizedByZ: Fa,
			isSizedByW: Ia,
			colorMultiplicator: La,
			opacityMultiplicator: Ra,
			opacityDensity: Ba,
			sizeMultiplicator: za,
			numColorStates: je
		},
		count: t,
		primitive: "points"
	}), Ua = Ha(_a, Ea, fa), Wa = Ha(_a, () => 1, () => _r, ke, () => 1, () => 1), Ga = Ha(() => (ae + se * 2) * window.devicePixelRatio, Da, pa, Oe, () => 1, () => 1), Ka = Ha(() => (ae + se) * window.devicePixelRatio, Da, pa, Ae, () => 1, () => 1), qa = Ha(() => ae * window.devicePixelRatio, Da, pa, Oe, () => 1, () => 1), Ja = () => {
		Ga(), Ka(), qa();
	}, Ya = a.regl({
		frag: kr,
		vert: Ar,
		attributes: { position: [
			0,
			1,
			0,
			0,
			1,
			0,
			0,
			1,
			1,
			1,
			1,
			0
		] },
		uniforms: {
			modelViewProjection: wa,
			texture: sa
		},
		count: 6
	}), Xa = a.regl({
		vert: "\n      precision mediump float;\n      uniform mat4 modelViewProjection;\n      attribute vec2 position;\n      void main () {\n        gl_Position = modelViewProjection * vec4(position, 0, 1);\n      }",
		frag: "\n      precision mediump float;\n      uniform vec4 color;\n      void main () {\n        gl_FragColor = vec4(color.rgb, 0.2);\n      }",
		depth: { enable: !1 },
		blend: {
			enable: !0,
			func: {
				srcRGB: "src alpha",
				srcAlpha: "one",
				dstRGB: "one minus src alpha",
				dstAlpha: "one minus src alpha"
			}
		},
		attributes: { position: () => Nn },
		uniforms: {
			modelViewProjection: wa,
			color: () => f
		},
		elements: () => Array.from({ length: Nn.length - 2 }, (e, t) => [
			0,
			t + 1,
			t + 2
		])
	}), Za = () => {
		if (!(Yr >= 0)) return;
		let [e, t] = Dn[Yr].slice(0, 2), r = [
			e,
			t,
			0,
			1
		];
		E(n, qn, E(n, X.view, Jn)), N(r, r, n), Qn.setPoints([
			-1,
			r[1],
			1,
			r[1]
		]), $n.setPoints([
			r[0],
			1,
			r[0],
			-1
		]), Qn.draw(), $n.draw(), Ha(() => (ae + se * 2) * window.devicePixelRatio, () => 1, _r, Oe)(), Ha(() => (ae + se) * window.devicePixelRatio, () => 1, _r, Ae)();
	}, Qa = (e) => {
		let t = new Float32Array(e * 2), n = 0;
		for (let r = 0; r < e; ++r) {
			let e = hi(r);
			t[n] = e[0], t[n + 1] = e[1], n += 2;
		}
		return t;
	}, $a = (e, t = {}) => {
		let n = e.length;
		pr = Math.max(2, Math.ceil(Math.sqrt(n))), mr = .5 / pr;
		let r = new Float32Array(pr ** 2 * 4), i = !0, o = !0, s = 0, c = 0, l = 0;
		for (let t = 0; t < n; ++t) s = t * 4, r[s] = e[t][0], r[s + 1] = e[t][1], c = e[t][2] || 0, l = e[t][3] || 0, r[s + 2] = c, r[s + 3] = l, i &&= Number.isInteger(c), o &&= Number.isInteger(l);
		return qr = t.z && Ue.includes(t.z) ? t.z : i ? Y : He, Jr = t.w && Ue.includes(t.w) ? t.w : o ? Y : He, a.regl.texture({
			data: r,
			shape: [
				pr,
				pr,
				4
			],
			type: "float"
		});
	}, eo = (e, t = {}) => {
		if (!lr) return !1;
		if (Sr) {
			let e = ur;
			ur = dr, e.destroy();
		} else ur = lr;
		return dr = $a(e, t), fr = a.regl.framebuffer({
			color: dr,
			depth: !1,
			stencil: !1
		}), lr = void 0, !0;
	}, to = () => !!(ur && dr), no = () => {
		ur &&= (ur.destroy(), void 0), dr &&= (dr.destroy(), void 0);
	}, ro = (e, t = {}) => new Promise((n) => {
		Gr = !1, An = e.length, jn = An, lr && lr.destroy(), lr = $a(e, {
			z: t.zDataType,
			w: t.wDataType
		}), hr({
			usage: "static",
			type: "float",
			data: Qa(An)
		}), Te(t.spatialIndex || e, { useWorker: Ne }).then((t) => {
			Un = t, Dn = e, Gr = !0;
		}).then(n);
	}), io = (e, t) => {
		vr = X.target, yr = e, br = X.distance[0], xr = t;
	}, ao = () => vr !== void 0 && yr !== void 0 && br !== void 0 && xr !== void 0, oo = () => {
		vr = void 0, yr = void 0, br = void 0, xr = void 0;
	}, so = (e) => {
		let t = V === "inherit" ? l : V;
		if (t === "segment") {
			let t = R.length - 1;
			return t < 1 ? [] : e.reduce((e, n, r) => {
				let i = 0, a = [];
				for (let e = 2; e < n.length; e += 2) {
					let t = Math.sqrt((n[e - 2] - n[e]) ** 2 + (n[e - 1] - n[e + 1]) ** 2);
					a.push(t), i += t;
				}
				e[r] = [0];
				let o = 0;
				for (let s = 0; s < n.length / 2 - 1; s++) o += a[s], e[r].push(Math.floor(o / i * t) * 4);
				return e;
			}, []);
		}
		if (t) {
			let e = Hr(t), n = $i(Qi(t), V === "inherit" ? P : R);
			return Xn.reduce((t, [r, i]) => (t[r] = n(i[e]) * 4, t), []);
		}
		return Array(Xn.length).fill(0);
	}, co = () => {
		let e = te === "inherit" ? pe : te;
		if (e === "segment") {
			let e = H.length - 1;
			return e < 1 ? [] : Xn.reduce((t, [n, r, i]) => (t[n] = ue(i, (t) => H[Math.floor(t / (i - 1) * e)]), t), []);
		}
		if (e) {
			let t = Hr(e), n = te === "inherit" ? fe : H, r = $i(Qi(e), n);
			return Xn.reduce((e, [i, a]) => (e[i] = n[r(a[t])], e), []);
		}
	}, lo = () => {
		let e = K === "inherit" ? _e : K;
		if (e === "segment") {
			let e = W.length - 1;
			return e < 1 ? [] : Xn.reduce((t, [n, r, i]) => (t[n] = ue(i, (t) => W[Math.floor(t / (i - 1) * e)]), t), []);
		}
		if (e) {
			let t = Hr(e), n = K === "inherit" ? q : W, r = $i(Qi(e), n);
			return Xn.reduce((e, [i, a]) => (e[i] = n[r(a[t])], e), []);
		}
	}, uo = (e) => {
		Xn = [];
		let t = 0;
		Object.keys(e).forEach((n, r) => {
			Xn[n] = [
				r,
				e[n].reference,
				e[n].length / 2,
				t
			], t += e[n].length / 2;
		});
	}, fo = (e) => new Promise((t) => {
		Yn.setPoints([]), !e || !e.length ? t() : (Zn = !0, Lr(e, {
			maxIntPointsPerSegment: re,
			tolerance: ie
		}).then((e) => {
			uo(e);
			let n = Object.values(e);
			Yn.setPoints(n.length === 1 ? n[0] : n, {
				colorIndices: so(n),
				opacities: co(),
				widths: lo()
			}), Zn = !1, t();
		}));
	}), po = ({ preventEvent: e = !1 } = {}) => (Tn = !1, En.clear(), hr.subdata(Qa(An)), new Promise((n) => {
		let r = () => {
			t.subscribe("draw", () => {
				e || t.publish("unfilter"), n();
			}, 1), Q = !0;
		};
		L || pi(Dn[0]) ? fo(si()).then(() => {
			e || t.publish("pointConnectionsDraw"), r();
		}) : r();
	})), mo = (e, { preventEvent: n = !1 } = {}) => {
		let r = Array.isArray(e) ? e : [e];
		Tn = !0, En.clear();
		let i = [], a = [];
		for (let e = r.length - 1; e >= 0; e--) {
			let t = r[e];
			if (t < 0 || t >= An) {
				r.splice(e, 1);
				continue;
			}
			En.add(t), i.push.apply(i, hi(t)), Sn.has(t) && a.push(t);
		}
		return hr.subdata(i), vi(a, { preventEvent: n }), En.has(Yr) || yi(-1, { preventEvent: n }), new Promise((e) => {
			let i = () => {
				t.subscribe("draw", () => {
					n || t.publish("filter", { points: r }), e();
				}, 1), Q = !0;
			};
			L || pi(Dn[0]) ? fo(si()).then(() => {
				n || t.publish("pointConnectionsDraw"), vi(a, { preventEvent: n }), i();
			}) : i();
		});
	}, ho = () => ci(ir[0], ir[1], rr[0], rr[1]), go = ye(() => {
		jn = ho().length;
	}, we), _o = (e) => {
		let [t, n] = vr, [r, i] = yr, a = 1 - e, o = t * a + r * e, s = n * a + i * e, c = br * a + xr * e;
		X.lookAt([o, s], c);
	}, vo = () => to(), yo = () => ao(), bo = (e, t) => {
		Cr ||= performance.now();
		let n = performance.now() - Cr, r = Bn(t(n / e), 0, 1);
		return vo() && Va({ t: r }), yo() && _o(r), n < e;
	}, xo = () => {
		Sr = !1, Cr = null, wr = void 0, Tr = void 0, j = Er, no(), oo(), t.publish("transitionEnd");
	}, So = ({ duration: e = 500, easing: n = Ve }) => {
		Sr && t.publish("transitionEnd"), Sr = !0, Cr = null, wr = e, Tr = kn(n) ? Be[n] || Ve : n, Er = j, j = !1, t.publish("transitionStart");
	}, Co = (e, n = {}) => Pe ? Promise.reject(/* @__PURE__ */ Error("The instance was already destroyed")) : Vn(e).then((e) => new Promise((r) => {
		if (Pe) {
			r();
			return;
		}
		let i = !1;
		(!n.preventFilterReset || e?.length !== An) && (Tn = !1, En.clear());
		let a = e && pi(e[0]) && (L || n.showPointConnectionsOnce), { zDataType: o, wDataType: s } = n;
		new Promise((c) => {
			e ? (n.transition && (e.length === An ? i = eo(e, {
				z: o,
				w: s
			}) : console.warn("Cannot transition! The number of points between the previous and current draw call must be identical.")), ro(e, {
				zDataType: o,
				wDataType: s,
				spatialIndex: n.spatialIndex
			}).then(() => {
				n.hover !== void 0 && yi(n.hover, { preventEvent: !0 }), n.select !== void 0 && vi(n.select, { preventEvent: !0 }), n.filter !== void 0 && mo(n.filter, { preventEvent: !0 }), a ? fo(e).then(() => {
					t.publish("pointConnectionsDraw"), Q = !0, or = n.showReticleOnce;
				}).then(r) : c();
			})) : c();
		}).then(() => {
			n.transition && i ? (a ? Promise.all([new Promise((e) => {
				t.subscribe("transitionEnd", () => {
					Q = !0, or = n.showReticleOnce, e();
				}, 1);
			}), new Promise((e) => {
				t.subscribe("pointConnectionsDraw", e, 1);
			})]).then(r) : t.subscribe("transitionEnd", () => {
				Q = !0, or = n.showReticleOnce, r();
			}, 1), So({
				duration: n.transitionDuration,
				easing: n.transitionEasing
			})) : (a ? Promise.all([new Promise((e) => {
				t.subscribe("draw", e, 1);
			}), new Promise((e) => {
				t.subscribe("pointConnectionsDraw", e, 1);
			})]).then(r) : t.subscribe("draw", r, 1), Q = !0, or = n.showReticleOnce);
		});
	})), wo = (e) => (...t) => {
		let n = e(...t);
		return Q = !0, n;
	}, To = (e) => {
		let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
		for (let a = 0; a < e.length; a++) {
			let [o, s] = Dn[e[a]];
			t = Math.min(t, o), n = Math.max(n, o), r = Math.min(r, s), i = Math.max(i, s);
		}
		return {
			x: t,
			y: r,
			width: n - t,
			height: i - r
		};
	}, Eo = (e, n = {}) => new Promise((r) => {
		let i = [e.x + e.width / 2, e.y + e.height / 2], a = 2 * Math.atan(1), o = e.height * Wn > e.width ? e.height / 2 / Math.tan(a / 2) : e.width / 2 / Math.tan(a * Wn / 2);
		n.transition ? (X.config({ isFixed: !0 }), io(i, o), t.subscribe("transitionEnd", () => {
			r(), X.config({ isFixed: !1 });
		}, 1), So({
			duration: n.transitionDuration,
			easing: n.transitionEasing
		})) : (X.lookAt(i, o), t.subscribe("draw", r, 1), Q = !0);
	}), Do = (e, t = {}) => {
		if (!Gr) return Promise.reject(/* @__PURE__ */ Error(fn));
		let n = To(e), r = n.x + n.width / 2, i = n.y + n.height / 2, a = oi(), o = 1 + (t.padding || 0), s = Math.max(n.width, a) * o, c = Math.max(n.height, a) * o, l = r - s / 2, u = i - c / 2;
		return Eo({
			x: l,
			y: u,
			width: s,
			height: c
		}, t);
	}, Oo = (e, n, r = {}) => new Promise((i) => {
		r.transition ? (X.config({ isFixed: !0 }), io(e, n), t.subscribe("transitionEnd", () => {
			i(), X.config({ isFixed: !1 });
		}, 1), So({
			duration: r.transitionDuration,
			easing: r.transitionEasing
		})) : (X.lookAt(e, n), t.subscribe("draw", i, 1), Q = !0);
	}), ko = (e = {}) => Oo([0, 0], 1, e), Ao = (e) => {
		if (!Gr) throw Error(fn);
		let t = Dn[e];
		if (!t) return;
		let r = [
			t[0],
			t[1],
			0,
			1
		];
		return E(n, Kn, E(n, X.view, Jn)), N(r, r, n), [xe * (r[0] + 1) / 2, Se * (.5 - r[1] / 2)];
	}, jo = () => {
		Yn.setStyle({
			color: Mi(R, z, B),
			opacity: H === null ? null : H[0],
			width: W[0]
		});
	}, Mo = () => {
		let e = Math.round(vt) > .5 ? 0 : 255;
		xi.initiator.style.border = `1px dashed rgba(${e}, ${e}, ${e}, 0.33)`, xi.initiator.style.background = `rgba(${e}, ${e}, ${e}, 0.1)`;
	}, No = () => {
		let e = Math.round(vt) > .5 ? 0 : 255;
		xi.longPressIndicator.style.color = `rgb(${e}, ${e}, ${e})`, xi.longPressIndicator.dataset.color = `rgb(${e}, ${e}, ${e})`;
		let t = f.map((e) => Math.round(e * 255));
		xi.longPressIndicator.dataset.activeColor = `rgb(${t[0]}, ${t[1]}, ${t[2]})`;
	}, Po = (e) => {
		e && (o = Ln(e, !0), vt = zn(o), Mo(), No());
	}, Fo = (e) => {
		e ? kn(e) ? Cn(a.regl, e).then((e) => {
			s = e, Q = !0, t.publish("backgroundImageReady");
		}).catch(() => {
			console.error(`Count not create texture from ${e}`), s = null;
		}) : s = e._reglType === "texture2d" ? e : null : s = null;
	}, Io = (e) => {
		e > 0 && X.lookAt(X.target, e, X.rotation);
	}, Lo = (e) => {
		e !== null && X.lookAt(X.target, X.distance[0], e);
	}, Ro = (e) => {
		e && X.lookAt(e, X.distance[0], X.rotation);
	}, zo = (e) => {
		e && X.setView(e);
	}, Bo = (e) => {
		if (!e) return;
		f = Ln(e, !0), Jt.setStyle({ color: f });
		let t = f.map((e) => Math.round(e * 255));
		xi.longPressIndicator.dataset.activeColor = `rgb(${t[0]}, ${t[1]}, ${t[2]})`;
	}, Vo = (e) => {
		Number.isNaN(+e) || +e < 1 || (p = +e, Jt.setStyle({ width: p }));
	}, Ho = (e) => {
		+e && (m = +e, xi.set({ minDelay: m }));
	}, Uo = (e) => {
		+e && (h = +e, xi.set({ minDist: h }));
	}, Wo = (e) => {
		g = xn(Ke, g)(e);
	}, Go = (e) => {
		v = !!e, xi.set({ enableInitiator: v });
	}, Ko = (e) => {
		y = e, xi.set({ startInitiatorParentElement: y });
	}, qo = (e) => {
		b = !!e;
	}, Jo = (e) => {
		x = Number(e);
	}, Yo = (e) => {
		S = Number(e);
	}, Xo = (e) => {
		C = Number(e);
	}, Zo = (e) => {
		D = Number(e);
	}, Qo = (e) => {
		k = Object.entries(e).reduce((e, [t, n]) => (pt.includes(t) && st.includes(n) && (e[t] = n), e), {}), tr = Rn(k), tr[at] ? X.config({
			isRotate: !0,
			mouseDownMoveModKey: tr[at]
		}) : X.config({ isRotate: !1 });
	}, $o = (e) => {
		A = xn(Re, Fe)(e), X.config({ defaultMouseDownMoveAction: A === Le ? "rotate" : "pan" });
	}, es = (e) => {
		e !== null && (j = e);
	}, ts = (e) => {
		e && (M = Ln(e, !0), Qn.setStyle({ color: M }), $n.setStyle({ color: M }));
	}, ns = (e) => {
		e && (Zr = e, Qr = e.domain()[0], $r = e ? e.domain()[1] - e.domain()[0] : 0, Zr.range([0, xe]), Hi());
	}, rs = (e) => {
		e && ($ = e, ei = $.domain()[0], ti = $ ? $.domain()[1] - $.domain()[0] : 0, $.range([Se, 0]), Hi());
	}, is = (e) => {
		u = !!e;
	}, as = (e) => {
		d = !!e;
	}, os = (e) => {
		L = !!e, L ? Gr && pi(Dn[0]) && fo(si()).then(() => {
			t.publish("pointConnectionsDraw"), Q = !0;
		}) : fo();
	}, ss = (e, t) => (n) => {
		e(n === "inherit" ? [...t()] : (Pn(n) ? n : [n]).map((e) => Ln(e, !0))), jo();
	}, cs = ss((e) => {
		R = e;
	}, () => P), ls = ss((e) => {
		z = e;
	}, () => F), us = ss((e) => {
		B = e;
	}, () => I), ds = (e) => {
		vn(e, yn, { minLength: 1 }) && (H = [...e]), bn(+e) && (H = [+e]), R = R.map((e) => (e[3] = Number.isNaN(+H[0]) ? e[3] : +H[0], e)), jo();
	}, fs = (e) => {
		!Number.isNaN(+e) && +e && (U = +e);
	}, ps = (e) => {
		vn(e, yn, { minLength: 1 }) && (W = [...e]), bn(+e) && (W = [+e]), jo();
	}, ms = (e) => {
		!Number.isNaN(+e) && +e && (G = Math.max(0, e));
	}, hs = (e) => {
		re = Math.max(0, e);
	}, gs = (e) => {
		ie = Math.max(0, e);
	}, _s = (e) => {
		oe = e, Gi();
	}, vs = (e) => {
		me = +e;
	}, ys = (e) => {
		he = +e;
	}, bs = (e) => {
		ge = +e;
	}, xs = (e) => {
		a.gamma = e;
	}, Ss = (e) => {
		if (Br({ property: !0 }), e === "aspectRatio") return Gn;
		if (e === "background" || e === "backgroundColor") return o;
		if (e === "backgroundImage") return s;
		if (e === "camera") return X;
		if (e === "cameraTarget") return X.target;
		if (e === "cameraDistance") return X.distance[0];
		if (e === "cameraRotation") return X.rotation;
		if (e === "cameraView") return X.view;
		if (e === "canvas") return c;
		if (e === "colorBy") return l;
		if (e === "sizeBy") return _e;
		if (e === "deselectOnDblClick") return u;
		if (e === "deselectOnEscape") return d;
		if (e === "height") return ve;
		if (e === "lassoColor") return f;
		if (e === "lassoLineWidth") return p;
		if (e === "lassoMinDelay") return m;
		if (e === "lassoMinDist") return h;
		if (e === "lassoClearEvent") return g;
		if (e === "lassoInitiator") return v;
		if (e === "lassoInitiatorElement") return xi.initiator;
		if (e === "lassoInitiatorParentElement") return y;
		if (e === "keyMap") return { ...k };
		if (e === "mouseMode") return A;
		if (e === "opacity") return fe.length === 1 ? fe[0] : fe;
		if (e === "opacityBy") return pe;
		if (e === "opacityByDensityFill") return me;
		if (e === "opacityByDensityDebounceTime") return we;
		if (e === "opacityInactiveMax") return he;
		if (e === "opacityInactiveScale") return ge;
		if (e === "points") return Dn;
		if (e === "hoveredPoint") return Yr;
		if (e === "selectedPoints") return [...Z];
		if (e === "filteredPoints") return Tn ? Array.from(En) : Array.from({ length: Dn.length }, (e, t) => t);
		if (e === "pointsInView") return ho();
		if (e === "pointColor") return P.length === 1 ? P[0] : P;
		if (e === "pointColorActive") return F.length === 1 ? F[0] : F;
		if (e === "pointColorHover") return I.length === 1 ? I[0] : I;
		if (e === "pointOutlineWidth") return se;
		if (e === "pointSize") return q.length === 1 ? q[0] : q;
		if (e === "pointSizeSelected") return ae;
		if (e === "pointSizeMouseDetection") return oe;
		if (e === "showPointConnections") return L;
		if (e === "pointConnectionColor") return R.length === 1 ? R[0] : R;
		if (e === "pointConnectionColorActive") return z.length === 1 ? z[0] : z;
		if (e === "pointConnectionColorHover") return B.length === 1 ? B[0] : B;
		if (e === "pointConnectionColorBy") return V;
		if (e === "pointConnectionOpacity") return H.length === 1 ? H[0] : H;
		if (e === "pointConnectionOpacityBy") return te;
		if (e === "pointConnectionOpacityActive") return U;
		if (e === "pointConnectionSize") return W.length === 1 ? W[0] : W;
		if (e === "pointConnectionSizeActive") return G;
		if (e === "pointConnectionSizeBy") return K;
		if (e === "pointConnectionMaxIntPointsPerSegment") return re;
		if (e === "pointConnectionTolerance") return ie;
		if (e === "reticleColor") return M;
		if (e === "regl") return a.regl;
		if (e === "showReticle") return j;
		if (e === "version") return Rr;
		if (e === "width") return be;
		if (e === "xScale") return Zr;
		if (e === "yScale") return $;
		if (e === "performanceMode") return Ce;
		if (e === "gamma") return a.gamma;
		if (e === "renderer") return a;
		if (e === "isDestroyed") return Pe;
		if (e === "isPointsDrawn") return Gr;
		if (e === "isPointsFiltered") return Tn;
		if (e === "zDataType") return qr;
		if (e === "wDataType") return Jr;
		if (e === "spatialIndex") return Un?.data;
	}, Cs = (e = {}) => (Br(e), (e.backgroundColor !== void 0 || e.background !== void 0) && Po(e.backgroundColor || e.background), e.backgroundImage !== void 0 && Fo(e.backgroundImage), e.cameraTarget !== void 0 && Ro(e.cameraTarget), e.cameraDistance !== void 0 && Io(e.cameraDistance), e.cameraRotation !== void 0 && Lo(e.cameraRotation), e.cameraView !== void 0 && zo(e.cameraView), e.colorBy !== void 0 && ea(e.colorBy), e.pointColor !== void 0 && Ri(e.pointColor), e.pointColorActive !== void 0 && zi(e.pointColorActive), e.pointColorHover !== void 0 && Bi(e.pointColorHover), e.pointSize !== void 0 && Ki(e.pointSize), e.pointSizeSelected !== void 0 && qi(e.pointSizeSelected), e.pointSizeMouseDetection !== void 0 && _s(e.pointSizeMouseDetection), e.sizeBy !== void 0 && na(e.sizeBy), e.opacity !== void 0 && Zi(e.opacity), e.showPointConnections !== void 0 && os(e.showPointConnections), e.pointConnectionColor !== void 0 && cs(e.pointConnectionColor), e.pointConnectionColorActive !== void 0 && ls(e.pointConnectionColorActive), e.pointConnectionColorHover !== void 0 && us(e.pointConnectionColorHover), e.pointConnectionColorBy !== void 0 && ra(e.pointConnectionColorBy), e.pointConnectionOpacityBy !== void 0 && ia(e.pointConnectionOpacityBy), e.pointConnectionOpacity !== void 0 && ds(e.pointConnectionOpacity), e.pointConnectionOpacityActive !== void 0 && fs(e.pointConnectionOpacityActive), e.pointConnectionSize !== void 0 && ps(e.pointConnectionSize), e.pointConnectionSizeActive !== void 0 && ms(e.pointConnectionSizeActive), e.pointConnectionSizeBy !== void 0 && aa(e.pointConnectionSizeBy), e.pointConnectionMaxIntPointsPerSegment !== void 0 && hs(e.pointConnectionMaxIntPointsPerSegment), e.pointConnectionTolerance !== void 0 && gs(e.pointConnectionTolerance), e.opacityBy !== void 0 && ta(e.opacityBy), e.lassoColor !== void 0 && Bo(e.lassoColor), e.lassoLineWidth !== void 0 && Vo(e.lassoLineWidth), e.lassoMinDelay !== void 0 && Ho(e.lassoMinDelay), e.lassoMinDist !== void 0 && Uo(e.lassoMinDist), e.lassoClearEvent !== void 0 && Wo(e.lassoClearEvent), e.lassoInitiator !== void 0 && Go(e.lassoInitiator), e.lassoInitiatorParentElement !== void 0 && Ko(e.lassoInitiatorParentElement), e.lassoOnLongPress !== void 0 && qo(e.lassoOnLongPress), e.lassoLongPressTime !== void 0 && Jo(e.lassoLongPressTime), e.lassoLongPressAfterEffectTime !== void 0 && Yo(e.lassoLongPressAfterEffectTime), e.lassoLongPressEffectDelay !== void 0 && Xo(e.lassoLongPressEffectDelay), e.lassoLongPressRevertEffectTime !== void 0 && Zo(e.lassoLongPressRevertEffectTime), e.keyMap !== void 0 && Qo(e.keyMap), e.mouseMode !== void 0 && $o(e.mouseMode), e.showReticle !== void 0 && es(e.showReticle), e.reticleColor !== void 0 && ts(e.reticleColor), e.pointOutlineWidth !== void 0 && Ji(e.pointOutlineWidth), e.height !== void 0 && Wi(e.height), e.width !== void 0 && Xi(e.width), e.aspectRatio !== void 0 && Ii(e.aspectRatio), e.xScale !== void 0 && ns(e.xScale), e.yScale !== void 0 && rs(e.yScale), e.deselectOnDblClick !== void 0 && is(e.deselectOnDblClick), e.deselectOnEscape !== void 0 && as(e.deselectOnEscape), e.opacityByDensityFill !== void 0 && vs(e.opacityByDensityFill), e.opacityInactiveMax !== void 0 && ys(e.opacityInactiveMax), e.opacityInactiveScale !== void 0 && bs(e.opacityInactiveScale), e.gamma !== void 0 && xs(e.gamma), new Promise((e) => {
		window.requestAnimationFrame(() => {
			c && (Fi(), X.refresh(), a.refresh(), Q = !0, e());
		});
	})), ws = (e, { preventEvent: t = !1 } = {}) => {
		zo(e), Q = !0, ar = t;
	}, Ts = () => {
		X ||= ee(c, { isPanInverted: [!1, !0] }), e.cameraView ? X.setView(w(e.cameraView)) : e.cameraTarget || e.cameraDistance || e.cameraRotation ? X.lookAt([...e.cameraTarget || Wt], e.cameraDistance || Gt, e.cameraRotation || Kt) : X.setView(w(qt)), rr = ai(1, 1), ir = ai(-1, -1);
	}, Es = ({ preventEvent: e = !1 } = {}) => {
		Ts(), Hi(), !e && t.publish("view", {
			view: X.view,
			camera: X,
			xScale: Zr,
			yScale: $
		});
	}, Ds = ({ key: e }) => {
		e === "Escape" && d && _i();
	}, Os = () => {
		Xr = !0, Kr = !0;
	}, ks = () => {
		yi(), Xr = !1, Kr = !0, Q = !0;
	}, As = () => {
		Q = !0;
	}, js = () => {
		ro([]), Yn.clear();
	}, Ms = () => {
		X.refresh();
		let e = be === Ee, t = ve === Ee;
		if (e || t) {
			let { width: n, height: r } = c.getBoundingClientRect();
			e && Yi(n), t && Ui(r), Fi(), Q = !0;
		}
	}, Ns = () => c.getContext("2d").getImageData(0, 0, c.width, c.height), Ps = () => {
		Fi(), Ts(), Hi(), Jt = ne(a.regl, {
			color: f,
			width: p,
			is2d: !0
		}), Yn = ne(a.regl, {
			color: R,
			colorHover: B,
			colorActive: z,
			opacity: H === null ? null : H[0],
			width: W[0],
			widthActive: G,
			is2d: !0
		}), Qn = ne(a.regl, {
			color: M,
			width: 1,
			is2d: !0
		}), $n = ne(a.regl, {
			color: M,
			width: 1,
			is2d: !0
		}), Gi(), c.addEventListener("wheel", As), hr = a.regl.buffer(), gr = a.regl.buffer(), _r = a.regl.buffer({
			usage: "dynamic",
			type: "float",
			length: Me * 2
		}), Dr = Ni(), zr = ji();
		let e = Cs({
			backgroundImage: s,
			width: be,
			height: ve,
			keyMap: k
		});
		Mo(), No(), window.addEventListener("keyup", Ds, !1), window.addEventListener("blur", Ai, !1), window.addEventListener("mouseup", Ei, !1), window.addEventListener("mousemove", ki, !1), c.addEventListener("mousedown", Ti, !1), c.addEventListener("mouseenter", Os, !1), c.addEventListener("mouseleave", ks, !1), c.addEventListener("click", Di, !1), c.addEventListener("dblclick", Oi, !1), "ResizeObserver" in window ? (sr = new ResizeObserver(Ms), sr.observe(c)) : (window.addEventListener("resize", Ms), window.addEventListener("orientationchange", Ms)), e.then(() => {
			t.publish("init");
		});
	}, Fs = a.onFrame(() => {
		if (Wr = X.tick(), !Gr || !(Q || Sr)) return;
		Sr && !bo(wr, Tr) && xo(), Wr && (rr = ai(1, 1), ir = ai(-1, -1), pe === "density" && go()), a.render(() => {
			let e = c.width / a.canvas.width, t = c.height / a.canvas.height;
			Pi(e, t), s && s._reglType && Ya(), Nn.length > 2 && Xa(), Sr || Yn.draw({
				projection: xa(),
				model: Ca(),
				view: Sa()
			}), Ua(), !cn && (j || or) && Za(), Yr >= 0 && Wa(), Z.length && Ja(), Jt.draw({
				projection: xa(),
				model: Ca(),
				view: Sa()
			});
		}, c);
		let e = {
			view: X.view,
			camera: X,
			xScale: Zr,
			yScale: $
		};
		Wr && (Hi(), ar ? ar = !1 : t.publish("view", e)), Q = !1, or = !1, t.publish("drawing", e, { async: !1 }), t.publish("draw", e);
	});
	return Ps(), {
		get isSupported() {
			return a.isSupported;
		},
		clear: wo(js),
		createTextureFromUrl: (e, t = un) => Cn(a.regl, e, t),
		deselect: _i,
		destroy: () => {
			Gr = !1, Pe = !0, Fs(), window.removeEventListener("keyup", Ds, !1), window.removeEventListener("blur", Ai, !1), window.removeEventListener("mouseup", Ei, !1), window.removeEventListener("mousemove", ki, !1), c.removeEventListener("mousedown", Ti, !1), c.removeEventListener("mouseenter", Os, !1), c.removeEventListener("mouseleave", ks, !1), c.removeEventListener("click", Di, !1), c.removeEventListener("dblclick", Oi, !1), c.removeEventListener("wheel", As, !1), sr ? sr.disconnect() : (window.removeEventListener("resize", Ms), window.removeEventListener("orientationchange", Ms)), c = void 0, X.dispose(), X = void 0, Jt.destroy(), xi.destroy(), Yn.destroy(), Qn.destroy(), $n.destroy(), !e.renderer && !a.isDestroyed && a.destroy(), t.publish("destroy"), t.clear();
		},
		draw: Co,
		filter: mo,
		get: Ss,
		getScreenPosition: Ao,
		hover: yi,
		redraw: () => {
			Q = !0;
		},
		refresh: a.refresh,
		reset: wo(Es),
		select: vi,
		set: Cs,
		export: Ns,
		subscribe: t.subscribe,
		unfilter: po,
		unsubscribe: t.unsubscribe,
		view: ws,
		zoomToLocation: Oo,
		zoomToArea: Eo,
		zoomToPoints: Do,
		zoomToOrigin: ko
	};
}, Wr = Ur;
//#endregion
export { Ur as createScatterplot, Wr as default };
