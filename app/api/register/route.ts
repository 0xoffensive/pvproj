import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Helper function to auto-format URL
const formatUrl = (url: string | null | undefined) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

export async function POST(request: Request) {
  const connection = await pool.getConnection();

  try {
    const {
      vardas,
      pavarde,
      e_pastas,
      slapyvardis,
      slaptazodis,
      role,
      miestas,
      tel_nr,
      svetaine, // Private seller website
      // Imone fields (only when role === "atstovas")
      imone,
    } = await request.json();

    // Validation — user fields
    if (!vardas || !pavarde || !e_pastas || !slapyvardis || !slaptazodis) {
      return NextResponse.json(
        { error: "Visi vartotojo laukai yra privalomi." },
        { status: 400 }
      );
    }

    if (slaptazodis.length < 6) {
      return NextResponse.json(
        { error: "Slaptažodis turi būti bent 6 simbolių." },
        { status: 400 }
      );
    }

    // Validation — imone fields (only for atstovas)
    if (role === "atstovas") {
      if (!imone?.pavadinimas || !imone?.imones_kodas) {
        return NextResponse.json(
          { error: "Įmonės pavadinimas ir įmonės kodas yra privalomi." },
          { status: 400 }
        );
      }
    }
    
    if (role === "privatus_pardavejas") {
      if (!miestas || !tel_nr) {
        return NextResponse.json(
          { error: "Miestas ir telefono numeris yra privalomi." },
          { status: 400 }
        );
      }
    }

    // Check if email already exists
    const [existingEmail] = await connection.execute<RowDataPacket[]>(
      "SELECT id_Vartotojas FROM Vartotojai WHERE e_pastas = ?",
      [e_pastas]
    );

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Vartotojas su šiuo el. paštu jau egzistuoja." },
        { status: 409 }
      );
    }

    // Check if username already exists
    const [existingUsername] = await connection.execute<RowDataPacket[]>(
      "SELECT id_Vartotojas FROM Vartotojai WHERE slapyvardis = ?",
      [slapyvardis]
    );

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: "Šis slapyvardis jau užimtas." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(slaptazodis, 10);
    // Treat private sellers as regular "atstovas" for database permission purposes
    const userRole = (role === "atstovas" || role === "privatus_pardavejas") ? "atstovas" : "vartotojas";
    // Set status: active for buyers, pending for sellers
    const userStatus = (role === "atstovas" || role === "privatus_pardavejas") ? "laukia_patvirtinimo" : "aktyvus";

    // Use a transaction — if imone creation fails, user creation is rolled back too
    await connection.beginTransaction();

    try {
      // 1. Create user (Now including phone and city)
      const [userResult] = await connection.execute<ResultSetHeader>(
        "INSERT INTO vartotojai (vardas, pavarde, e_pastas, slapyvardis, slaptazodis, tel_nr, miestas, role, busena) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [vardas, pavarde, e_pastas, slapyvardis, hashedPassword, tel_nr || null, miestas || null, userRole, userStatus]
      );

      const userId = userResult.insertId;

      // 2. If atstovas, create the imone linked to this user
      if (role === "atstovas" && imone) {
        await connection.execute(
          "INSERT INTO imones (pavadinimas, miestas, pasto_kodas, adresas, pastato_nr, tel_nr, imones_kodas, pvm_kodas, svetaine, fk_Vartotojasid_Vartotojas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            imone.pavadinimas,
            imone.miestas || null,
            imone.pasto_kodas || null,
            imone.adresas || null,
            imone.pastato_nr || null,
            imone.tel_nr || null,
            imone.imones_kodas,
            imone.pvm_kodas || null,
            formatUrl(imone.svetaine),
            userId,
          ]
        );
      } else if (role === "privatus_pardavejas") {
        // Create a 'dummy' imone mapped to the private seller, so database relationships don't break
        await connection.execute(
          "INSERT INTO imones (pavadinimas, miestas, tel_nr, svetaine, fk_Vartotojasid_Vartotojas) VALUES (?, ?, ?, ?, ?)",
          [
            `${vardas} ${pavarde}`, 
            miestas,
            tel_nr,
            formatUrl(svetaine),
            userId,
          ]
        );
      }

      await connection.commit();

      return NextResponse.json(
        { message: "Registracija sėkminga!" },
        { status: 201 }
      );
    } catch (txError) {
      await connection.rollback();
      throw txError;
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Serverio klaida. Bandykite vėliau." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}