import { useRef, useEffect, useState, useMemo, Suspense, lazy } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import SplineLoader from "@splinetool/loader";
import { motion, AnimatePresence } from "motion/react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Volume2, VolumeX, ArrowDown, RotateCw, MessageCircle, ChevronRight, X } from "lucide-react";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

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
    body: "A Ambition une consultoria, marketing e implementação comercial para fazer negócios crescerem de forma estruturada e previsível. Mais do que gerar leads, construímos toda a jornada — da atração à conversão — transformando empresas que dependem do improviso em operações prontas para escalar. Atuamos lado a lado com cada cliente, integrando estratégia, tecnologia e execução em um único processo, para que o crescimento deixe de ser sorte e passe a ser método.",
  },
  {
    id: "performance",
    kicker: "01 — Marketing de Performance",
    title: "Demanda Qualificada",
    body: "Planejamento, execução e otimização contínua de campanhas em Meta e Google Ads. Estratégias de aquisição, remarketing e escala que geram não apenas alcance, mas demanda real e pronta para o seu time vender. Acompanhamos cada métrica de perto — CPL, CPA, ROAS — ajustando criativos, públicos e orçamento em tempo real para que cada real investido volte em oportunidade qualificada.",
  },
  {
    id: "comercial",
    kicker: "02 — Estrutura Comercial",
    title: "Vendas sob Controle",
    body: "Organizamos o processo comercial para aumentar a conversão e reduzir perdas ao longo do funil: CRM implementado, pipelines, scripts de atendimento, follow-up e indicadores claros. Cada oportunidade acompanhada do primeiro contato ao fechamento. Treinamos o time, definimos cadências de contato e criamos painéis de gestão que mostram, em tempo real, onde estão os gargalos e quais ações destravam mais receita.",
  },
  {
    id: "ia-automacoes",
    kicker: "03 — Inteligência Artificial",
    title: "Automação e Agentes de IA",
    body: "Agentes de IA no atendimento, automação de WhatsApp e fluxos com n8n integrando seus sistemas. Qualificação automática de leads e recuperação de oportunidades, em um atendimento híbrido entre inteligência artificial e equipe humana — menos operacional, mais produtividade. Respostas em segundos a qualquer hora, agendamentos automáticos e disparos inteligentes que reativam contatos parados, liberando seu time para focar no que realmente exige toque humano: fechar negócios.",
  },
  {
    id: "conversao",
    kicker: "04 — Ativos de Conversão",
    title: "Páginas que Convertem",
    body: "Landing pages de alta conversão, sites institucionais e páginas de pré-venda com copywriting estratégico e desenvolvimento orientado a performance. Estruturas digitais integradas ao CRM e às automações, feitas para transformar visitantes em clientes. Cada página é construída com base em dados e testes A/B, com carregamento rápido, design responsivo e uma jornada pensada para conduzir o visitante, passo a passo, até a ação que importa.",
  },
  {
    id: "consultoria",
    kicker: "05 — Consultoria Estratégica",
    title: "Mapa de Crescimento",
    body: "Diagnóstico, planejamento, implementação e otimização contínua: analisamos o cenário atual e construímos um plano de crescimento claro e executável. Visão integrada entre marketing e vendas, orientada por dados, com a Ambition lado a lado como parceira estratégica. Definimos metas, prioridades e indicadores de acompanhamento, revisamos os resultados periodicamente e ajustamos a rota sempre que o mercado pedir — para que cada decisão seja sustentada por números, e não por achismo.",
  },
];

