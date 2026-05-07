import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const minPrice = parseFloat(url.searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(url.searchParams.get("maxPrice") || "99999");

    // Fetch listings (Only active, unless fetching specific ID)
    let query = `
      SELECT 
        s.*,
        i.pavadinimas as imone_pavadinimas,
        i.miestas as imone_miestas,
        i.tel_nr as imone_tel_nr,
        i.svetaine as imone_svetaine,
        i.adresas as imone_adresas,
        i.pastato_nr as imone_pastato_nr,
        i.imones_kodas as imone_kodas,
        i.fk_Vartotojasid_Vartotojas as fk_Vartotojasid_Vartotojas,
        (SELECT ref FROM nuotraukos n WHERE n.fk_Skelbimasid_Skelbimas = s.id_Skelbimas LIMIT 1) as nuotrauka
      FROM skelbimai s
      LEFT JOIN imones i ON s.fk_Imoneid_Imone = i.id_Imone
      WHERE s.statusas = 'aktyvus' OR s.statusas = 'galimas'
    `;
    const params: any[] = [];

    if (id) {
      // If fetching a specific listing by ID, we allow seeing it even if inactive (for the seller viewing it)
      query = `
        SELECT 
          s.*,
          i.pavadinimas as imone_pavadinimas,
          i.miestas as imone_miestas,
          i.tel_nr as imone_tel_nr,
          i.svetaine as imone_svetaine,
          i.adresas as imone_adresas,
          i.pastato_nr as imone_pastato_nr,
          i.imones_kodas as imone_kodas,
          i.fk_Vartotojasid_Vartotojas as fk_Vartotojasid_Vartotojas,
          (SELECT ref FROM nuotraukos n WHERE n.fk_Skelbimasid_Skelbimas = s.id_Skelbimas LIMIT 1) as nuotrauka
        FROM skelbimai s
        LEFT JOIN Imones i ON s.fk_Imoneid_Imone = i.id_Imone
        WHERE s.id_Skelbimas = ?
      `;
      params.push(parseInt(id));
    } else {
      query += " AND s.kaina >= ? AND s.kaina <= ?";
      params.push(minPrice, maxPrice);
    }

    query += " ORDER BY s.data DESC";

    const [skelbimai] = await pool.execute<RowDataPacket[]>(query, params);

    // Safely convert BLOB images to string if necessary
    const formattedSkelbimai = skelbimai.map((sk) => {
      let base64Image = null;

      if (sk.nuotrauka) {
        const buffer = Buffer.from(sk.nuotrauka);
        base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      }

      return {
        ...sk,
        nuotrauka: base64Image,
      };
    });

    return NextResponse.json(formattedSkelbimai);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Nepavyko gauti skelbimų" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      ((session.user as any).role !== "atstovas" &&
        (session.user as any).role !== "administratorius")
    ) {
      return NextResponse.json(
        {
          error: "Privaloma prisijungti kaip pardavėjui arba administratoriui",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      pavadinimas,
      aprasymas,
      kaina,
      min_kiekis,
      vieta,
      amzius,
      aukstis,
      plotis,
      lotyniskas_pav,
      tipas,
      kilme,
      atstumas,
      pristatymo_budas,
      nuotrauka,
    } = body;

    if (!pavadinimas || !kaina) {
      return NextResponse.json(
        { error: "Pavadinimas ir kaina privalomi" },
        { status: 400 },
      );
    }

    const userId = (session.user as any).id || session.user.email;
    let [imones] = await pool.execute<RowDataPacket[]>(
      "SELECT id_Imone FROM imones WHERE fk_Vartotojasid_Vartotojas = ?",
      [userId],
    );

    let imoneId = imones.length > 0 ? imones[0].id_Imone : null;

    // If no company exists (for admin), create a dummy one
    if (!imoneId) {
      const [userData] = await pool.execute<RowDataPacket[]>(
        "SELECT vardas, pavarde FROM vartotojai WHERE id_Vartotojas = ?",
        [userId],
      );

      if (userData.length > 0) {
        const user = userData[0];
        const [insertResult] = await pool.execute<ResultSetHeader>(
          "INSERT INTO imones (pavadinimas, fk_Vartotojasid_Vartotojas) VALUES (?, ?)",
          [`${user.vardas} ${user.pavarde} (Admin)`, userId],
        );
        imoneId = insertResult.insertId;
      } else {
        return NextResponse.json(
          { error: "Vartotojo duomenys nerasti." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Nėra sukurtos jūsų įmonės." },
        { status: 400 },
      );
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO skelbimai (
        pavadinimas, aprasymas, kaina, min_kiekis, vieta, 
        amzius, aukstis, plotis, lotyniskas_pav, tipas, kilme, 
        atstumas, pristatymo_budas, statusas, data, fk_Imoneid_Imone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktyvus', NOW(), ?)`,
      [
        pavadinimas,
        aprasymas || null,
        kaina,
        min_kiekis || 1,
        vieta || null,
        amzius || null,
        aukstis || null,
        plotis || null,
        lotyniskas_pav || null,
        tipas || null,
        kilme || null,
        atstumas || null,
        pristatymo_budas || "atsiimti_patiems",
        imoneId,
      ],
    );

    const newId = result.insertId;
    // Handle Image insertion safely
    if (nuotrauka) {
      const base64Data = nuotrauka.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      await pool.execute(
        "INSERT INTO nuotraukos (ref, fk_Skelbimasid_Skelbimas) VALUES (?, ?)",
        [buffer, newId],
      );
    }

    return NextResponse.json(
      { message: "Skelbimas sėkmingai sukurtas!", id: newId },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Serverio klaida." }, { status: 500 });
  }
}
