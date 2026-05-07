import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "administratorius") {
      return NextResponse.json({ error: "Nėra prieigos" }, { status: 403 });
    }

    const [skelbimai] = await pool.execute<RowDataPacket[]>(
      `SELECT s.*, i.pavadinimas as imone_pavadinimas, v.slapyvardis as vartotojas_slapyvardis
       FROM skelbimai s
       LEFT JOIN imones i ON s.fk_Imoneid_Imone = i.id_Imone
       LEFT JOIN Vartotojai v ON i.fk_Vartotojasid_Vartotojas = v.id_Vartotojas
       ORDER BY s.data DESC`
    );

    return NextResponse.json(skelbimai);
  } catch (error) {
    console.error("GET admin skelbimai error:", error);
    return NextResponse.json({ error: "Nepavyko gauti skelbimų" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "administratorius") {
      return NextResponse.json({ error: "Nėra prieigos" }, { status: 403 });
    }

    const { id, action, ...updates } = await request.json();

    if (action === "activate") {
      await pool.execute(
        "UPDATE skelbimai SET statusas = 'aktyvus' WHERE id_Skelbimas = ?",
        [id]
      );
      return NextResponse.json({ message: "Skelbimas aktyvuotas" });
    }

    if (action === "update") {
      const fields = [];
      const values = [];

      if (updates.pavadinimas) {
        fields.push("pavadinimas = ?");
        values.push(updates.pavadinimas);
      }
      if (updates.aprasymas) {
        fields.push("aprasymas = ?");
        values.push(updates.aprasymas);
      }
      if (updates.kaina !== undefined) {
        fields.push("kaina = ?");
        values.push(updates.kaina);
      }
      if (updates.statusas) {
        fields.push("statusas = ?");
        values.push(updates.statusas);
      }

      if (fields.length > 0) {
        values.push(id);
        await pool.execute(
          `UPDATE skelbimai SET ${fields.join(", ")} WHERE id_Skelbimas = ?`,
          values
        );
      }
      return NextResponse.json({ message: "Skelbimas atnaujintas" });
    }

    return NextResponse.json({ error: "Neteisingas veiksmas" }, { status: 400 });
  } catch (error) {
    console.error("PUT admin skelbimai error:", error);
    return NextResponse.json({ error: "Nepavyko atnaujinti skelbimo" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "administratorius") {
      return NextResponse.json({ error: "Nėra prieigos" }, { status: 403 });
    }

    const { id } = await request.json();

    // Delete ad
    await pool.execute("DELETE FROM skelbimai WHERE id_Skelbimas = ?", [id]);

    return NextResponse.json({ message: "Skelbimas ištrintas" });
  } catch (error) {
    console.error("DELETE admin skelbimai error:", error);
    return NextResponse.json({ error: "Nepavyko ištrinti skelbimo" }, { status: 500 });
  }
}