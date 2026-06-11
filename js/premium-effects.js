(function (window, document) {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.innerWidth < 768;
    var isVisible = true;
    var mouse = { x: 0, y: 0 };

    document.addEventListener('visibilitychange', function () {
        isVisible = !document.hidden;
    });

    document.addEventListener('mousemove', function (e) {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* ── Minimal mat4 helpers (no library) ── */
    var Mat4 = {
        create: function () {
            return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
        },
        perspective: function (out, fovy, aspect, near, far) {
            var f = 1 / Math.tan(fovy / 2);
            out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
            out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
            out[8] = 0; out[9] = 0; out[11] = -1; out[12] = 0; out[13] = 0;
            out[10] = (far + near) / (near - far);
            out[14] = (2 * far * near) / (near - far);
            out[15] = 0;
            return out;
        },
        multiply: function (out, a, b) {
            var a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7];
            var a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
            var b0=b[0],b1=b[1],b2=b[2],b3=b[3],b4=b[4],b5=b[5],b6=b[6],b7=b[7];
            var b8=b[8],b9=b[9],b10=b[10],b11=b[11],b12=b[12],b13=b[13],b14=b[14],b15=b[15];
            out[0]=a00*b0+a10*b1+a20*b2+a30*b3; out[1]=a01*b0+a11*b1+a21*b2+a31*b3;
            out[2]=a02*b0+a12*b1+a22*b2+a32*b3; out[3]=a03*b0+a13*b1+a23*b2+a33*b3;
            out[4]=a00*b4+a10*b5+a20*b6+a30*b7; out[5]=a01*b4+a11*b5+a21*b6+a31*b7;
            out[6]=a02*b4+a12*b5+a22*b6+a32*b7; out[7]=a03*b4+a13*b5+a23*b6+a33*b7;
            out[8]=a00*b8+a10*b9+a20*b10+a30*b11; out[9]=a01*b8+a11*b9+a21*b10+a31*b11;
            out[10]=a02*b8+a12*b9+a22*b10+a32*b11; out[11]=a03*b8+a13*b9+a23*b10+a33*b11;
            out[12]=a00*b12+a10*b13+a20*b14+a30*b15; out[13]=a01*b12+a11*b13+a21*b14+a31*b15;
            out[14]=a02*b12+a12*b13+a22*b14+a32*b15; out[15]=a03*b12+a13*b13+a23*b14+a33*b15;
            return out;
        },
        rotateY: function (out, rad) {
            var s = Math.sin(rad), c = Math.cos(rad);
            var a = Mat4.create();
            a[0]=c; a[2]=s; a[8]=-s; a[10]=c;
            return Mat4.multiply(out, out, a);
        },
        rotateX: function (out, rad) {
            var s = Math.sin(rad), c = Math.cos(rad);
            var a = Mat4.create();
            a[5]=c; a[6]=-s; a[9]=s; a[10]=c;
            return Mat4.multiply(out, out, a);
        },
        translate: function (out, x, y, z) {
            out[12] += out[0]*x + out[4]*y + out[8]*z;
            out[13] += out[1]*x + out[5]*y + out[9]*z;
            out[14] += out[2]*x + out[6]*y + out[10]*z;
            return out;
        }
    };

    /* ── WebGL wireframe mesh (Three.js-style, zero deps) ── */
    function initWebGLMesh() {
        var canvas = document.getElementById('webgl-canvas');
        if (!canvas || prefersReducedMotion || isMobile) return;

        var gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
        if (!gl) return;

        var vsSource = [
            'attribute vec3 aPos;',
            'uniform mat4 uMVP;',
            'void main(){ gl_Position = uMVP * vec4(aPos, 1.0); }'
        ].join('');

        var fsSource = [
            'precision mediump float;',
            'uniform vec4 uColor;',
            'void main(){ gl_FragColor = uColor; }'
        ].join('');

        function compile(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }

        var prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        var aPos = gl.getAttribLocation(prog, 'aPos');
        var uMVP = gl.getUniformLocation(prog, 'uMVP');
        var uColor = gl.getUniformLocation(prog, 'uColor');

        /* Icosahedron wireframe */
        var t = (1 + Math.sqrt(5)) / 2;
        var verts = [
            -1,t,0, 1,t,0, -1,-t,0, 1,-t,0,
            0,-1,t, 0,1,t, 0,-1,-t, 0,1,-t,
            t,0,-1, t,0,1, -t,0,-1, -t,0,1
        ];
        for (var i = 0; i < verts.length; i++) verts[i] *= 1.1;

        var edges = [
            0,1, 0,5, 0,7, 0,10, 0,11, 1,5, 1,7, 1,8, 1,9,
            2,3, 2,4, 2,6, 2,10, 2,11, 3,4, 3,6, 3,8, 3,9,
            4,5, 4,9, 4,11, 5,9, 5,10, 6,7, 6,8, 6,10,
            7,8, 7,11, 8,9, 10,11
        ];

        var lineVerts = [];
        for (var j = 0; j < edges.length; j += 2) {
            var a = edges[j] * 3, b = edges[j + 1] * 3;
            lineVerts.push(verts[a], verts[a+1], verts[a+2], verts[b], verts[b+1], verts[b+2]);
        }

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVerts), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        var proj = Mat4.create();
        var view = Mat4.create();
        var model = Mat4.create();
        var mvp = Mat4.create();
        var time = 0;
        var lineCount = lineVerts.length / 3;

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            gl.viewport(0, 0, canvas.width, canvas.height);
            Mat4.perspective(proj, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
        }

        function drawMesh() {
            if (!isVisible) {
                requestAnimationFrame(drawMesh);
                return;
            }

            time += 0.006;
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            model = Mat4.create();
            Mat4.translate(model, 2.8, 0.2, -6);
            Mat4.rotateY(model, time * 0.4 + mouse.x * 0.35);
            Mat4.rotateX(model, time * 0.25 + mouse.y * 0.25);

            view = Mat4.create();
            Mat4.multiply(mvp, proj, view);
            Mat4.multiply(mvp, mvp, model);

            gl.uniformMatrix4fv(uMVP, false, mvp);
            gl.uniform4f(uColor, 0.55, 0.58, 1.0, 0.22);
            gl.lineWidth(1);
            gl.drawArrays(gl.LINES, 0, lineCount);

            /* Second ring */
            model = Mat4.create();
            Mat4.translate(model, -3.0, -0.8, -7);
            Mat4.rotateX(model, Math.PI / 2 + time * 0.15);
            Mat4.rotateY(model, time * 0.5);
            Mat4.multiply(mvp, proj, view);
            Mat4.multiply(mvp, mvp, model);
            gl.uniformMatrix4fv(uMVP, false, mvp);
            gl.uniform4f(uColor, 0.66, 0.33, 0.97, 0.14);

            var ring = [];
            var segments = 48, radius = 1.6;
            for (var k = 0; k < segments; k++) {
                var a1 = (k / segments) * Math.PI * 2;
                var a2 = ((k + 1) / segments) * Math.PI * 2;
                ring.push(Math.cos(a1)*radius, Math.sin(a1)*radius, 0, Math.cos(a2)*radius, Math.sin(a2)*radius, 0);
            }
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ring), gl.DYNAMIC_DRAW);
            gl.drawArrays(gl.LINES, 0, ring.length / 3);

            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVerts), gl.STATIC_DRAW);

            requestAnimationFrame(drawMesh);
        }

        window.addEventListener('resize', resize);
        resize();
        drawMesh();
    }

    /* ── 3D depth particle field (canvas, lightweight) ── */
    function initDepthParticles() {
        var canvas = document.getElementById('particle-canvas');
        if (!canvas || prefersReducedMotion) return;

        var ctx = canvas.getContext('2d');
        var particles = [];
        var count = isMobile ? 28 : Math.min(55, Math.floor(window.innerWidth / 22));
        var focal = 320;
        var connectionDist = isMobile ? 0 : 90;

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function createParticle() {
            return {
                x: (Math.random() - 0.5) * window.innerWidth,
                y: (Math.random() - 0.5) * window.innerHeight,
                z: Math.random() * 400 - 200,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                vz: (Math.random() - 0.5) * 0.3
            };
        }

        function project(p) {
            var scale = focal / (focal + p.z);
            return {
                sx: p.x * scale + window.innerWidth / 2,
                sy: p.y * scale + window.innerHeight / 2,
                scale: scale,
                z: p.z
            };
        }

        function init() {
            resize();
            particles = [];
            for (var i = 0; i < count; i++) particles.push(createParticle());
        }

        function draw() {
            if (!isVisible) {
                requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            var projected = [];
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx + mouse.x * 0.15;
                p.y += p.vy + mouse.y * 0.1;
                p.z += p.vz;

                if (p.x < -window.innerWidth * 0.6) p.x = window.innerWidth * 0.6;
                if (p.x > window.innerWidth * 0.6) p.x = -window.innerWidth * 0.6;
                if (p.y < -window.innerHeight * 0.6) p.y = window.innerHeight * 0.6;
                if (p.y > window.innerHeight * 0.6) p.y = -window.innerHeight * 0.6;
                if (p.z < -250) p.z = 250;
                if (p.z > 250) p.z = -250;

                projected.push({ p: p, pr: project(p) });
            }

            projected.sort(function (a, b) { return a.pr.z - b.pr.z; });

            if (connectionDist > 0) {
                for (var a = 0; a < projected.length; a++) {
                    for (var b = a + 1; b < projected.length; b++) {
                        var pa = projected[a].pr, pb = projected[b].pr;
                        var dx = pa.sx - pb.sx, dy = pa.sy - pb.sy;
                        var d = Math.sqrt(dx * dx + dy * dy);
                        if (d < connectionDist) {
                            var alpha = 0.1 * (1 - d / connectionDist) * ((pa.scale + pb.scale) / 2);
                            ctx.beginPath();
                            ctx.moveTo(pa.sx, pa.sy);
                            ctx.lineTo(pb.sx, pb.sy);
                            ctx.strokeStyle = 'rgba(129, 140, 248, ' + alpha + ')';
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
            }

            for (var k = 0; k < projected.length; k++) {
                var pr = projected[k].pr;
                var r = (1.2 + pr.scale * 2.2);
                var alpha = 0.25 + pr.scale * 0.45;
                ctx.beginPath();
                ctx.arc(pr.sx, pr.sy, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(165, 180, 252, ' + alpha + ')';
                ctx.fill();
            }

            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', init);
        init();
        draw();
    }

    /* ── Hero 3D tilt ── */
    function initHeroTilt() {
        if (prefersReducedMotion || isMobile) return;
        var frame = document.querySelector('.hero-image-frame');
        if (!frame) return;

        frame.addEventListener('mousemove', function (e) {
            var rect = frame.getBoundingClientRect();
            var x = (e.clientX - rect.left) / rect.width - 0.5;
            var y = (e.clientY - rect.top) / rect.height - 0.5;
            frame.style.transform = 'perspective(900px) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 14) + 'deg)';
        });

        frame.addEventListener('mouseleave', function () {
            frame.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
        });
    }

    /* ── Scroll reveal for cards ── */
    function initReveal() {
        if (prefersReducedMotion) return;
        var targets = document.querySelectorAll('.glass-card, .services-list .item, .cert-card, .portfolio-item, .testimonials-section .item');
        if (!targets.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        targets.forEach(function (el, i) {
            el.classList.add('reveal-3d');
            el.style.transitionDelay = (i % 4) * 80 + 'ms';
            observer.observe(el);
        });
    }

    /* ── Skill tag stagger ── */
    function initSkillStagger() {
        var grid = document.querySelector('.skills-grid');
        if (!grid || prefersReducedMotion) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('skills-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        observer.observe(grid);
    }

    /* ── Orb parallax ── */
    function initOrbParallax() {
        if (prefersReducedMotion) return;
        var orbs = document.querySelectorAll('.orb');
        if (!orbs.length) return;

        function tick() {
            if (!isVisible) {
                requestAnimationFrame(tick);
                return;
            }
            orbs.forEach(function (orb, i) {
                var factor = (i + 1) * 14;
                orb.style.transform = 'translate(' + (mouse.x * factor) + 'px, ' + (mouse.y * factor) + 'px)';
            });
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    /* ── Per-slide lightweight entrance animations ── */
    var activeSlide = null;

    function initSlideMotion() {
        if (prefersReducedMotion) return;

        var sections = document.querySelectorAll('.fullpage-default .section');
        sections.forEach(function (section) {
            var title = section.querySelector('.title-block');
            if (title) title.classList.add('anim-on-slide');

            section.querySelectorAll('.about-img').forEach(function (el) {
                el.classList.add('anim-on-slide', 'anim-scale');
            });

            section.querySelectorAll('.hero-summary, .hero-stats, .hero-actions').forEach(function (el, i) {
                el.classList.add('anim-on-slide');
                el.style.setProperty('--anim-delay', (i * 0.09) + 's');
            });

            section.querySelectorAll('.hero-image-frame').forEach(function (el) {
                el.classList.add('anim-on-slide', 'anim-scale');
                el.style.setProperty('--anim-delay', '0.3s');
            });

            section.querySelectorAll('.timeline li').forEach(function (li, i) {
                li.classList.add('anim-on-slide', i % 2 === 0 ? 'anim-from-left' : 'anim-from-right');
                li.style.setProperty('--anim-delay', (i * 0.1) + 's');
            });

            section.querySelectorAll('.contact-row').forEach(function (row, i) {
                row.classList.add('anim-on-slide', 'anim-from-left');
                row.style.setProperty('--anim-delay', (i * 0.07) + 's');
            });

            section.querySelectorAll('.skills-grid, .cert-grid, .services-section, .gallery-section, .testimonials-section').forEach(function (el) {
                el.classList.add('anim-on-slide', 'anim-fade');
                el.style.setProperty('--anim-delay', '0.15s');
            });

            section.querySelectorAll('.facts-list').forEach(function (el) {
                el.classList.add('anim-on-slide', 'anim-fade');
                el.style.setProperty('--anim-delay', '0.2s');
            });

            section.querySelectorAll('.about-contentbox > .animate').forEach(function (el, i) {
                el.classList.add('anim-on-slide');
                el.style.setProperty('--anim-delay', (i * 0.1) + 's');
            });
        });
    }

    function runCounters(section) {
        if (!section || section.getAttribute('data-section') !== 'slide02') return;
        section.querySelectorAll('.count-number').forEach(function (el) {
            if (el.dataset.counted) return;
            el.dataset.counted = '1';
            var target = parseInt(el.textContent, 10);
            if (isNaN(target)) return;
            var current = 0;
            var step = Math.max(1, Math.ceil(target / 30));
            var timer = setInterval(function () {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = current;
            }, 30);
        });
    }

    function activateSlide(section) {
        if (!section || prefersReducedMotion) return;
        if (activeSlide) activeSlide.classList.remove('slide-is-active');
        activeSlide = section;
        section.classList.remove('slide-is-active');
        void section.offsetWidth;
        section.classList.add('slide-is-active');
        runCounters(section);
    }

    window.PortfolioMotion = {
        activateSlide: activateSlide
    };

    document.addEventListener('DOMContentLoaded', function () {
        initWebGLMesh();
        initDepthParticles();
        initHeroTilt();
        initReveal();
        initSkillStagger();
        initOrbParallax();
        initSlideMotion();
    });
})(window, document);
