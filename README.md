# Ambition — Immersive 3D Exhibition

Experiência 3D imersiva com rolagem cinematográfica, reconstruída do zero em
**React + Vite + React-Three-Fiber**, inspirada no padrão de scrollytelling 3D
de `mongols.peachworlds.com` (Peach Worlds).

## Stack
- **React 18 + Vite**
- **React-Three-Fiber** + **drei** — cena WebGL (Three.js)
- **Lenis** — smooth scroll (1.2s, igual ao original)
- **Framer Motion** (`motion/react`) — fades das seções
- **Tailwind CSS v4**

## Arquitetura
`<Canvas>` fixo no fundo + overlay HTML rolável na frente. O progresso de scroll
(suavizado pelo Lenis) dirige a câmera 3D através de 7 keyframes interpolados com
amortecimento. Iluminação HDR procedural via `Lightformer` (rim laranja + fill
azul), sem depender de arquivos `.exr`.

## Rodar
```bash
npm install
npm run dev
```

## Personalizar
- **Objeto central:** `Monument` em `src/App.jsx` é um placeholder procedural.
  Troque por `useGLTF('/seu-modelo.glb')` + `<primitive>` para um modelo 3D real.
- **Trilha sonora:** coloque um `ambient.mp3` em `/public` (o botão de áudio já
  está cabeado).

---
Rebuilt with React-Three-Fiber.
