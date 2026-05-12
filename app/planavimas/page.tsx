"use client";

import Link from "next/link";
import { Fragment, useMemo, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface Seedling {
  id: string;
  name: string;
  distance: number;
  description: string;
  icon: string;
}

interface Post {
  id_Skelbimas: number;
  name: string;
  latin_name: string;
  price: number;
  photo: string | null;
}

interface plotSz {
  width: number;
  height: number;
}

const SEEDLINGS: Seedling[] = [
  { id: "pusis", name: "Pušis", distance: 4, description: "Tinka atvirose vietose, reikalauja 4 m tarpų.", icon: "🌲" },
  { id: "berzas", name: "Beržas", distance: 3, description: "Greitai auga, reikalauja 3 m atstumo.", icon: "🌿" },
  { id: "egle", name: "Eglė", distance: 3.5, description: "Atspari šalčiui, reikalauja 3.5 m tarpų.", icon: "🎄" },
  { id: "azuolas", name: "Ąžuolas", distance: 6, description: "Ilgaamžis ąžuolas, rekomenduojamas 6 m atstumas.", icon: "🌳" },
  { id: "uosis", name: "Uosis", distance: 5, description: "Tvirtas medis, reikalauja 5 m tarpų.", icon: "🍃" },
  { id: "klevas", name: "Klevas", distance: 5, description: "Gražus lapuočių medis, reikalauja 5 m atstumo.", icon: "🍁" },
  { id: "liepa", name: "Liepa", distance: 4, description: "Maloni aromatinga liepa, reikalauja 4 m tarpus.", icon: "🌼" },
  { id: "gluosnis", name: "Gluosnis", distance: 5, description: "Greitai auga, reikalauja 5 m atstumo.", icon: "🌾" },
  { id: "alksnis", name: "Alksnis", distance: 4, description: "Daug vandens mėgstantis, reikalauja 4 m tarpų.", icon: "🍂" },
  { id: "sermuksnis", name: "Šermukšnis", distance: 4, description: "Tvirtas ir atsparus, reikalauja 4 m atstumo.", icon: "🍒" },
  { id: "kenis", name: "Kėnis", distance: 4.5, description: "Auginamas dekoratyviai, reikalauja 4.5 m tarpų.", icon: "🌱" },
  { id: "maumedis", name: "Maumedis", distance: 6, description: "Lėtai auga, bet aukštas, reikalauja 6 m atstumo.", icon: "🌲" },
  { id: "bukas", name: "Bukas", distance: 5.5, description: "Tvirtas medelis, reikalauja 5.5 m tarpus.", icon: "🍁" },
  { id: "obelis", name: "Obelis", distance: 3.5, description: "Vaismedis, reikalauja 3.5 m atstumo.", icon: "🍎" },
  { id: "kriause", name: "Kriaušė", distance: 3.5, description: "Vaismedis, reikalauja 3.5 m tarpų.", icon: "🍐" },
  { id: "slyva", name: "Slyva", distance: 3, description: "Greitai vaisių duodantis, reikalauja 3 m atstumo.", icon: "🌸" },
  { id: "ieva", name: "Ieva", distance: 4, description: "Dekoratyvinė ir aromatinga, reikalauja 4 m tarpų.", icon: "🌺" },
  { id: "sedula", name: "Sedula", distance: 3, description: "Kompaktiška ir dekoratyvi, reikalauja 3 m atstumo.", icon: "🌿" },
  { id: "kornelis", name: "Kornelis", distance: 4, description: "Atsparus ir skoningas, reikalauja 4 m tarpų.", icon: "🌼" },
  { id: "alksnis2", name: "Paprastasis alksnis", distance: 4, description: "Klasikinis svetainės pasirinkimas, reikalauja 4 m atstumo.", icon: "🍃" },
];

const PRESET_SIZES = [
  { label: "10 × 10 m", width: 10, height: 10 },
  { label: "12 × 12 m", width: 12, height: 12 },
  { label: "15 × 10 m", width: 15, height: 10 },
  { label: "20 × 15 m", width: 20, height: 15 },
  { label: "30 × 30 m", width: 30, height: 30 },
  { label: "50 × 50 m", width: 50, height: 50 },
  { label: "80 × 80 m", width: 80, height: 80 },
];

const GRID_MIN = 6;
const GRID_MAX = 200;
const CELL_SIZE_MIN = 16;
const CELL_SIZE_MAX = 48;
const CELL_SIZE_DEFAULT = 28;
const PLOT_SIZE_DEFAULT: plotSz = { width: 12, height: 12 };

type Mode = "place" | "block";

type Placement = { x: number; y: number; seedlingId: string };

type BlockedCell = { x: number; y: number };

function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x1 - x2, y1 - y2);
}

