// interfaces

// rest
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { authOptions } from "@/lib/auth";
import { th } from "framer-motion/client";
import { pusherServer } from "@/lib/pusher-server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");
  const userId = session?.user.id;
  console.log("REACHED!");
  let rows: RowDataPacket[] = [];

  try {
    const [results] = await pool.execute<RowDataPacket[]>(
      `
        SELECT
        z.tekstas,
        z.data,
        z.busena,
        z.id_Zinute,
        z.fk_Vartotojasid_Vartotojas,
        z.fk_Pokalbisid_Pokalbis
        FROM zinutes z
        WHERE z.fk_Pokalbisid_Pokalbis = ?
    `,
      [chatId],
    );
    rows = results;

    const formattedRows = rows.map((ch) => {
      const fsender =
        String(ch.fk_Vartotojasid_Vartotojas) === userId ? "thisUser" : "other";
      return {
        messageId: ch.id_Zinute,
        chatId: ch.fk_Pokalbisid_Pokalbis,
        senderId: ch.fk_Vartotojasid_Vartotojas,
        sender: fsender,
        status: ch.busena,
        text: ch.tekstas,
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

    if (!session?.user) {
      return NextResponse.json(
        { error: `Privaloma prisijungti kaip pardavėjui ${session?.expires}` },
        { status: 401 },
      );
    }

    const userId = session?.user.id;

    const body = await request.json();
    const { tekstas, busena, fk_Pokalbisid_Pokalbis } = body;
    console.log("data: ", tekstas, busena, fk_Pokalbisid_Pokalbis);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO zinutes (
        tekstas, data, busena, fk_Vartotojasid_Vartotojas, fk_Pokalbisid_Pokalbis
      ) VALUES (?, NOW(3), ?, ?, ?)`,
      [tekstas, "issiusta", userId, fk_Pokalbisid_Pokalbis],
    );

    const newMessage = {
      messageId: result.insertId,
      chatId: fk_Pokalbisid_Pokalbis,
      senderId: userId,
      sender: "other", // 👈 For everyone else listening, this is an "other" message
      status: "issiusta",
      text: tekstas,
      timestamp: new Date().toISOString(),
    };

    await pusherServer.trigger(
      `chat-${fk_Pokalbisid_Pokalbis}`,
      "upcoming-message",
      newMessage,
    );

    return NextResponse.json(
      {
        message: "Žinutė sėkmingai išsiųsta!",
        id: result.insertId,
        newMessage: { ...newMessage, sender: "thisUser" },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Serverio klaida." }, { status: 500 });
  }
}