// Conteúdo aprofundado de cada seção (abre no card "Saiba mais"). img = seed da
// imagem (Unsplash grayscale); more = parágrafos extras.
const DETAILS = {
  "quem-somos": {
    img: "ambition-quem-somos",
    more: [
      "A Ambition nasceu para resolver um problema comum: empresas que investem em marketing mas não veem o retorno virar venda. Unimos estratégia, tecnologia e execução em um único processo, eliminando o improviso.",
      "Atuamos como uma extensão do seu time — do planejamento à implementação — alinhando marketing e comercial em torno de metas claras e indicadores que mostram, em números, o crescimento acontecendo.",
    ],
  },
  performance: {
    img: "ambition-performance",
    more: [
      "Construímos máquinas de aquisição em Meta e Google Ads: estrutura de campanhas, públicos, criativos e páginas testadas continuamente para reduzir o custo por lead e elevar a qualidade.",
      "Cada real é acompanhado por CPL, CPA e ROAS. Otimizamos em tempo real, cortamos o que não performa e escalamos o que gera demanda pronta para o seu time vender.",
    ],
  },
  comercial: {
    img: "ambition-comercial",
    more: [
      "Organizamos o funil comercial de ponta a ponta: CRM implementado, pipelines, cadências de follow-up, scripts e indicadores. Nenhuma oportunidade se perde por falta de processo.",
      "Treinamos o time e criamos painéis de gestão que revelam os gargalos e mostram onde agir para aumentar a conversão — do primeiro contato ao fechamento.",
    ],
  },
  "ia-automacoes": {
    img: "ambition-ia",
    more: [
      "Implementamos agentes de IA e automações com n8n integrando WhatsApp, CRM e seus sistemas. Qualificação automática, respostas em segundos e recuperação de contatos parados, 24 horas por dia.",
      "O atendimento fica híbrido: a IA cuida da triagem e do operacional; o time humano foca no que exige sensibilidade e fechamento. Menos custo, mais produtividade.",
    ],
  },
  conversao: {
    img: "ambition-conversao",
    more: [
      "Criamos landing pages, sites e páginas de pré-venda com copy estratégico e desenvolvimento orientado a performance — rápidas, responsivas e integradas ao CRM e às automações.",
      "Cada página é guiada por dados e testes A/B, com uma jornada pensada para conduzir o visitante, passo a passo, até a ação que importa: comprar, agendar ou falar com vendas.",
    ],
  },
  consultoria: {
    img: "ambition-consultoria",
    more: [
      "Fazemos o diagnóstico do cenário atual e desenhamos um plano de crescimento claro e executável, com metas, prioridades e indicadores de acompanhamento.",
      "Revisamos os resultados periodicamente e ajustamos a rota conforme o mercado — uma parceria estratégica orientada por dados, lado a lado com a sua operação.",
    ],
  },
};

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
   3D — Objeto central: planeta holográfico do Spline
   Carregado em runtime via @splinetool/loader (scene.splinecode publicado).
   Centralizamos e escalamos para caber no lugar da antiga esfera.
-------------------------------------------------------------------------------*/
const SPLINE_URL =
  "https://my.spline.design/holographicearthwithdynamiclines-Y9i7L6QR6Ihp2XG4yJYwjgUj/scene.splinecode";

function Monument() {
  const obj = useLoader(SplineLoader, SPLINE_URL);
  const ref = useRef();

  // centraliza, normaliza o tamanho (~4.3) e ALIVIA os materiais pesados
  const fitted = useMemo(() => {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 4.3 / maxDim;
    obj.scale.setScalar(s);
    obj.position.set(-center.x * s, -center.y * s, -center.z * s);

    // Otimização: materiais "holográficos" do Spline usam transmission/clearcoat/
    // iridescence, que são caríssimos (renderizam a cena de novo por frame).
    // Desligamos isso e mantemos o vidro via transparência simples.
    obj.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = false;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => {
        if (!m) return;
        if ("transmission" in m && m.transmission > 0) {
          m.transmission = 0;
          m.thickness = 0;
          m.transparent = true;
          if (m.opacity >= 1) m.opacity = 0.85;
        }
        if ("clearcoat" in m) m.clearcoat = 0;
        if ("iridescence" in m) m.iridescence = 0;
        if ("sheen" in m) m.sheen = 0;
        if ("envMapIntensity" in m) m.envMapIntensity = Math.min(m.envMapIntensity ?? 1, 1);
        m.needsUpdate = true;
      });
    });
    return obj;
  }, [obj]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={ref} position={[0, 0.2, 0]}>
        <primitive object={fitted} />
      </group>
    </Float>
  );
}

