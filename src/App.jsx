import { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import Lenis from "lenis";
import { Volume2, VolumeX, ArrowDown, RotateCw, MessageCircle } from "lucide-react";
import * as THREE from "three";

/* ============================================================================
   THE MONGOLS — reconstrução em React-Three-Fiber de mongols.peachworlds.com
   Arquitetura (igual ao Peach Worlds): <Canvas> fixo no fundo + overlay HTML
   rolável na frente. O scroll nativo (suavizado por Lenis) dirige a câmera 3D.
   Cada token de cor/tipografia veio da extração do site original.
   ========================================================================== */

const EASE = [0.16, 1, 0.3, 1]; // cubic-bezier padrão de fluidez (toda a página)

// Conteúdo narrativo da Ambition — parceiro de crescimento (hero + 6 painéis).
const SECTIONS = [
  { id: "hero", kicker: "Performance & Vendas" },
  {
    id: "quem-somos",
    kicker: "Quem Somos",
    title: "Parceiro de Crescimento",
    body: "A Ambition une consultoria, marketing e implementação comercial para fazer negócios crescerem de forma estruturada e previsível. Mais do que gerar leads, construímos toda a jornada — da atração à conversão — transformando empresas que dependem do improviso em operações prontas para escalar.",
  },
  {
    id: "performance",
    kicker: "01 — Marketing de Performance",
    title: "Demanda Qualificada",
    body: "Planejamento, execução e otimização contínua de campanhas em Meta e Google Ads. Estratégias de aquisição, remarketing e escala que geram não apenas alcance, mas demanda real e pronta para o seu time vender.",
  },
  {
    id: "comercial",
    kicker: "02 — Estrutura Comercial",
    title: "Vendas sob Controle",
    body: "Organizamos o processo comercial para aumentar a conversão e reduzir perdas ao longo do funil: CRM implementado, pipelines, scripts de atendimento, follow-up e indicadores claros. Cada oportunidade acompanhada do primeiro contato ao fechamento.",
  },
  {
    id: "ia-automacoes",
    kicker: "03 — Inteligência Artificial",
    title: "Automação e Agentes de IA",
    body: "Agentes de IA no atendimento, automação de WhatsApp e fluxos com n8n integrando seus sistemas. Qualificação automática de leads e recuperação de oportunidades, em um atendimento híbrido entre inteligência artificial e equipe humana — menos operacional, mais produtividade.",
  },
  {
    id: "conversao",
    kicker: "04 — Ativos de Conversão",
    title: "Páginas que Convertem",
    body: "Landing pages de alta conversão, sites institucionais e páginas de pré-venda com copywriting estratégico e desenvolvimento orientado a performance. Estruturas digitais integradas ao CRM e às automações, feitas para transformar visitantes em clientes.",
  },
  {
    id: "consultoria",
    kicker: "05 — Consultoria Estratégica",
    title: "Mapa de Crescimento",
    body: "Diagnóstico, planejamento, implementação e otimização contínua: analisamos o cenário atual e construímos um plano de crescimento claro e executável. Visão integrada entre marketing e vendas, orientada por dados, com a Ambition lado a lado como parceira estratégica.",
  },
];

/* ----------------------------------------------------------------------------
   3D — Câmera dirigida por scroll
   Keyframes interpolados pelo progresso global (0..1) vindo do Lenis.
-------------------------------------------------------------------------------*/
const CAM_KEYS = [
  { pos: [0, 1.6, 9.5], look: [0, 0.4, 0] }, // 0 hero — estabelece
  { pos: [-4.5, 1.0, 6.5], look: [0, 0.2, 0] }, // 1 orbita esquerda
  { pos: [3.8, -0.6, 5.0], look: [0, 0.0, 0] }, // 2 ângulo baixo
  { pos: [4.6, 2.2, 5.5], look: [0, 0.6, 0] }, // 3 orbita direita alta
  { pos: [0, 4.6, 6.0], look: [0, 0.0, 0] }, // 4 mergulho de cima
  { pos: [-2.4, 0.4, 3.6], look: [0, 0.3, 0] }, // 5 detalhe próximo
  { pos: [0, 1.4, 11], look: [0, 0.4, 0] }, // 6 afasta (outro)
];

function lerpKey(a, b, t) {
  const out = { pos: [], look: [] };
  for (let i = 0; i < 3; i++) {
    out.pos[i] = THREE.MathUtils.lerp(a.pos[i], b.pos[i], t);
    out.look[i] = THREE.MathUtils.lerp(a.look[i], b.look[i], t);
  }
  return out;
}

function CameraRig({ scrollRef }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0.4, 0), []);

  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(scrollRef.current, 0, 1);
    const seg = p * (CAM_KEYS.length - 1);
    const i = Math.min(Math.floor(seg), CAM_KEYS.length - 2);
    const k = lerpKey(CAM_KEYS[i], CAM_KEYS[i + 1], seg - i);

    // amortecimento exponencial → sensação easeInOut premium
    const s = 1 - Math.exp(-4 * delta);
    camera.position.x += (k.pos[0] - camera.position.x) * s;
    camera.position.y += (k.pos[1] - camera.position.y) * s;
    camera.position.z += (k.pos[2] - camera.position.z) * s;
    target.x += (k.look[0] - target.x) * s;
    target.y += (k.look[1] - target.y) * s;
    target.z += (k.look[2] - target.z) * s;
    camera.lookAt(target);
  });
  return null;
}

