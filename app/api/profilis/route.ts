import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface UserProfile extends RowDataPacket {
  id_Vartotojas: number;
  vardas: string;
  pavarde: string;
  e_pastas: string;
  slapyvardis: string;
  tel_nr: string | null;
  miestas: string | null;
  role: string;
  busena: string;
}

interface CompanyProfile extends RowDataPacket {
  pavadinimas: string;
  miestas: string | null;
  pasto_kodas: string | null;
  adresas: string | null;
  pastato_nr: string | null;
  tel_nr: string | null;
  imones_kodas: string | null;
  pvm_kodas: string | null;
  svetaine: string | null;
}

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Neprisijungta" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user profile
    const [userRows] = await pool.execute<UserProfile[]>(
      "SELECT id_Vartotojas, vardas, pavarde, e_pastas, slapyvardis, tel_nr, miestas, role, busena FROM Vartotojai WHERE id_Vartotojas = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return NextResponse.json(
        { error: "Vartotojas nerastas" },
        { status: 404 }
      );
    }

    const user = userRows[0];

    // Get company info if user is atstovas
    let company = null;
    if (user.role === "atstovas") {
      const [companyRows] = await pool.execute<CompanyProfile[]>(
        "SELECT pavadinimas, miestas, pasto_kodas, adresas, pastato_nr, tel_nr, imones_kodas, pvm_kodas, svetaine FROM Imones WHERE fk_Vartotojasid_Vartotojas = ?",
        [userId]
      );

      if (companyRows.length > 0) {
        company = companyRows[0];
      }
    }

    return NextResponse.json({
      user: {
        id: user.id_Vartotojas,
        vardas: user.vardas,
        pavarde: user.pavarde,
        e_pastas: user.e_pastas,
        slapyvardis: user.slapyvardis,
        tel_nr: user.tel_nr,
        miestas: user.miestas,
        role: user.role,
        busena: user.busena,
      },
      company,
    });

  } catch (error) {
    console.error("Klaida gaunant profilį:", error);
    return NextResponse.json(
      { error: "Serverio klaida" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Neprisijungta" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      vardas,
      pavarde,
      e_pastas,
      slapyvardis,
      tel_nr,
      miestas,
      naujasSlaptazodis,
      // Company fields (only for atstovas)
      imone,
    } = body;

    // Validation
    if (!vardas || !pavarde || !e_pastas || !slapyvardis) {
      return NextResponse.json(
        { error: "Visi privalomi laukai turi būti užpildyti" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const [existingEmail] = await connection.execute<RowDataPacket[]>(
      "SELECT id_Vartotojas FROM Vartotojai WHERE e_pastas = ? AND id_Vartotojas != ?",
      [e_pastas, userId]
    );

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Šis el. paštas jau naudojamas" },
        { status: 409 }
      );
    }

    // Check if username is already taken by another user
    const [existingUsername] = await connection.execute<RowDataPacket[]>(
      "SELECT id_Vartotojas FROM Vartotojai WHERE slapyvardis = ? AND id_Vartotojas != ?",
      [slapyvardis, userId]
    );

    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: "Šis slapyvardis jau užimtas" },
        { status: 409 }
      );
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Prepare update data
      const updateData: any = {
        vardas,
        pavarde,
        e_pastas,
        slapyvardis,
        tel_nr: tel_nr || null,
        miestas: miestas || null,
      };

      // If new password provided, hash it
      if (naujasSlaptazodis && naujasSlaptazodis.length >= 6) {
        updateData.slaptazodis = await bcrypt.hash(naujasSlaptazodis, 10);
      }

      // Update user
      const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(updateData);

      await connection.execute(
        `UPDATE Vartotojai SET ${updateFields} WHERE id_Vartotojas = ?`,
        [...updateValues, userId]
      );

      // Update company info if user is atstovas
      if (imone) {
        const companyUpdateData: any = {};

        // Only include fields that are provided
        if (imone.pavadinimas !== undefined) companyUpdateData.pavadinimas = imone.pavadinimas;
        if (imone.miestas !== undefined) companyUpdateData.miestas = imone.miestas;
        if (imone.pasto_kodas !== undefined) companyUpdateData.pasto_kodas = imone.pasto_kodas;
        if (imone.adresas !== undefined) companyUpdateData.adresas = imone.adresas;
        if (imone.pastato_nr !== undefined) companyUpdateData.pastato_nr = imone.pastato_nr;
        if (imone.tel_nr !== undefined) companyUpdateData.tel_nr = imone.tel_nr;
        if (imone.imones_kodas !== undefined) companyUpdateData.imones_kodas = imone.imones_kodas;
        if (imone.pvm_kodas !== undefined) companyUpdateData.pvm_kodas = imone.pvm_kodas;
        if (imone.svetaine !== undefined) companyUpdateData.svetaine = formatUrl(imone.svetaine);

        if (Object.keys(companyUpdateData).length > 0) {
          const companyUpdateFields = Object.keys(companyUpdateData).map(key => `${key} = ?`).join(', ');
          const companyUpdateValues = Object.values(companyUpdateData);

          await connection.execute(
            `UPDATE Imones SET ${companyUpdateFields} WHERE fk_Vartotojasid_Vartotojas = ?`,
            [...companyUpdateValues, userId]
          );
        }
      }

      await connection.commit();

      return NextResponse.json(
        { message: "Profilis atnaujintas sėkmingai" },
        { status: 200 }
      );

    } catch (txError) {
      await connection.rollback();
      throw txError;
    }

  } catch (error) {
    console.error("Klaida atnaujinant profilį:", error);
    return NextResponse.json(
      { error: "Serverio klaida" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}