"use client";

import Link from "next/link";
import Navbar from "./components/Navbar";
import { useState, useEffect } from "react";

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

export default function GuestPage() {
  const [skelbimai, setSkelbimai] = useState<Skelbimas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkelbimai = async () => {
      try {
        const res = await fetch("/api/skelbimai?maxPrice=99999&statusas=galimas");
        if (!res.ok) throw new Error("Nepavyko gauti skelbiimų");
        const data = await res.json();
        // Take only the first 4 listings for the homepage
        setSkelbimai(data.slice(0, 4));
      } catch (error) {
        console.error("Klaida:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkelbimai();
  }, []);

  return (
    
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* ── NAVIGATION ── */}
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative flex min-h-[82svh] flex-col items-center justify-center px-4 pt-20 text-center sm:min-h-screen sm:px-6 sm:pt-24">
        {/* Background gradient decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/20" />
        </div>


        <div className="relative z-10 mx-auto max-w-4xl">
          <span className="mb-6 inline-block rounded-full bg-green-100 dark:bg-green-900/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-green-800 dark:text-green-300">
            Miško sodinukų platforma
          </span>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Sodink protingai.{" "}
            <span className="text-green-700 dark:text-green-400">Augink atsakingai.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:mt-6 sm:text-lg">
            Raskite geriausius miško sodinukus, suplanuokite sodinimą su interaktyviu žemėlapiu ir
            gaukite mokslu pagrįstas rekomendacijas — viskas vienoje vietoje.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex h-14 w-full items-center justify-center rounded-xl bg-green-700 px-8 text-base font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800 hover:shadow-xl hover:shadow-green-700/30 sm:w-auto"
            >
              Pradėti nemokamai
            </Link>
            <a
              href="#how-it-works"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 dark:border-zinc-700 px-8 text-base font-semibold transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:w-auto"
            >
              Kaip tai veikia?
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 sm:mt-20 sm:gap-8 sm:p-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 sm:text-3xl">50+</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">Sodinukų rūšių</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 sm:text-3xl">100+</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">Pardavėjų</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400 sm:text-3xl">∞</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">Sodinimo planų</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
            Funkcijos
          </span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Viskas ko reikia miško sodinimui</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
            Nuo sodinukų paieškos iki profesionalaus sodinimo plano — viena platforma visiems.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-16 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 sm:p-8 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl">🗺️</div>
            <h3 className="text-lg font-semibold">Interaktyvus žemėlapis</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Pažymėkite savo sklypą žemėlapyje, pasirinkite sodinimo zoną ir gaukite vizualų sodinimo planą su tiksliu medžių išdėstymu.</p>
          </div>
          <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 sm:p-8 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl">🌱</div>
            <h3 className="text-lg font-semibold">Išmanus sodinimo planuotojas</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Algoritmas atsižvelgia į rūšių suderinamumą, dirvožemio rūgštingumą, klimato zoną ir tarpus tarp medžių — optimaliam augimui.</p>
          </div>
          <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 sm:p-8 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl">🛒</div>
            <h3 className="text-lg font-semibold">Sodinukų turgavietė</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Peržiūrėkite verslininkų skelbiamus sodinukus, palyginkite kainas ir susisiekite tiesiogiai per mūsų pokalbių sistemą.</p>
          </div>
          <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 sm:p-8 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl">💬</div>
            <h3 className="text-lg font-semibold">Pokalbių sistema</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Bendraujkite su pardavėjais tiesiogiai platformoje. Aptarkite kainas, pristatymo sąlygas ir kitus klausimus.</p>
          </div>
          <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 sm:p-8 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl">📋</div>
            <h3 className="text-lg font-semibold">Pirkimo sąrašas</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Baigę planavimą, gausite tikslų sodinukų sąrašą su kiekiais ir nuorodomis į esamus pardavėjų pasiūlymus.</p>
          </div>
          <div className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 sm:p-8 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-2xl">📊</div>
            <h3 className="text-lg font-semibold">Verslo skelbimų valdymas</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Verslininkai gali lengvai įkelti savo sodinukų pasiūlymus, valdyti atsargas ir stebėti pirkėjų užklausas.</p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ── */}
      <section id="how-it-works" className="bg-zinc-50 dark:bg-zinc-900 py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">Kaip veikia</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Trys paprasti žingsniai</h2>
          </div>
          <div className="mt-10 grid gap-8 sm:mt-16 sm:gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 text-2xl font-bold text-white shadow-lg shadow-green-700/25">1</div>
              <h3 className="mt-6 text-xl font-semibold">Pažymėkite savo sklypą</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Naudokite interaktyvų žemėlapį, kad nurodytumėte savo vietovę. Pasirinkite teritoriją, kurią norite apsodinti.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 text-2xl font-bold text-white shadow-lg shadow-green-700/25">2</div>
              <h3 className="mt-6 text-xl font-semibold">Gaukite sodinimo planą</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Pasirinkite medžių rūšis ir nurodykite dirvožemio savybes. Mūsų algoritmas sukurs optimalų sodinimo išdėstymą.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 text-2xl font-bold text-white shadow-lg shadow-green-700/25">3</div>
              <h3 className="mt-6 text-xl font-semibold">Raskite sodinukų</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">Peržiūrėkite turgavietėje esamus pardavėjų pasiūlymus ir susisiekite su jais per pokalbių sistemą.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKETPLACE PREVIEW SECTION ── */}
      <section id="marketplace" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">Turgavietė</span>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Populiariausi sodinukai</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">Štai keletas pavyzdžių, ką galite rasti mūsų platformoje.</p>
        </div>
        
        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 sm:p-6 animate-pulse">
                <div className="mb-4 h-32 sm:h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="mb-2 h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mb-4 h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-4 h-8 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : skelbimai.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {skelbimai.map((skelbimas) => (
              <Link key={skelbimas.id_Skelbimas} href={`/skelbimas/${skelbimas.id_Skelbimas}`} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-5 sm:p-6 transition-all hover:border-green-300 dark:hover:border-green-800 hover:shadow-lg">
                <div className="h-32 sm:h-40 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-4 flex items-center justify-center relative">
                  {skelbimas.nuotrauka ? (
                    <img
                      src={skelbimas.nuotrauka}
                      alt={skelbimas.pavadinimas}
                      className="w-full h-full object-cover" />
                    ) : (
                    <span className="text-4xl">🌲</span>
                    )}
                </div>
                <h3 className="font-semibold">{skelbimas.pavadinimas}</h3>
                <p className="text-xs italic text-zinc-500 dark:text-zinc-400">{skelbimas.lotyniskas_pav || "Nenurodyta"}</p>
                <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {skelbimas.amzius && <span>Amžius: {skelbimas.amzius} m.</span>}
                  {skelbimas.aukstis && <span>Aukštis: {skelbimas.aukstis} cm</span>}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">nuo {Number(skelbimas.kaina).toFixed(2)} €</span>
                  <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">Yra</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 sm:p-12 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Šiuo metu nėra aktyvių skelbiimų. Grįžkite vėliau!</p>
          </div>
        )}
        
        <div className="mt-10 text-center">
          <Link href="/skelbimas" className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 dark:border-zinc-700 px-8 text-sm font-semibold transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Peržiūrėti visus sodinukus →
          </Link>
        </div>
      </section>

      {/* ── PLANNER PREVIEW SECTION ── */}
      <section id="planner" className="bg-zinc-50 dark:bg-zinc-900 py-14 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-10 sm:gap-16 lg:grid-cols-2">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">Sodinimo planuotojas</span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Jūsų miškas, suprojektuotas mokslo pagrindu</h2>
              <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
                Mūsų interaktyvus įrankis leidžia pasirinkti sklypą žemėlapyje ir automatiškai suprojektuoti
                optimalų medžių išdėstymą, atsižvelgiant į:
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Rūšių suderinamumą — kurios rūšys auga greta",
                  "Dirvožemio savybes — pH, drėgmė, tipas",
                  "Klimato zoną — Lietuvos regionų ypatumai",
                  "Tarpų reikalavimus — optimalus atstumas tarp medžių",
                  "Esamą augmeniją — atsižvelgiama į tai, kas jau auga",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-700 text-xs text-white">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/planavimas" className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-green-700 px-8 text-sm font-semibold text-white shadow-lg shadow-green-700/25 transition-all hover:bg-green-800">
                Išbandyti planuotoją
              </Link>
            </div>
            <div className="flex h-64 sm:h-96 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950">
              <div className="text-center">
                <span className="text-6xl">🗺️</span>
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Interaktyvaus žemėlapio vieta</p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">(Čia bus integruotas žemėlapis)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-24">
        <div className="rounded-3xl bg-green-700 p-8 text-center text-white shadow-2xl shadow-green-700/20 sm:p-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Pasiruošę sodinti?</h2>
          <p className="mx-auto mt-4 max-w-xl text-green-100">
            Prisijunkite prie augančios miško sodinukų bendruomenės. Nesvarbu ar perkate, ar parduodate —
            mes padėsime jums kiekviename žingsnyje.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register" className="flex h-14 w-full items-center justify-center rounded-xl bg-white px-8 text-base font-semibold text-green-700 transition-colors hover:bg-green-50 sm:w-auto">
              Registruotis kaip pirkėjas
            </Link>
            <Link href="/register" className="flex h-14 w-full items-center justify-center rounded-xl border-2 border-white/30 px-8 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
              Registruotis kaip pardavėjas
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-10 sm:gap-6 sm:px-6 sm:py-12 sm:flex-row">
          <div className="flex items-center gap-2 text-lg font-bold text-green-700 dark:text-green-400">
            <span>🌲</span>
            Dievų Giria
          </div>
          <div className="flex gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privatumo politika</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Naudojimo sąlygos</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Kontaktai</a>
          </div>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">© 2026 Dievų Giria. Visos teisės saugomos.</p>
        </div>
      </footer>
    </div>
  );
}