export default function PlanavimasPage() {
  const { data: session, status } = useSession();
  const [plotSize, setPlotSize] = useLocalStorage<plotSz>('plot_size', PLOT_SIZE_DEFAULT);
  const [cellSize, setCellSize] = useLocalStorage<number>('cell_size', CELL_SIZE_DEFAULT);
  const [mode, setMode] = useLocalStorage<Mode>('user_mode', 'place');
  const [placements, setPlacements] = useLocalStorage<Placement[]>('user_placements', []);
  const [blockedCells, setBlockedCells] = useLocalStorage<BlockedCell[]>('user_blocked_cells', []);
  const [selectedSeedlingId, setSelectedSeedlingId] = useLocalStorage<string>('user_selected_seedling', SEEDLINGS[0].id);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragActionRef = useRef<"block" | "unblock" | null>(null);
  const dragVisitedRef = useRef<Set<string>>(new Set());

   const [recommendations, setRecommendations] = useState<Post[]>([]);

  const selectedSeedling = SEEDLINGS.find((seedling) => seedling.id === selectedSeedlingId) ?? SEEDLINGS[0];

  const grid = useMemo(
    () =>
      Array.from({ length: plotSize.height }, (_, y) =>
        Array.from({ length: plotSize.width }, (_, x) => ({ x, y }))
      ),
    [plotSize]
  );

  useEffect(() => {
    async function fetchRecommendations() {
      if (placements.length === 0) {
        setRecommendations([]);
        return;
      }

      try {
        const params = new URLSearchParams();
        placements.forEach((placement) => {
          const seedling = SEEDLINGS.find((s) => s.id === placement.seedlingId);
          if (seedling) {
            params.append("name", seedling.name);
          }
        });

        const response = await fetch(`/api/skelbimai/rec?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Nepavyko gauti rekomendacijų");
        }

        const data = await response.json();
        const mappedRecommendations: Post[] = data.map((item: any) => ({
          id_Skelbimas: item.id_Skelbimas,
          name: item.pavadinimas,
          latin_name: item.lotyniskas_pav || "",
          photo: item.nuotrauka, // BASE64
          price: item.kaina || 0,
        }));

        console.log("Gautos rekomendacijos:", mappedRecommendations);
        setRecommendations(mappedRecommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendations([]);
      }
    }

    fetchRecommendations();
  }, [placements]);

  const blockedCellSet = useMemo(
    () => new Set(blockedCells.map((cell) => `${cell.x}-${cell.y}`)),
    [blockedCells]
  );

  const placementMap = useMemo(() => {
    const map = new Map<string, Placement>();
    placements.forEach((placement) => {
      map.set(`${placement.x}-${placement.y}`, placement);
    });
    return map;
  }, [placements]);

  const isBlocked = (x: number, y: number) => blockedCellSet.has(`${x}-${y}`);
  const existingPlacement = (x: number, y: number) => placementMap.get(`${x}-${y}`);
  const isPlacementTooClose = (x: number, y: number, seedlingId: string) => {
    const seedling = SEEDLINGS.find((item) => item.id === seedlingId);
    if (!seedling) return false;
    return placements.some((placement) => {
      const existing = SEEDLINGS.find((item) => item.id === placement.seedlingId);
      if (!existing) return false;
      const required = Math.max(seedling.distance, existing.distance);
      return distance(x, y, placement.x, placement.y) < required;
    });
  };

  const applyBlockAction = (x: number, y: number, action: "block" | "unblock") => {
    if (existingPlacement(x, y)) {
      setFeedback("Negalite pažymėti užblokuotos vietos ant jau pažymėto medžio.");
      return;
    }

    setBlockedCells((current) => {
      const exists = current.some((cell) => cell.x === x && cell.y === y);
      if (action === "block") {
        return exists ? current : [...current, { x, y }];
      }
      return exists ? current.filter((cell) => cell.x !== x || cell.y !== y) : current;
    });
  };

  const toggleBlockedCell = (x: number, y: number) => {
    const action = isBlocked(x, y) ? "unblock" : "block";
    applyBlockAction(x, y, action);
  };

  const startBlockDrag = (x: number, y: number) => {
    if (mode !== "block") return;
    setFeedback(null);
    setIsDragging(true);
    dragVisitedRef.current = new Set();

    const action = isBlocked(x, y) ? "unblock" : "block";
    dragActionRef.current = action;
    dragVisitedRef.current.add(`${x}-${y}`);
    applyBlockAction(x, y, action);
  };

  const continueBlockDrag = (x: number, y: number) => {
    if (!isDragging || mode !== "block") return;
    const action = dragActionRef.current;
    if (!action) return;

    const key = `${x}-${y}`;
    if (dragVisitedRef.current.has(key)) return;
    dragVisitedRef.current.add(key);
    applyBlockAction(x, y, action);
  };

  const handleCellClick = (x: number, y: number) => {
    setFeedback(null);

    if (mode === "block") {
      toggleBlockedCell(x, y);
      return;
    }

    if (existingPlacement(x, y)) {
      setPlacements((current) => current.filter((placement) => placement.x !== x || placement.y !== y));
      setFeedback("Sodinukas pašalintas iš plano.");
      return;
    }

    if (!selectedSeedling) {
      setFeedback("Pasirinkite sodinuką prieš žymėdami sklypą.");
      return;
    }

    if (isBlocked(x, y)) {
      setFeedback("Šioje vietoje negalima sodinti sodinukų.");
      return;
    }

    if (isPlacementTooClose(x, y, selectedSeedling.id)) {
      setFeedback(
        `Negalima sodinti čia. Pasirinktas sodinukas reikalauja bent ${selectedSeedling.distance} m atstumo nuo kitų.`
      );
      return;
    }

    setPlacements((current) => [...current, { x, y, seedlingId: selectedSeedling.id }]);
  };

  const handleReset = () => {
    setPlacements([]);
    setBlockedCells([]);
    setPlotSize({ width: 12, height: 12 });
    setFeedback("Planas išvalytas.");
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerUp = () => {
      setIsDragging(false);
      dragActionRef.current = null;
      dragVisitedRef.current.clear();
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging]);

  const exportMapAsPng = async () => {
    const cellSize = 40;
    const svgWidth = plotSize.width * cellSize;
    const svgHeight = plotSize.height * cellSize;

    const getCellFill = (x: number, y: number) => {
      if (isBlocked(x, y)) {
        return "#7f1d1d";
      }
      return (x + y) % 2 === 0 ? "#0f172a" : "#111827";
    };

    const cellRectangles = grid
      .flat()
      .map(({ x, y }) => {
        const fill = getCellFill(x, y);
        return `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="#334155" stroke-width="1" />`;
      })
      .join("");

    const blockedRects = blockedCells
      .map(({ x, y }) => `
        <rect x="${x * cellSize + 2}" y="${y * cellSize + 2}" width="${cellSize - 4}" height="${cellSize - 4}" fill="rgba(239, 68, 68, 0.25)" />
        <line x1="${x * cellSize + 8}" y1="${y * cellSize + 8}" x2="${(x + 1) * cellSize - 8}" y2="${(y + 1) * cellSize - 8}" stroke="#f87171" stroke-width="3" />
        <line x1="${(x + 1) * cellSize - 8}" y1="${y * cellSize + 8}" x2="${x * cellSize + 8}" y2="${(y + 1) * cellSize - 8}" stroke="#f87171" stroke-width="3" />
      `)
      .join("");

    const placementNodes = placements
      .map((placement) => {
        const seedling = SEEDLINGS.find((item) => item.id === placement.seedlingId);
        return `
          <text x="${placement.x * cellSize + cellSize / 2}" y="${placement.y * cellSize + cellSize / 2 + 4}" text-anchor="middle" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif" font-size="24" fill="#f8fafc">${seedling?.icon ?? "🌱"}</text>
        `;
      })
      .join("");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
        <rect width="100%" height="100%" fill="#020617" />
        ${cellRectangles}
        ${blockedRects}
        ${placementNodes}
      </svg>
    `;

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const anchor = document.createElement("a");
        anchor.href = pngUrl;
        anchor.download = "sodinimo-planas.png";
        anchor.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };

    img.src = url;
  };

  const placedCount = placements.length;
  const blockedCount = blockedCells.length;
  const headerSize = Math.max(28, cellSize);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-28">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-emerald-500 hover:bg-zinc-900/100"
          >
            ← Grįžti
          </Link>
        </div>
        <div className="mb-12 rounded-3xl bg-zinc-900/95 p-10 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">Planavimas</span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white">Sodinukų sklypo planavimo įrankis</h1>
              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                Pasirinkite savo sklypo dydį, pažymėkite vietas, kur negalite sodinti, ir statykite sodinukus
                taip, kad jie nebūtų per arti vienas kito.
              </p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">Jūsų teisės</p>
              <p className="text-sm text-zinc-300">
                Prisijungę vartotojai gali projektuoti savo sklypą, saugoti žemėlapį ir atsisiųsti planą tiesiai į kompiuterį.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Sodinukų</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">20</p>
                </div>
                <div className="rounded-2xl bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Atstumo taisyklės</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-300">3–6 m</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {status === "loading" ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-16 text-center text-zinc-400">Kraunasi...</div>
        ) : !session ? (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center">
            <h2 className="text-2xl font-semibold text-white">Prisijunkite, kad galėtumėte naudotis planavimo įrankiu</h2>
            <p className="mt-3 text-zinc-400">
              Planavimas skryptyje yra skirtas registruotiems vartotojams. Prisijunkite arba susikurkite paskyrą.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login" className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                Prisijungti
              </Link>
              <Link href="/register" className="rounded-full border border-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/10">
                Registruotis
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-xl shadow-black/20">
              <section>
                <h2 className="text-xl font-semibold text-white">1. Pasirinkite sklypo dydį</h2>
                <div className="mt-4 grid gap-3">
                  {PRESET_SIZES.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setPlotSize({ width: option.width, height: option.height })}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${plotSize.width === option.width && plotSize.height === option.height ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"}`}
                    >
                      <span className="font-semibold">{option.label}</span>
                      <span className="mt-1 block text-[0.85rem] text-zinc-500">{option.width} × {option.height} m</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm text-zinc-400">Arba pasirinkite savo dydį:</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm text-zinc-300">
                      Plotis (m)
                      <input
                        type="number"
                        min={GRID_MIN}
                        max={GRID_MAX}
                        value={plotSize.width}
                        onChange={(event) => setPlotSize((prev) => ({ ...prev, width: Math.max(GRID_MIN, Math.min(GRID_MAX, Number(event.target.value) || prev.width)) }))}
                        className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </label>
                    <label className="block text-sm text-zinc-300">
                      Ilgis (m)
                      <input
                        type="number"
                        min={GRID_MIN}
                        max={GRID_MAX}
                        value={plotSize.height}
                        onChange={(event) => setPlotSize((prev) => ({ ...prev, height: Math.max(GRID_MIN, Math.min(GRID_MAX, Number(event.target.value) || prev.height)) }))}
                        className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Papildomai: priartinimas</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Dideliems plotams naudokite priartinimą ir slinkite žemėlapį.
                </p>
                <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <label className="block text-sm text-zinc-300">
                    Langelio dydis: {cellSize}px
                    <input
                      type="range"
                      min={CELL_SIZE_MIN}
                      max={CELL_SIZE_MAX}
                      value={cellSize}
                      onChange={(event) => setCellSize(Number(event.target.value))}
                      className="mt-3 w-full accent-emerald-400"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">2. Pažymėkite negalimas zonas</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Spustelėkite langelį, kad jį pažymėtumėte kaip zoną, kur nebus sodinama.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("block")}
                  className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === "block" ? "bg-emerald-500 text-black" : "border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900"}`}
                >
                  Blokuoti zonas
                </button>
                <p className="mt-4 text-sm text-zinc-300">Uždraustų langelių skaičius: {blockedCount}</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">3. Pasirinkite sodinuką</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Pasirinkite medžių rūšį. Sistema automatiškai taikys reikiamus atstumus ir parodys draudžiamas vietas.
                </p>
                <div className="mt-4 grid gap-3 max-h-[380px] overflow-auto pr-1">
                  {SEEDLINGS.map((seedling) => (
                    <button
                      type="button"
                      key={seedling.id}
                      onClick={() => {
                        setSelectedSeedlingId(seedling.id);
                        setMode("place");
                      }}
                      className={`rounded-2xl border px-4 py-3 text-left transition ${selectedSeedlingId === seedling.id ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-2xl">{seedling.icon}</span>
                        <span className="text-sm text-zinc-400">{seedling.distance} m</span>
                      </div>
                      <p className="mt-3 font-semibold text-white">{seedling.name}</p>
                      <p className="mt-2 text-sm leading-5 text-zinc-400">{seedling.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">Planas</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{placedCount} sodinukų</p>
                  </div>
                  <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">{plotSize.width} × {plotSize.height} m</span>
                </div>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
                  >
                    Išvalyti planą
                  </button>
                  <button
                    type="button"
                    onClick={exportMapAsPng}
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                  >
                    Atsisiųsti planą PNG
                  </button>
                </div>
                {feedback ? <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{feedback}</p> : null}
                <div className="rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-400">
                  <p className="font-semibold text-white">Patarimas</p>
                  <p className="mt-2">Spustelėkite langelį ant sklypo piešinio. Keiskite režimą tarp <span className="font-semibold text-emerald-300">sodinimo</span> ir <span className="font-semibold text-emerald-300">blokavimo</span>. Spustelėkite pažymėtą medį, kad jį pašalintumėte.</p>
                </div>
              </section>
            </aside>

            <main className="space-y-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl shadow-black/20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Sklypo planas</h2>
                    <p className="mt-1 text-sm text-zinc-400">Pažymėkite sklypą ir pridėkite sodinukus bei blokuotas zonas.</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                    Režimas: <span className={`font-semibold ${mode === "place" ? "text-white" : "text-red-600"}`}>
                      {mode === "place" ? " Sodinimas" : " Blokavimas"}</span>
                  </div>
                </div>
                <div className="mt-6 max-h-[70vh] overflow-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-3">
                  <div
                    className="grid w-fit gap-px select-none"
                    style={{ gridTemplateColumns: `${headerSize}px repeat(${plotSize.width}, ${cellSize}px)`, gridAutoRows: `${cellSize}px` }}
                  >
                    <div className="flex items-center justify-center bg-zinc-900/70 text-[10px] font-semibold text-zinc-500" />
                    {Array.from({ length: plotSize.width }, (_, x) => (
                      <div
                        key={`col-${x}`}
                        className="flex items-center justify-center bg-zinc-900/70 text-[10px] font-semibold text-zinc-500"
                        title={`Stulpelis ${x + 1}`}
                      >
                        {x + 1}
                      </div>
                    ))}

                    {grid.map((row, y) => (
                      <Fragment key={`row-${y}`}>
                        <div
                          className="flex items-center justify-center bg-zinc-900/70 text-[10px] font-semibold text-zinc-500"
                          title={`Eilutė ${y + 1}`}
                        >
                          {y + 1}
                        </div>
                        {row.map(({ x, y: rowY }) => {
                          const blocked = isBlocked(x, rowY);
                          const placement = existingPlacement(x, rowY);
                          const tooClose = mode === "place" && selectedSeedling ? isPlacementTooClose(x, rowY, selectedSeedling.id) : false;

                          return (
                            <button
                              key={`${x}-${rowY}`}
                              type="button"
                              onClick={mode === "place" ? () => handleCellClick(x, rowY) : undefined}
                              onPointerDown={() => startBlockDrag(x, rowY)}
                              onPointerEnter={() => continueBlockDrag(x, rowY)}
                              onKeyDown={(event) => {
                                if (mode !== "block") return;
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  handleCellClick(x, rowY);
                                }
                              }}
                              className={`h-full w-full border border-zinc-800 p-0 transition ${blocked ? "bg-red-500/20 hover:bg-red-500/30" : placement ? "bg-emerald-500/20 hover:bg-emerald-500/30" : tooClose ? "bg-yellow-500/10 hover:bg-yellow-500/20" : "bg-zinc-950/80 hover:bg-zinc-900"}`}
                              title={`Koord: ${x + 1} × ${rowY + 1}`}
                            >
                              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-200">
                                {placement ? (
                                  <span className="text-lg">{SEEDLINGS.find((item) => item.id === placement.seedlingId)?.icon}</span>
                                ) : blocked ? (
                                  <span className="text-sm font-semibold text-red-200">✕</span>
                                ) : tooClose ? (
                                  <span className="text-xs text-yellow-300">!</span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Langelio dydis</p>
                    <p className="mt-2 text-lg font-semibold text-white">1 m × 1 m</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Pažymėtų sodinukų skaičius</p>
                    <p className="mt-2 text-lg font-semibold text-white">{placedCount}</p>
                  </div>
                  <div className="rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Blokavimo langeliai</p>
                    <p className="mt-2 text-lg font-semibold text-white">{blockedCount}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-xl shadow-black/10">
                <h2 className="text-xl font-semibold text-white">Medžių išdėstymas</h2>
                <p className="mt-3 text-sm text-zinc-400">Šis sąrašas leidžia patikrinti, kuriuose taškuose pažymėti sodinukai.</p>
                <div className="mt-5 space-y-3">
                  {placements.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-center text-zinc-500">Dar nėra pažymėta sodinukų.</div>
                  ) : (
                    placements.map((placement, index) => {
                      const seedling = SEEDLINGS.find((item) => item.id === placement.seedlingId);
                      return (
                        <div key={`${placement.x}-${placement.y}-${placement.seedlingId}-${index}`} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{seedling?.icon}</span>
                            <div>
                              <p className="font-semibold text-white">{seedling?.name}</p>
                              <p className="text-xs text-zinc-500">Koord.: {placement.x + 1} × {placement.y + 1}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{seedling?.distance} m</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
{placements.length > 0 && recommendations.length > 0 && (
  <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-xl shadow-black/10 mt-8">
    <h2 className="text-2xl font-bold text-white">Sodinukų skelbimai</h2>
    <p className="mt-3 text-sm text-zinc-400">
      Šis sąrašas pateikia pasirinktų medžių sodinukų skelbimus platformoje.
    </p>

    {/* Large card grid layout - removed the inner wrapper and cleaned up nesting */}
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((rec, index) => (
        <Link
          key={`${rec.id_Skelbimas}-${index}`}
          href={`/skelbimas/${rec.id_Skelbimas}`}
          className="group block rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-green-500/50 hover:shadow-lg"
        >
          {/* Large image container */}
          <div className="relative mb-6 flex h-56 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 text-6xl">
            {rec.photo ? (
              <img
                src={rec.photo}
                alt={rec.name || "Sodinukas"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              "🌱"
            )}
          </div>

          {/* Title and details */}
          <h3 className="text-lg font-semibold text-white">
            {rec.name || "Nenurodytas pavadinimas"}
          </h3>
          {rec.latin_name && (
            <p className="mt-1 text-xs italic text-zinc-500">
              {rec.latin_name}
            </p>
          )}

          <div className="mt-6 flex w-full items-center justify-between">
            <span className="text-lg font-bold text-green-700 dark:text-green-400">
              {Number(rec.price).toFixed(2)} €
            </span>
            <span className="text-xs font-medium text-green-400 underline-offset-4 group-hover:underline">
              Sužinoti daugiau
            </span>
          </div>
        </Link>
      ))}
    </div>
  </div>
)}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