/* ----------------------------------------------------------------------------
   3D — Robô (cena Spline carregada no R3F via @splinetool/loader).
   Assim a CÂMERA é nossa (dirigida pelo scroll, igual ao globo). O "olhar para
   o mouse" é reimplementado aqui (rotaciona suavemente em direção ao ponteiro).
-------------------------------------------------------------------------------*/
const ROBOT_URL_3D = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

// Lado do texto por seção (ordem dos [data-anchor]): 1 = direita, -1 = esquerda,
// 0 = centro. hero, 6 painéis, parallax(end), automação.
const TEXT_SIDE = [0, 1, -1, 1, -1, 1, -1, 0, -1];

function Robot() {
  const obj = useLoader(SplineLoader, ROBOT_URL_3D);
  const headRef = useRef(null);
  const els = useRef([]);

  // coleta as seções para saber qual está na tela e onde está o texto
  useEffect(() => {
    els.current = Array.from(document.querySelectorAll("[data-anchor]"));
  }, []);

  const fitted = useMemo(() => {
    let box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = 4.6 / maxDim;
    obj.scale.setScalar(s);
    obj.position.set(-center.x * s, -center.y * s, -center.z * s);
    obj.updateMatrixWorld(true);

    obj.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = false;
      o.receiveShadow = false;
    });

    // bbox em coordenadas do mundo (já escalado/centrado)
    box = new THREE.Box3().setFromObject(obj);
    const sz = box.getSize(new THREE.Vector3());
    const ctr = box.getCenter(new THREE.Vector3());

    // Remove a "plataforma"/chão: mesh plano (fino em Y) e de maior área.
    const flats = [];
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const b = new THREE.Box3().setFromObject(o);
      const ms = b.getSize(new THREE.Vector3());
      if (ms.y < Math.max(ms.x, ms.z) * 0.15) flats.push({ o, foot: ms.x * ms.z });
    });
    if (flats.length) {
      const maxFoot = Math.max(...flats.map((f) => f.foot));
      flats.forEach((f) => {
        if (f.foot > maxFoot * 0.4) f.o.visible = false;
      });
    }

    // Isola a CABEÇA (porção superior) num pivô no pescoço, para girar só ela.
    const headThresholdY = box.max.y - sz.y * 0.42; // top ~42% = cabeça
    const headMeshes = [];
    obj.traverse((o) => {
      if (!o.isMesh || !o.visible) return;
      const b = new THREE.Box3().setFromObject(o);
      const c = b.getCenter(new THREE.Vector3());
      if (c.y > headThresholdY) headMeshes.push(o);
    });
    if (headMeshes.length) {
      const pivot = new THREE.Group();
      pivot.position.set(ctr.x, headThresholdY, ctr.z); // pivô no pescoço
      obj.add(pivot);
      obj.updateMatrixWorld(true);
      headMeshes.forEach((m) => pivot.attach(m)); // attach preserva o transform
      headRef.current = pivot;
    }
    return obj;
  }, [obj]);

  // Só a cabeça gira: vira para o lado do texto (dir/esq) e inclina de baixo
  // para cima conforme o texto sobe na tela. Movimento suave e natural
  // (damping macio + leve balanço de vida + inclinação lateral ao virar).
  useFrame((state, delta) => {
    const head = headRef.current;
    if (!head) return;
    let yawTarget = 0;
    let pitchTarget = 0;
    const list = els.current;
    if (list && list.length) {
      const vh = window.innerHeight;
      let best = -1;
      let bestDist = Infinity;
      let bestCenter = vh / 2;
      list.forEach((el, idx) => {
        const r = el.getBoundingClientRect();
        const c = r.top + r.height / 2;
        const d = Math.abs(c - vh / 2);
        if (d < bestDist) {
          bestDist = d;
          best = idx;
          bestCenter = c;
        }
      });
      yawTarget = (TEXT_SIDE[best] ?? 0) * 0.6;
      const vy = bestCenter / vh; // 0 (topo) .. 1 (base)
      pitchTarget = (vy - 0.5) * 0.8; // texto embaixo → olha p/ baixo; em cima → p/ cima
    }

    // Balanço sutil para a cabeça nunca ficar 100% estática (respiração/vida).
    const t = state.clock.elapsedTime;
    yawTarget += Math.sin(t * 0.5) * 0.04;
    pitchTarget += Math.sin(t * 0.37 + 1.2) * 0.03;

    // Damping macio (sensação orgânica, sem "estalar").
    const damp = 1 - Math.exp(-3.2 * delta);
    head.rotation.y += (yawTarget - head.rotation.y) * damp;
    head.rotation.x += (pitchTarget - head.rotation.x) * damp;
    // Leve inclinação lateral acompanhando o giro (natural ao virar a cabeça).
    const rollTarget = -head.rotation.y * 0.18;
    head.rotation.z += (rollTarget - head.rotation.z) * damp;
  });

  return (
    <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
      <primitive object={fitted} position={[0, 0.1, 0]} />
    </Float>
  );
}

