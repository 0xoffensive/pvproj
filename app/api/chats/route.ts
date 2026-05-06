import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { u } from "framer-motion/client";

// CHATS (POKALBIAI) ENDPOINT
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const announcerId = searchParams.get("announcerId");
    let rows: RowDataPacket[] = [];

    if (userId) {
      const [results] = await pool.execute<RowDataPacket[]>(
        `
        SELECT
        p.id_Pokalbis AS id,
        s.pavadinimas AS name,
        n.ref AS image
        FROM pokalbiai p
        LEFT JOIN skelbimai s ON p.fk_Skelbimasid_Skelbimas = s.id_Skelbimas
        LEFT JOIN nuotraukos n ON s.id_Skelbimas = n.fk_Skelbimasid_Skelbimas
        WHERE fk_Vartotojasid_Vartotojas = ?
    `,
        [userId],
      );
      rows = results;
    } else if (announcerId) {
      const [results] = await pool.execute<RowDataPacket[]>(
        `
        SELECT
        p.id_Pokalbis AS id,
        CONCAT(v.vardas, ' : ', s.pavadinimas) AS name,
        n.ref AS image
        FROM pokalbiai p
        LEFT JOIN skelbimai s ON p.fk_Skelbimasid_Skelbimas = s.id_Skelbimas
        LEFT JOIN imones i ON s.fk_Imoneid_Imone = i.id_Imone
        LEFT JOIN vartotojai v ON p.fk_Vartotojasid_Vartotojas = v.id_Vartotojas
        LEFT JOIN nuotraukos n ON s.id_Skelbimas = n.fk_Skelbimasid_Skelbimas
        WHERE i.fk_Vartotojasid_Vartotojas = ?
    `,
        [announcerId],
      );
      rows = results;
    }

    const formattedRows = rows.map((ch) => {
      let base64Image = null;
      if (ch.image) {
        // Convert Buffer from MySQL to Base64 string
        const buffer = Buffer.from(ch.image);
        base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      }
      return {
        chatId: ch.id,
        name: ch.name,
        image: base64Image,
      };
    });

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Nepavyko gauti pokalbių" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user.id;

    if (!session?.user) {
      return NextResponse.json(
        { error: `Privaloma būti prisijungus ${session?.expires}` },
        { status: 401 },
      );
    }

    if (userId === undefined) {
      return NextResponse.json(
        { error: "Nerasta vartotojo ID sesijoje" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { postId } = body;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO pokalbiai (
        fk_Vartotojasid_Vartotojas, fk_Skelbimasid_Skelbimas
      ) VALUES (?, ?)`,
      [userId, postId],
    );

    return NextResponse.json(
      { message: "Pokalbis sėkmingai sukurtas!", id: result.insertId },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Serverio klaida." }, { status: 500 });
  }
}
