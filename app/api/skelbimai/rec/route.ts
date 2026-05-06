import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import pool from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const nameParams = url.searchParams.getAll("name");
    
    let query = `
      SELECT 
        s.*,
        (SELECT ref FROM nuotraukos n WHERE n.fk_Skelbimasid_Skelbimas = s.id_Skelbimas LIMIT 1) as nuotrauka
      FROM skelbimai s
      WHERE 1=1
    `;

    const params: any[] = [];

    if (nameParams && nameParams.length > 0) {
      const placeholders = nameParams.map(() => `s.pavadinimas LIKE ?`).join(" OR ");
      query += ` AND (${placeholders})`;
      
      nameParams.forEach((name) => {
        params.push(`%${name}%`);
      });
    }

    console.log("Constructed SQL Query:", query);

    query += " ORDER BY s.data DESC";

    const [skelbimai] = await pool.execute<RowDataPacket[]>(query, params);

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