/* Textura suave (glint radial) para cada estrela parecer um brilho/flash */
function makeStarTexture() {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.7)");
  g.addColorStop(0.55, "rgba(255,255,255,0.15)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

/* 3D — Estrelas que cintilam e dão flashes sutis */
function Embers() {
  const ref = useRef();
  const colorAttr = useRef();
  const sprite = useMemo(makeStarTexture, []);
  // menos estrelas no mobile (custo de CPU/upload por frame)
  const count = useMemo(
    () => (typeof window !== "undefined" && window.innerWidth < 768 ? 220 : 500),
    []
  );

  const { positions, colors, phases, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 7;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(ph) * Math.cos(th);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 0.3;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.6 + Math.random() * 2.6; // velocidades variadas → cintilar irregular
    }
    return { positions, colors, phases, speeds };
  }, [count]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.rotation.y += delta * 0.012;
      ref.current.position.y = Math.sin(t * 0.18) * 0.22;
    }
    const arr = colorAttr.current?.array;
    if (arr) {
      for (let i = 0; i < count; i++) {
        const tw = Math.sin(t * speeds[i] + phases[i]);
        // brilho base sutil + picos curtos de flash (pow acentua os topos = "estalo")
        let b = 0.18 + 0.22 * (tw * 0.5 + 0.5);
        b += Math.pow(Math.max(tw, 0), 10) * 0.7;
        arr[i * 3] = arr[i * 3 + 1] = arr[i * 3 + 2] = b;
      }
      colorAttr.current.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute ref={colorAttr} attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        map={sprite}
        vertexColors
        transparent
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
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

      {/* luz-chave dourada (rim light) + preenchimento verde da marca */}
      <ambientLight intensity={0.15} />
      <spotLight
        position={[6, 4, 4]}
        angle={0.6}
        penumbra={1}
        intensity={120}
        color="#e3c079"
        distance={30}
      />
      <pointLight position={[-6, 1, -3]} intensity={42} color="#2bb39a" />
      <pointLight position={[0, -4, 4]} intensity={12} color="#fff2df" />

      <Suspense fallback={null}>
        <Monument />
        <Embers />
        {/* HDR procedural (sem baixar .exr) → reflexos */}
        <Environment resolution={256}>
          <Lightformer intensity={3} color="#e3c079" position={[5, 2, 1]} scale={[12, 12, 1]} />
          <Lightformer intensity={1.4} color="#2bb39a" position={[-6, 1, -2]} scale={[12, 12, 1]} />
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
      className="relative flex h-screen flex-col items-center justify-end px-6 pb-[6vh] text-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3], y: [0, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 flex flex-col items-center gap-2 text-cream/60"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Role para entrar</span>
        <ArrowDown size={16} />
      </motion.div>

      <motion.h1
        data-gaze
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.6 }}
        transition={{ duration: 1.3, ease: EASE }}
        className="font-display leading-[0.82] text-cream"
      >
        <span className="block text-[22vw] font-medium tracking-tight md:text-[17vw] lg:text-[14rem]">
          AMBITION
        </span>
      </motion.h1>
    </section>
  );
}

