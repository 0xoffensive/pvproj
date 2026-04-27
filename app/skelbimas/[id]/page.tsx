"use client";
// interfaces
import { Chat } from "../../interfaces/chat";
// rest
import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "../../components/Navbar";
import { tr } from "framer-motion/client";

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
  imone_kodas?: string;
  nuotrauka?: string | null;
  fk_Vartotojasid_Vartotojas: string;
}

export default function SkelbimasDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [skelbimas, setSkelbimas] = useState<Skelbimas | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const id = params.id as string;
  const userId = (session?.user as any)?.id;

  type ChatCheckResponse = Chat | { chatId: -1 };

  const handleStartChat = async () => {
    if (!session) return alert("Prisijunkite!");
    if (!userId) return alert("Nerasta vartotojo ID");

    try {
      const response = await fetch(
        `/api/chats/get/?postId=${id}&userId=${userId}`,
      );
      let chatData: ChatCheckResponse = await response.json();
      let newChat: Chat;

      if (chatData.chatId === -1) {
        console.log("postId in POSTpage:", skelbimas?.id_Skelbimas);
        newChat = {
          chatId: -1, // temporary ID until we get the real one from the server
          name: skelbimas!.pavadinimas,
          image: skelbimas!.nuotrauka || null,
          postId: skelbimas!.id_Skelbimas, // include postId for chat creation
        };

        const event = new CustomEvent("openChat", {
          detail: { data: newChat },
        });
      } else {
        newChat = chatData as Chat;
        newChat.image = skelbimas!.nuotrauka || null;
      }

      const event = new CustomEvent("openChat", {
        detail: { data: newChat },
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchSkelbimas = async () => {
      try {
        const res = await fetch(`/api/skelbimai?id=${id}`);
        if (!res.ok) throw new Error("Nepavyko gauti skelbimo");
        const data = await res.json();

        // Find the specific listing safely
        const listing =
          data.find((s: Skelbimas) => s.id_Skelbimas === parseInt(id)) ||
          data[0];
        if (listing) {
          setSkelbimas(listing);
        }
      } catch (error) {
        console.error("Klaida:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkelbimas();
  }, [id]);

  useEffect(() => {
    if (!skelbimas || !userId || !session) return;

    if (
      String(skelbimas.fk_Vartotojasid_Vartotojas) === String(userId) ||
      skelbimas.statusas !== "aktyvus" ||
      session?.user.role === "atstovas"
    ) {
      setIsDisabled(true);
    }
  }, [skelbimas, userId, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <Navbar />
        <div className="pt-32 px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!skelbimas) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <Navbar />
        <div className="pt-32 px-6 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Skelbimas nerastas</p>
          <Link
            href="/skelbimas"
            className="text-green-700 dark:text-green-400 mt-4 inline-block hover:underline"
          >
            Grįžti į turgavietę
          </Link>
        </div>
      </div>
    );
  }

  const isPrivateSeller = !skelbimas.imone_kodas;
  const isAktyvus =
    skelbimas.statusas === "aktyvus" || skelbimas.statusas === "galimas"; // fallback for old ones

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />

      <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-24 pb-12">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            href="/skelbimas"
            className="text-sm text-green-700 dark:text-green-400 hover:underline mb-4 inline-block"
          >
            ← Grįžti į turgavietę
          </Link>
          <h1 className="mt-2 text-4xl font-bold">{skelbimas.pavadinimas}</h1>
          <p className="mt-2 text-lg italic text-zinc-600 dark:text-zinc-400">
            {skelbimas.lotyniskas_pav}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-8 flex h-96 items-center justify-center rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-6xl overflow-hidden shadow-sm">
              {skelbimas.nuotrauka ? (
                <img
                  src={skelbimas.nuotrauka}
                  alt={skelbimas.pavadinimas}
                  className="w-full h-full object-cover"
                />
              ) : (
                "🌲"
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8">
              <h2 className="text-2xl font-bold mb-6">Skelbimo detalės</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {skelbimas.amzius && (
                  <div>
                    <p className="text-sm text-zinc-600">Amžius</p>
                    <p className="text-lg font-semibold">
                      {skelbimas.amzius} metų
                    </p>
                  </div>
                )}
                {skelbimas.aukstis && (
                  <div>
                    <p className="text-sm text-zinc-600">Aukštis</p>
                    <p className="text-lg font-semibold">
                      {skelbimas.aukstis} cm
                    </p>
                  </div>
                )}
                {skelbimas.plotis && (
                  <div>
                    <p className="text-sm text-zinc-600">Plotis</p>
                    <p className="text-lg font-semibold">
                      {skelbimas.plotis} cm
                    </p>
                  </div>
                )}
                {skelbimas.min_kiekis && (
                  <div>
                    <p className="text-sm text-zinc-600">Minimalus kiekis</p>
                    <p className="text-lg font-semibold">
                      {skelbimas.min_kiekis} vnt.
                    </p>
                  </div>
                )}
                {skelbimas.tipas && (
                  <div>
                    <p className="text-sm text-zinc-600">Tipas</p>
                    <p className="text-lg font-semibold">{skelbimas.tipas}</p>
                  </div>
                )}
                {skelbimas.kilme && (
                  <div>
                    <p className="text-sm text-zinc-600">Kilmė</p>
                    <p className="text-lg font-semibold">{skelbimas.kilme}</p>
                  </div>
                )}
                {skelbimas.vieta && (
                  <div>
                    <p className="text-sm text-zinc-600">Vieta</p>
                    <p className="text-lg font-semibold">{skelbimas.vieta}</p>
                  </div>
                )}
                {skelbimas.pristatymo_budas && (
                  <div>
                    <p className="text-sm text-zinc-600">Pristatymas</p>
                    <p className="text-lg font-semibold">
                      {skelbimas.pristatymo_budas}
                    </p>
                  </div>
                )}
              </div>

              {skelbimas.aprasymas && (
                <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
                  <h3 className="text-lg font-bold mb-4">Aprašymas</h3>
                  <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                    {skelbimas.aprasymas}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 mb-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Kaina
              </p>
              <p className="text-4xl font-bold text-green-700 dark:text-green-400">
                {Number(skelbimas.kaina).toFixed(2)} €
              </p>
              <p
                className={`mt-2 text-sm font-medium ${
                  isAktyvus
                    ? "text-green-700 dark:text-green-400"
                    : "text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {isAktyvus ? "✓ Aktyvus" : "⚠ Neaktyvus"}
              </p>
            </div>

            {skelbimas.imone_pavadinimas && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 mb-6">
                <h3 className="text-lg font-bold mb-4">
                  Pardavėjo informacija
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {isPrivateSeller ? "Pardavėjas" : "Įmonė"}
                    </p>
                    <p className="font-semibold text-zinc-900 flex items-center gap-2 dark:text-white">
                      {isPrivateSeller && <span>👤</span>}
                      {!isPrivateSeller && <span>🏢</span>}
                      {skelbimas.imone_pavadinimas}
                    </p>
                  </div>

                  {!isPrivateSeller && skelbimas.imone_adresas && (
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Adresas
                      </p>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {skelbimas.imone_adresas} {skelbimas.imone_pastato_nr}
                      </p>
                    </div>
                  )}

                  {skelbimas.imone_miestas && (
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Miestas
                      </p>
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {skelbimas.imone_miestas}
                      </p>
                    </div>
                  )}

                  {skelbimas.imone_tel_nr && (
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Telefono Nr.
                      </p>
                      {!session ? (
                        <p className="text-sm text-zinc-500 italic mt-1 bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded inline-block">
                          Prisijunkite, kad matytumėte
                        </p>
                      ) : !showPhone ? (
                        <button
                          onClick={() => setShowPhone(true)}
                          className="mt-1 text-sm font-semibold text-green-700 dark:text-green-400 hover:underline"
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

                  {skelbimas.imone_svetaine && (
                    <div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Svetainė
                      </p>
                      <a
                        href={skelbimas.imone_svetaine}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-green-700 dark:text-green-400 hover:underline break-all"
                      >
                        {skelbimas.imone_svetaine.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleStartChat()}
                  disabled={session?.user.role === "atstovas"}
                  className={`mt-6 w-full rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors 
                  ${
                    isDisabled // contradictory, but just in case
                      ? "bg-slate-500 cursor-not-allowed opacity-60"
                      : "bg-green-700 hover:bg-green-800"
                  }`}
                >
                  💬 Pradėti pokalbį
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
