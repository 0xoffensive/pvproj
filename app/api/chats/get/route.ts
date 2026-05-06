import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const userId = searchParams.get("userId");

    const [rows] = await pool.execute<RowDataPacket[]>(
      `
      SELECT
        p.id_Pokalbis AS chatId,
        s.pavadinimas AS name
      FROM pokalbiai p
      LEFT JOIN skelbimai s ON p.fk_Skelbimasid_Skelbimas = s.id_Skelbimas
      WHERE fk_Vartotojasid_Vartotojas = ? AND fk_Skelbimasid_Skelbimas = ? 
      LIMIT 1
      `,
      [userId, postId],
    );

    if (rows.length === 0) {
      return NextResponse.json({ chatId: -1 });
    }

    const chat = rows[0];

    return NextResponse.json({
      chatId: chat.chatId,
      name: chat.name,
      //image: base64Image,
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Nepavyko gauti pokalbio" },
      { status: 500 },
    );
  }
}