function Panel({ section, index, onReadMore }) {
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
            não ser esticado pela animação. Espelha de lado: barra à esquerda nos
            painéis da esquerda, à direita nos painéis da direita. */}
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

        {/* Texto — largura fixa (max-w-xl, w-full) para que kicker, título e
            parágrafo encostem sempre na barra, independente do tamanho do título. */}
        <motion.div
          data-gaze
          variants={{ hidden: { opacity: 0, y: 50 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 1.1, ease: EASE }}
          className="w-full max-w-xl"
        >
          <span className="mb-4 block font-sans text-xs uppercase tracking-[0.35em] text-ember">
            {section.kicker}
          </span>
          <h2 className="mb-5 font-display text-5xl font-medium leading-[0.95] text-cream md:text-7xl">
            {section.title}
          </h2>
          <p className="font-sans text-base leading-relaxed text-cream/75 md:text-lg">
            {section.body}
          </p>
          {DETAILS[section.id] && (
            <button
              onClick={() => onReadMore(section)}
              className={`mt-7 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-[0.28em] text-cream/70 transition-colors hover:text-ember ${
                alignRight ? "flex-row-reverse" : ""
              }`}
            >
              Saiba mais <ChevronRight size={14} />
            </button>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* Card lateral "Saiba mais" — desliza da direita com imagem + texto detalhado. */
function DetailCard({ section, onClose }) {
  const d = section ? DETAILS[section.id] : null;
  return (
    <AnimatePresence>
      {section && d && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex justify-end bg-void/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative h-full w-full max-w-md overflow-y-auto border-l border-cream/10 bg-[#0c0910] p-6 md:p-9"
          >
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-5 top-5 z-10 text-cream/70 transition-colors hover:text-ember"
            >
              <X size={24} />
            </button>

            <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden rounded-xl">
              <img
                src={`https://picsum.photos/seed/${d.img}/800/500?grayscale`}
                alt={section.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, rgba(200,161,92,0.30), rgba(15,74,66,0.35))",
                  mixBlendMode: "soft-light",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0910] via-transparent to-transparent" />
            </div>

            <span className="mt-7 block font-sans text-xs uppercase tracking-[0.35em] text-ember">
              {section.kicker}
            </span>
            <h3 className="mt-3 font-display text-4xl font-medium leading-[0.95] text-cream">
              {section.title}
            </h3>

            <div className="mt-5 space-y-4">
              {d.more.map((p, i) => (
                <p key={i} className="font-sans text-sm leading-relaxed text-cream/75">
                  {p}
                </p>
              ))}
            </div>

            <a
              href="https://wa.me/5511987654321?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20a%20Ambition."
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-ember px-7 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.16em] text-void transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(200,161,92,0.5)]"
            >
              <MessageCircle size={18} />
              Falar com a Ambition
            </a>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Seção final em PARALLAX (Osmo) — camadas que se movem em velocidades
   diferentes no scroll (GSAP ScrollTrigger), com AMBITION como camada-título.
   Usa a instância de Lenis criada no App (ScrollTrigger já sincronizado lá). */
const PARALLAX_LAYERS = [
  { layer: "1", yPercent: 70 },
  { layer: "2", yPercent: 55 },
  { layer: "3", yPercent: 40 },
  { layer: "4", yPercent: 10 },
];

function ParallaxOutro() {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const trigger = root.querySelector("[data-parallax-layers]");

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0 },
    });

    PARALLAX_LAYERS.forEach((o, i) => {
      tl.to(
        root.querySelectorAll(`[data-parallax-layer="${o.layer}"]`),
        { yPercent: o.yPercent, ease: "none" },
        i === 0 ? undefined : "<"
      );
    });

    ScrollTrigger.refresh();
    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section ref={ref} data-anchor id="end" className="parallax">
      <div className="parallax__visuals">
        <div data-parallax-layers className="parallax__layers">
          {/* AMBITION com movimento parallax, sobre o globo (canvas ao fundo). */}
          <div data-parallax-layer="3" className="parallax__layer-title">
            <h2 data-gaze className="font-display text-[22vw] font-medium leading-none tracking-tight text-cream md:text-[17vw] lg:text-[14rem]">
              AMBITION
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Seção AUTOMAÇÃO & IA — robô 3D (Spline) que segue o mouse na seção inteira.
   O canvas do robô ocupa toda a seção; o texto fica por cima com
   pointer-events desativado, então o mouse alcança o robô em qualquer ponto.
-------------------------------------------------------------------------------*/
const SplineRobotScene = lazy(() => import("@splinetool/react-spline"));
const ROBOT_URL = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

function AutomationSection() {
  return (
    <section
      data-anchor
      id="automacao-ia"
      className="relative h-screen w-full overflow-hidden bg-void"
    >
      {/* Robô 3D ocupando a seção inteira → reage ao mouse em qualquer ponto.
          Posicionado à direita (círculo 2). */}
      <div className="absolute inset-0 translate-x-[26%]">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-cream/40">
              <RotateCw className="animate-spin" size={26} />
            </div>
          }
        >
          <SplineRobotScene scene={ROBOT_URL} className="h-full w-full" />
        </Suspense>
      </div>

      {/* Scrim para legibilidade do texto à esquerda (não bloqueia o mouse). */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />

      {/* Conteúdo — encostado à esquerda (círculo 1). pointer-events desativado
          para o mouse chegar ao robô; apenas o botão reativa o clique. */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-center pl-8 md:pl-20 lg:pl-28">
        <motion.div
          data-gaze
          initial={{ opacity: 0, x: 180 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ amount: 0.4 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="max-w-xl"
        >
          <span className="mb-4 block font-sans text-xs uppercase tracking-[0.35em] text-ember">
            Automação & Inteligência Artificial
          </span>
          <h2 className="mb-5 font-display text-5xl font-medium leading-[0.95] text-cream md:text-7xl">
            Um atendimento que nunca para
          </h2>
          <p className="mb-6 max-w-lg font-sans text-base leading-relaxed text-cream/75 md:text-lg">
            Agentes de IA e automações que respondem, qualificam e acompanham seus
            leads <span className="text-cream">24 horas por dia, 7 dias por semana</span>.
            Integramos WhatsApp, CRM e fluxos com n8n para que nenhuma oportunidade
            esfrie — resposta em segundos, recuperação automática de contatos e o seu
            time livre para fazer o que importa: fechar negócios.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-xs uppercase tracking-[0.2em] text-cream/55">
            <span>Resposta em segundos</span>
            <span>Qualificação automática</span>
            <span>Disponível 24/7</span>
          </div>

          <a
            href="https://wa.me/5511987654321?text=Ol%C3%A1!%20Quero%20um%20atendimento%20automatizado%20com%20IA."
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-full bg-ember px-9 py-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-void transition-all duration-300 hover:scale-105 hover:shadow-[0_0_35px_rgba(200,161,92,0.5)]"
          >
            <MessageCircle size={18} />
            Quero atendimento 24/7
          </a>
        </motion.div>
      </div>
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
        className="font-display text-2xl tracking-[0.25em] text-cream md:text-3xl"
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
   Robô de fundo (Whobee) — TESTE no lugar do globo. Cena Spline hospedada.
   A logo é um overlay 2D aproximado sobre o bloco (a logo "colada" no 3D só
   é possível editando a cena no Spline e republicando).
-------------------------------------------------------------------------------*/
const ROBOT_BG_URL = "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";

// Tenta esconder a "plataforma"/chão da cena Spline em runtime (deixa só o robô
// e o bloco). Como não controlamos os nomes dos objetos da cena hospedada,
// procuramos por nomes comuns de piso/plataforma.
function hideRobotFloor(spline) {
  const words = ["floor", "plane", "ground", "base", "plataforma", "plataform", "stage", "podium", "rectangle", "piso", "chao", "chão"];
  try {
    let objs = [];
    if (typeof spline.getAllObjects === "function") objs = spline.getAllObjects();
    objs.forEach((o) => {
      const n = (o?.name || "").toLowerCase();
      if (words.some((w) => n.includes(w))) o.visible = false;
    });
    ["Floor", "Plane", "Ground", "Platform", "Plataforma", "Rectangle", "Piso"].forEach((nm) => {
      const o = spline.findObjectByName?.(nm);
      if (o) o.visible = false;
    });
  } catch (e) {
    /* cena sem API de objetos — sem ação */
  }
}

// Keyframes do movimento do robô dirigido pelo scroll (eco do que o globo fazia).
// Como é um canvas Spline, animamos o container (pan/zoom/giro) por CSS.
const ROBOT_KEYS = [
  { x: 0, y: 0, s: 1.0, r: 0 }, // 0 hero
  { x: -8, y: 2, s: 1.06, r: -2 }, // 1
  { x: 7, y: -3, s: 1.12, r: 2 }, // 2
  { x: 9, y: 4, s: 1.1, r: 3 }, // 3
  { x: 0, y: 6, s: 1.18, r: 0 }, // 4 mergulho
  { x: -6, y: 1, s: 1.22, r: -2 }, // 5 detalhe
  { x: 0, y: 0, s: 1.0, r: 0 }, // 6 afasta
];

function lerpRobot(a, b, t) {
  return {
    x: THREE.MathUtils.lerp(a.x, b.x, t),
    y: THREE.MathUtils.lerp(a.y, b.y, t),
    s: THREE.MathUtils.lerp(a.s, b.s, t),
    r: THREE.MathUtils.lerp(a.r, b.r, t),
  };
}

function RobotBackground({ scrollRef }) {
  const wrapperRef = useRef(null);
  const els = useRef([]);

  // Blocos de TEXTO (marcados com data-gaze) — é o que o robô vai acompanhar.
  useEffect(() => {
    els.current = Array.from(document.querySelectorAll("[data-gaze]"));
  }, []);

  // 1) Move o container do robô conforme o scroll (eco dos keyframes do globo).
  // 2) Dirige o "olhar" do robô para o TEXTO: a cada frame despacha um evento de
  //    ponteiro sintético no canvas, na posição do texto da seção ativa (lado +
  //    altura). Como sobrescreve todo frame, o mouse real deixa de dominar, mas
  //    a articulação natural da cena Spline é preservada.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const cur = { x: 0, y: 0, s: 1, r: 0 };
    let raf;
    let last = performance.now();
    let canvas = null;
    const loop = (now) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;

      // --- movimento por scroll ---
      const p = THREE.MathUtils.clamp(scrollRef?.current ?? 0, 0, 1);
      const seg = p * (ROBOT_KEYS.length - 1);
      const i = Math.min(Math.floor(seg), ROBOT_KEYS.length - 2);
      const k = lerpRobot(ROBOT_KEYS[i], ROBOT_KEYS[i + 1], seg - i);
      const damp = 1 - Math.exp(-4 * delta);
      cur.x += (k.x - cur.x) * damp;
      cur.y += (k.y - cur.y) * damp;
      cur.s += (k.s - cur.s) * damp;
      cur.r += (k.r - cur.r) * damp;
      el.style.transform = `translate(${cur.x}vw, ${cur.y}vh) scale(${cur.s}) rotate(${cur.r}deg)`;

      // --- olhar segue o texto: mira no centro real do bloco de texto mais
      //     visível (X = lado, Y = altura) → olha p/ baixo quando surge embaixo
      //     e acompanha subindo. A cena suaviza o movimento. ---
      canvas = el.querySelector("canvas");
      const list = document.querySelectorAll("[data-gaze]");
      if (list.length) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let cx = vw / 2;
        let cy = vh / 2;
        let bestDist = Infinity;
        list.forEach((s) => {
          const r = s.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          const ccx = r.left + r.width / 2;
          const ccy = r.top + r.height / 2;
          const d = Math.abs(ccy - vh / 2);
          if (d < bestDist) {
            bestDist = d;
            cx = ccx;
            cy = ccy;
          }
        });
        cx = Math.max(0, Math.min(vw, cx));
        cy = Math.max(0, Math.min(vh, cy));
        const base = { clientX: cx, clientY: cy, bubbles: true, cancelable: true };
        const fire = (target) => {
          if (!target) return;
          target.dispatchEvent(new PointerEvent("pointermove", { ...base, pointerId: 1, pointerType: "mouse", isPrimary: true }));
          target.dispatchEvent(new MouseEvent("mousemove", base));
        };
        fire(window);
        fire(canvas);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [scrollRef]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Glow roxo difuso (canto inferior direito). */}
      <div className="pointer-events-none absolute left-[56%] top-[60%] h-[60vh] w-[60vh] rounded-full bg-[#7c3aed]/25 blur-[130px]" />

      {/* Container animado pelo scroll. */}
      <div ref={wrapperRef} className="h-full w-full will-change-transform [transform-origin:center]">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center text-cream/40">
              <RotateCw className="animate-spin" size={26} />
            </div>
          }
        >
          <SplineRobotScene scene={ROBOT_BG_URL} className="h-full w-full" onLoad={hideRobotFloor} />
        </Suspense>

        {/* Cobre o selo "Built with Spline" (acompanha o transform do robô). */}
        <div className="pointer-events-none absolute bottom-0 right-0 z-[1] h-14 w-48 bg-void" />
      </div>

      {/* Sombra suave sob o bloco. */}
      <div className="pointer-events-none absolute left-1/2 top-[83%] h-12 w-72 -translate-x-1/2 rounded-[100%] bg-black/70 blur-2xl" />
    </div>
  );
}

/* ----------------------------------------------------------------------------
   APP
-------------------------------------------------------------------------------*/
export default function App() {
  const scrollRef = useRef(0); // progresso global 0..1 lido pela câmera 3D
  const lenis = useRef(null);
  const active = useActiveSection();
  const [detail, setDetail] = useState(null); // seção aberta no card "Saiba mais"
  // DPR fixo e responsivo: nítido no desktop, leve no celular (retina custa caro)
  const [dpr, setDpr] = useState(1);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    setDpr(mobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const l = new Lenis({ duration: 1.2, smoothWheel: !reduce, lerp: 0.1 });
    lenis.current = l;
    // Lenis dirige o scroll → mantém o ScrollTrigger (parallax) em sincronia.
    l.on("scroll", (e) => {
      scrollRef.current = e.progress ?? 0;
      ScrollTrigger.update();
    });
    let raf;
    const loop = (t) => {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // Recalcula posições do ScrollTrigger após o layout assentar.
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(refresh);
      l.destroy();
    };
  }, []);

  return (
    <div className="relative w-full bg-void">
      <LoadingVeil />

      {/* CAMADA 3D — fixa no fundo (globo no R3F, câmera dirigida pelo scroll) */}
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ position: [0, 1.6, 9.5], fov: 42 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          dpr={dpr}
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
          <Panel key={s.id} section={s} index={i} onReadMore={setDetail} />
        ))}
        <ParallaxOutro />
        <AutomationSection />
      </div>

      <DetailCard section={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
