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

    const [users] = await pool.execute<RowDataPacket[]>(
      `SELECT id_Vartotojas, vardas, pavarde, e_pastas, slapyvardis, role, busena, tel_nr, miestas
       FROM vartotojai
       ORDER BY id_Vartotojas DESC`
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Nepavyko gauti vartotojų" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "administratorius") {
      return NextResponse.json({ error: "Nėra prieigos" }, { status: 403 });
    }

    const { id, action, ...updates } = await request.json();

    if (action === "approve") {
      // Approve user - set busena to aktyvus
      await pool.execute({
        sql: "UPDATE vartotojai SET busena = 'aktyvus' WHERE id_Vartotojas = ?",
        values: [id]
      });
      return NextResponse.json({ message: "Vartotojas patvirtintas" });
    }

    if (action === "activate") {
      await pool.execute({
        sql: "UPDATE vartotojai SET busena = 'aktyvus' WHERE id_Vartotojas = ?",
        values: [id]
      });
      return NextResponse.json({ message: "Vartotojas aktyvuotas" });
    }

    if (action === "update") {
      const fields = [];
      const values = [];

      if (updates.vardas) {
        fields.push("vardas = ?");
        values.push(updates.vardas);
      }
      if (updates.pavarde) {
        fields.push("pavarde = ?");
        values.push(updates.pavarde);
      }
      if (updates.slapyvardis) {
        fields.push("slapyvardis = ?");
        values.push(updates.slapyvardis);
      }
      if (updates.role) {
        fields.push("role = ?");
        values.push(updates.role);
      }
      if (updates.busena) {
        fields.push("busena = ?");
        values.push(updates.busena);
      }
      if (updates.tel_nr !== undefined) {
        fields.push("tel_nr = ?");
        values.push(updates.tel_nr);
      }
      if (updates.miestas !== undefined) {
        fields.push("miestas = ?");
        values.push(updates.miestas);
      }

      if (fields.length > 0) {
        values.push(id);
        await pool.execute({
          sql: `UPDATE vartotojai SET ${fields.join(", ")} WHERE id_Vartotojas = ?`,
          values: values
        });
      }
      return NextResponse.json({ message: "Vartotojas atnaujintas" });
    }

    return NextResponse.json({ error: "Neteisingas veiksmas" }, { status: 400 });
  } catch (error) {
    console.error("PUT users error:", error);
    return NextResponse.json({ error: "Nepavyko atnaujinti vartotojo" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "administratorius") {
      return NextResponse.json({ error: "Nėra prieigos" }, { status: 403 });
    }

    const { id } = await request.json();

    // Delete user and cascade delete related records
    // Order matters due to foreign key constraints
    
    try {
      // 1. Delete messages in chats where this user participates
      await pool.execute(
        "DELETE FROM zinutes WHERE fk_Pokalbisid_Pokalbis IN (SELECT id_Pokalbis FROM pokalbiai WHERE fk_Vartotojasid_Vartotojas1 = ? OR fk_Vartotojasid_Vartotojas2 = ?)",
        [id, id]
      );

      // 2. Delete chats where user is participant
      await pool.execute(
        "DELETE FROM pokalbiai WHERE fk_Vartotojasid_Vartotojas1 = ? OR fk_Vartotojasid_Vartotojas2 = ?",
        [id, id]
      );

      // 3. Delete favorites (megstamiausi) for listings by this user or favorited by this user
      // First get all listings by this user
      const [userSkelbimai] = await pool.execute<RowDataPacket[]>(
        "SELECT id_Skelbimas FROM skelbimai WHERE fk_Imoneid_Imone IN (SELECT id_Imone FROM imones WHERE fk_Vartotojasid_Vartotojas = ?)",
        [id]
      );

      // Delete favorites on those listings and by this user
      await pool.execute(
        "DELETE FROM megstamiausi WHERE fk_Vartotojasid_Vartotojas = ? OR fk_Skelbimasid_Skelbimas IN (SELECT id_Skelbimas FROM skelbimai WHERE fk_Imoneid_Imone IN (SELECT id_Imone FROM imones WHERE fk_Vartotojasid_Vartotojas = ?))",
        [id, id]
      );

      // 4. Delete photos from user's listings
      await pool.execute(
        "DELETE FROM nuotraukos WHERE fk_Skelbimasid_Skelbimas IN (SELECT id_Skelbimas FROM skelbimai WHERE fk_Imoneid_Imone IN (SELECT id_Imone FROM imones WHERE fk_Vartotojasid_Vartotojas = ?))",
        [id]
      );

      // 5. Delete user's listings
      await pool.execute(
        "DELETE FROM skelbimai WHERE fk_Imoneid_Imone IN (SELECT id_Imone FROM imones WHERE fk_Vartotojasid_Vartotojas = ?)",
        [id]
      );

      // 6. Delete user's company
      await pool.execute(
        "DELETE FROM imones WHERE fk_Vartotojasid_Vartotojas = ?",
        [id]
      );

      // 7. Delete user's models
      await pool.execute(
        "DELETE FROM modeliai WHERE fk_Vartotojasid_Vartotojas = ?",
        [id]
      );

      // 8. Finally delete the user
      await pool.execute(
        "DELETE FROM vartotojai WHERE id_Vartotojas = ?",
        [id]
      );

      return NextResponse.json({ message: "Vartotojas ir visi susiję duomenys ištrintas" });
    } catch (dbError: any) {
      console.error("Database deletion error:", dbError);
      throw new Error(`Duomenų bazės klaida: ${dbError.message}`);
    }
  } catch (error) {
    console.error("DELETE users error:", error);
    return NextResponse.json({ error: "Nepavyko ištrinti vartotojo" }, { status: 500 });
  }
}