/* ----------------------------------------------------------------------------
   3D — Monumento (PLACEHOLDER)
   Troque este bloco por:  const { scene } = useGLTF('/warriors-statue.glb')
   e renderize <primitive object={scene} /> para usar a estátua real.
-------------------------------------------------------------------------------*/
function Monument() {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return (
    <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={ref} position={[0, 0.2, 0]}>
        {/* corpo escultural facetado, bronze escuro metálico */}
        <mesh castShadow>
          <icosahedronGeometry args={[1.7, 1]} />
          <meshStandardMaterial
            color="#1c140d"
            metalness={1}
            roughness={0.28}
            emissive="#ff6400"
            emissiveIntensity={0.12}
            envMapIntensity={1.6}
            flatShading
          />
        </mesh>
        {/* núcleo interno (brilho de brasa) */}
        <mesh scale={0.55}>
          <icosahedronGeometry args={[1.7, 0]} />
          <meshStandardMaterial
            color="#ff6400"
            emissive="#ff6400"
            emissiveIntensity={1.4}
            roughness={0.6}
          />
        </mesh>
        {/* pedestal */}
        <mesh position={[0, -2.3, 0]}>
          <cylinderGeometry args={[2.1, 2.4, 0.5, 64]} />
          <meshStandardMaterial color="#0d0a10" metalness={0.9} roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

/* 3D — Poeira/brasas flutuantes */
function Embers({ count = 900 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 7;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.02;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#ff8a3d"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* 3D — Cena completa */
function Scene({ scrollRef }) {
  return (
    <>
      <color attach="background" args={["#06040a"]} />
      <fog attach="fog" args={["#06040a", 9, 22]} />

      {/* luz-chave laranja (rim light do original) + preenchimento azul frio */}
      <ambientLight intensity={0.15} />
      <spotLight
        position={[6, 4, 4]}
        angle={0.6}
        penumbra={1}
        intensity={120}
        color="#ff6400"
        distance={30}
      />
      <pointLight position={[-6, 1, -3]} intensity={40} color="#4b71f7" />
      <pointLight position={[0, -4, 4]} intensity={12} color="#fff2df" />

      <Suspense fallback={null}>
        <Monument />
        <Embers />
        {/* HDR procedural (sem baixar .exr) → reflexos metálicos */}
        <Environment resolution={256}>
          <Lightformer intensity={3} color="#ff6400" position={[5, 2, 1]} scale={[12, 12, 1]} />
          <Lightformer intensity={1.4} color="#4b71f7" position={[-6, 1, -2]} scale={[12, 12, 1]} />
          <Lightformer intensity={0.7} color="#fff2df" position={[0, 6, 3]} scale={[12, 4, 1]} />
        </Environment>
      </Suspense>

      <CameraRig scrollRef={scrollRef} />
    </>
  );
}

/* ----------------------------------------------------------------------------
   OVERLAY — Painéis HTML com fade in/out sincronizado (effectA/effectB fade)
-------------------------------------------------------------------------------*/
function Hero() {
  return (
    <section
      data-anchor
      id="hero"
      className="relative flex h-screen flex-col items-center justify-center px-6 text-center"
    >
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.6 }}
        transition={{ duration: 1.3, ease: EASE }}
        className="font-display leading-[0.82] text-cream"
      >
        <span className="block text-[17vw] font-medium tracking-tight md:text-[13vw] lg:text-[10rem]">
          AMBITION
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.6 }}
        transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        className="mt-4 font-display text-lg italic text-cream/80 md:text-2xl"
      >
        Gestão de Performance
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3], y: [0, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 flex flex-col items-center gap-2 text-cream/60"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to enter</span>
        <ArrowDown size={16} />
      </motion.div>
    </section>
  );
}

