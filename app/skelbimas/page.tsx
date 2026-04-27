"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "../components/Navbar";

interface Skelbimas {
  id_Skelbimas: number;
  pavadinimas: string;
  aprasymas: string;
  kaina: number;
  min_kiekis: number;
  vieta: string;
  data: string;
  amzius: number;
  aukstis: number;
  plotis: number;
  lotyniskas_pav: string;
  tipas: string;
  kilme: string;
  atstumas: number;
  pristatymo_budas: string;
  statusas: string;
  imone_pavadinimas?: string;
  imone_miestas?: string;
  imone_tel_nr?: string;
  imone_svetaine?: string;
  imone_adresas?: string;
  imone_pastato_nr?: string;
  nuotrauka?: string | null;
}

// Helper function to remove Lithuanian diacritics
const normalizeText = (text: string | null | undefined) => {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

export default function SkelbiaiPage() {
  const { data: session } = useSession();
  const [skelbimai, setSkelbimai] = useState<Skelbimas[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedPhones, setRevealedPhones] = useState<Record<number, boolean>>(
    {},
  );
  const [filtras, setFiltras] = useState({
    rusisMins: 0,
    rusisMaks: 10000,
    pavadinimas: "", // Acts as universal search for both names
    amzius: "",
    aukstis: "",
    vieta: "",
    kilme: "",
  });

  useEffect(() => {
    fetchSkelbimai();
  }, [filtras]);

  const fetchSkelbimai = async () => {
    try {
      const params = new URLSearchParams();
      params.append("minPrice", filtras.rusisMins.toString());
      params.append("maxPrice", filtras.rusisMaks.toString());
      if (filtras.pavadinimas) {
        params.append("pavadinimas", filtras.pavadinimas);
      }
      if (filtras.amzius) {
        params.append("amzius", filtras.amzius);
      }
      if (filtras.aukstis) {
        params.append("aukstis", filtras.aukstis);
      }
      if (filtras.vieta) {
        params.append("vieta", filtras.vieta);
      }
      if (filtras.kilme) {
        params.append("kilme", filtras.kilme);
      }

      const res = await fetch(`/api/skelbimai?${params}`);
      if (!res.ok) throw new Error("Nepavyko gauti skelbiimų");

      let data = await res.json();

      // Client-side filtering with normalized text matching
      data = data.filter((s: Skelbimas) => {
        // Universal Name Search (Regular & Latin)
        if (filtras.pavadinimas) {
          const searchQuery = normalizeText(filtras.pavadinimas);
          const nameMatch = normalizeText(s.pavadinimas).includes(searchQuery);
          const latinMatch = normalizeText(s.lotyniskas_pav).includes(
            searchQuery,
          );

          if (!nameMatch && !latinMatch) return false;
        }

        // Exact match for numbers
        if (filtras.amzius && s.amzius !== parseInt(filtras.amzius))
          return false;
        if (filtras.aukstis && s.aukstis !== parseInt(filtras.aukstis))
          return false;

        // Normalized match for text fields
        if (
          filtras.vieta &&
          !normalizeText(s.vieta).includes(normalizeText(filtras.vieta))
        )
          return false;
        if (
          filtras.kilme &&
          !normalizeText(s.kilme).includes(normalizeText(filtras.kilme))
        )
          return false;

        return true;
      });

      setSkelbimai(data);
    } catch (error) {
      console.error("Klaida:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />

      {/* HEADER */}
      <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                Turgavietė
              </span>
              <h1 className="mt-2 text-4xl font-bold">Visi sodinukai</h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Peržiūrėkite disponiblius sodinukus iš mūsų pardavėjų
              </p>
            </div>
            {session?.user && (session.user as any).role === "atstovas" && (
              <Link
                href="/skelbimas/kurti"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-green-700 px-8 text-sm font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800"
              >
                + Sukurti skelbimą
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
            <h3 className="font-semibold mb-4">Kainos diapazonas</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-600 dark:text-zinc-400">
                  Nuo: {filtras.rusisMins.toFixed(2)} €
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="10"
                  value={filtras.rusisMins}
                  onChange={(e) =>
                    setFiltras({
                      ...filtras,
                      rusisMins: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-600 dark:text-zinc-400">
                  Iki: {filtras.rusisMaks.toFixed(2)} €
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="10"
                  value={filtras.rusisMaks}
                  onChange={(e) =>
                    setFiltras({
                      ...filtras,
                      rusisMaks: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
            <h3 className="font-semibold mb-4">Paieška</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Pavadinimas (arba lotyniškas pav.)
                </label>
                <input
                  type="text"
                  value={filtras.pavadinimas}
                  onChange={(e) =>
                    setFiltras({ ...filtras, pavadinimas: e.target.value })
                  }
                  placeholder="pvz. Eglė arba Picea"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
            <h3 className="font-semibold mb-4">Savybės</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Amžius
                  </label>
                  <input
                    type="number"
                    value={filtras.amzius}
                    onChange={(e) =>
                      setFiltras({ ...filtras, amzius: e.target.value })
                    }
                    placeholder="2"
                    min="0"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                    Aukštis (cm)
                  </label>
                  <input
                    type="number"
                    value={filtras.aukstis}
                    onChange={(e) =>
                      setFiltras({ ...filtras, aukstis: e.target.value })
                    }
                    placeholder="40"
                    min="0"
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Vieta
                </label>
                <input
                  type="text"
                  value={filtras.vieta}
                  onChange={(e) =>
                    setFiltras({ ...filtras, vieta: e.target.value })
                  }
                  placeholder="pvz. Siauliai"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  Kilmė
                </label>
                <input
                  type="text"
                  value={filtras.kilme}
                  onChange={(e) =>
                    setFiltras({ ...filtras, kilme: e.target.value })
                  }
                  placeholder="pvz. Lietuva"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTINGS GRID */}
      <div className="mx-auto max-w-7xl px-6 pb-24">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 animate-pulse"
              >
                <div className="h-48 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4" />
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-3" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : skelbimai.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Nėra skelbimų, atitinkančių jūsų kriterijus
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skelbimai.map((skelbimas) => (
              <div
                key={skelbimas.id_Skelbimas}
                className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg"
              >
                <div className="mb-4 flex h-48 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800 text-5xl overflow-hidden">
                  {skelbimas.nuotrauka ? (
                    <img
                      src={skelbimas.nuotrauka}
                      alt={skelbimas.pavadinimas}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    "🌲"
                  )}
                </div>

                <h3 className="font-semibold text-lg">
                  {skelbimas.pavadinimas}
                </h3>
                <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
                  {skelbimas.lotyniskas_pav}
                </p>

                <div className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {skelbimas.amzius && <p>🎂 Amžius: {skelbimas.amzius} m.</p>}
                  {skelbimas.aukstis && (
                    <p>📏 Aukštis: {skelbimas.aukstis} cm</p>
                  )}
                  {skelbimas.kilme && <p>🌍 Kilmė: {skelbimas.kilme}</p>}
                  {skelbimas.vieta && <p>📍 Vieta: {skelbimas.vieta}</p>}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">
                    {Number(skelbimas.kaina).toFixed(2)} €
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      skelbimas.statusas === "galimas" ||
                      skelbimas.statusas === "aktyvus"
                        ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                        : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
                    }`}
                  >
                    {skelbimas.statusas === "galimas" ||
                    skelbimas.statusas === "aktyvus"
                      ? "Yra"
                      : "Ribotai"}
                  </span>
                </div>

                {skelbimas.aprasymas && (
                  <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {skelbimas.aprasymas}
                  </p>
                )}

                {skelbimas.imone_pavadinimas && (
                  <div className="mt-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-xs">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {skelbimas.imone_pavadinimas}
                    </p>
                    {skelbimas.imone_miestas && (
                      <p className="text-zinc-600 dark:text-zinc-400">
                        📍 {skelbimas.imone_miestas}
                      </p>
                    )}
                    {skelbimas.imone_tel_nr && (
                      <div className="text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1">
                        <span>📞</span>
                        {!session ? (
                          <span className="italic text-zinc-500">
                            Prisijunkite, kad matytumėte
                          </span>
                        ) : !revealedPhones[skelbimas.id_Skelbimas] ? (
                          <button
                            onClick={() =>
                              setRevealedPhones((prev) => ({
                                ...prev,
                                [skelbimas.id_Skelbimas]: true,
                              }))
                            }
                            className="font-semibold text-green-700 dark:text-green-400 hover:underline"
                          >
                            Rodyti numerį
                          </button>
                        ) : (
                          <a
                            href={`tel:${skelbimas.imone_tel_nr}`}
                            className="font-semibold text-green-700 dark:text-green-400 hover:underline"
                          >
                            {skelbimas.imone_tel_nr}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <Link
                  href={`/skelbimas/${skelbimas.id_Skelbimas}`}
                  className="mt-4 w-full inline-flex justify-center rounded-lg border border-green-700 dark:border-green-400 bg-white dark:bg-transparent py-2 text-sm font-medium text-green-700 dark:text-green-400 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  Sužinoti daugiau
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