function Panel({ section, index }) {
  const alignRight = index % 2 === 0;
  return (
    <section
      data-anchor
      id={section.id}
      className={`relative flex h-screen items-center px-6 md:px-16 ${
        alignRight ? "justify-end" : "justify-start"
      }`}
    >
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.55, margin: "-8% 0px -8% 0px" }}
        transition={{ staggerChildren: 0.12 }}
        className={`flex max-w-2xl items-stretch gap-6 ${
          alignRight ? "flex-row-reverse text-right" : "flex-row text-left"
        }`}
      >
        {/* Barra vertical com marcador — surge "desenhando" junto com o texto.
            A linha escala em scaleY (origin-top); o triângulo é irmão para
            não ser esticado pela animação. Espelha de lado conforme o alinhamento. */}
        <div className="relative w-px shrink-0 self-stretch">
          <motion.div
            variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1 } }}
            transition={{ duration: 1, ease: EASE }}
            className="absolute inset-0 origin-top bg-cream/25"
          />
          <motion.span
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
            className={`absolute top-7 h-0 w-0 border-y-[5px] border-y-transparent ${
              alignRight
                ? "right-0 border-r-[7px] border-r-cream/80"
                : "left-0 border-l-[7px] border-l-cream/80"
            }`}
          />
        </div>

        {/* Texto */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 50 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 1.1, ease: EASE }}
        >
          <span className="mb-4 block font-sans text-xs uppercase tracking-[0.35em] text-ember">
            {section.kicker}
          </span>
          <h2 className="mb-5 font-display text-5xl font-medium leading-[0.95] text-cream md:text-7xl">
            {section.title}
          </h2>
          <p className="max-w-xl font-sans text-base leading-relaxed text-cream/75 md:text-lg">
            {section.body}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Outro() {
  return (
    <section
      data-anchor
      id="end"
      className="relative flex h-screen flex-col items-center justify-center gap-6 px-6 text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ amount: 0.6 }}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <p className="mb-3 font-sans text-xs uppercase tracking-[0.35em] text-ember">
          Vamos crescer juntos
        </p>
        <h2 className="font-display text-6xl font-medium text-cream md:text-8xl">AMBITION</h2>
        <p className="mx-auto mt-5 max-w-xl font-display text-xl italic text-cream/75 md:text-2xl">
          Vamos construir o próximo estágio de crescimento da sua empresa.
        </p>
      </motion.div>

      <motion.a
        href="https://wa.me/5511987654321?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20a%20Ambition."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Entrar em contato pelo WhatsApp"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.6 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-ember px-9 py-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-void transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(255,100,0,0.45)]"
      >
        <MessageCircle size={18} />
        Entrar em contato
      </motion.a>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   UI — Navbar, dots de progresso, áudio, véu de carregamento
-------------------------------------------------------------------------------*/
function useActiveSection() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-anchor]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(els.indexOf(e.target));
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

function Navbar({ lenis }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = (id) => lenis.current?.scrollTo(`#${id}`, { duration: 1.4 });
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-500 md:px-10 ${
        solid ? "bg-void/70 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <button
        onClick={() => go("hero")}
        className="font-display text-lg tracking-[0.25em] text-cream"
      >
        AMBITION
      </button>
    </header>
  );
}

function ProgressDots({ active, lenis }) {
  const ids = ["hero", ...SECTIONS.slice(1).map((s) => s.id), "end"];
  return (
    <div className="fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-3 md:flex">
      {ids.map((id, i) => (
        <button
          key={id}
          aria-label={`Go to section ${i + 1}`}
          onClick={() => lenis.current?.scrollTo(`#${id}`, { duration: 1.4 })}
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            active === i ? "scale-150 bg-ember" : "bg-cream/30 hover:bg-cream/60"
          }`}
        />
      ))}
    </div>
  );
}

function AudioToggle() {
  const audioRef = useRef(null);
  const [on, setOn] = useState(false);
  // Coloque um arquivo de trilha em /public/ambient.mp3 para ativar o áudio.
  const SRC = "/ambient.mp3";
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (on) {
      a.pause();
      setOn(false);
    } else {
      a.play().then(() => setOn(true)).catch(() => setOn(false));
    }
  };
  return (
    <>
      <audio ref={audioRef} src={SRC} loop preload="auto" />
      <button
        onClick={toggle}
        aria-label={on ? "Mute soundtrack" : "Play soundtrack"}
        className="fixed bottom-6 left-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-cream/20 bg-void/50 text-cream backdrop-blur-md transition-colors hover:border-ember hover:text-ember"
      >
        {on ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
    </>
  );
}

function LoadingVeil() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="text-ember"
          >
            <RotateCw size={26} />
          </motion.div>
          <p className="mt-6 font-display text-xl italic text-cream/80">
            Inteligência e escala, carregando…
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ----------------------------------------------------------------------------
   APP
-------------------------------------------------------------------------------*/
export default function App() {
  const scrollRef = useRef(0); // progresso global 0..1 lido pela câmera 3D
  const lenis = useRef(null);
  const active = useActiveSection();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const l = new Lenis({ duration: 1.2, smoothWheel: !reduce, lerp: 0.1 });
    lenis.current = l;
    l.on("scroll", (e) => {
      scrollRef.current = e.progress ?? 0;
    });
    let raf;
    const loop = (t) => {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
    };
  }, []);

  return (
    <div className="relative w-full bg-void">
      <LoadingVeil />

      {/* CAMADA 3D — fixa no fundo */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 1.6, 9.5], fov: 42 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.8]}
        >
          <Scene scrollRef={scrollRef} />
        </Canvas>
        {/* vinheta cinematográfica por cima do canvas */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#06040a_95%)]" />
      </div>

      {/* CAMADA HTML — conteúdo rolável na frente */}
      <div className="relative z-10">
        <Navbar lenis={lenis} />
        <ProgressDots active={active} lenis={lenis} />
        <AudioToggle />

        <Hero />
        {SECTIONS.slice(1).map((s, i) => (
          <Panel key={s.id} section={s} index={i} />
        ))}
        <Outro />
      </div>
    </div>
  );
}
