"use server";

import "server-only";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";

export type TLetter = {
  id: number;
  letter_number: string;
  letter_type: string;
  subject: string;
  recipient: string;
  sequence_number: number;
  created_at: Date;
};

const sql = neon(process.env.DATABASE_URL!);

function getMonthInRoman(date: Date): string {
  const month: string[] = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return month[date.getMonth()];
}

async function generateLetterNumber(
  letterType: string,
  date: Date
): Promise<string> {
  const year: number = date.getFullYear();
  const month: string = getMonthInRoman(date);

  const result = await sql`
        SELECT MAX(sequence_number) as max_seq
        FROM letters
        WHERE EXTRACT(MONTH FROM created_at) = ${date.getMonth() + 1}
        AND EXTRACT(YEAR FROM created_at) = ${year}
    `;

  const maxSeq = result[0]?.max_sec || 0;
  const nextSeq = maxSeq + 1;

  const formattedSeq = nextSeq.toString().padStart(3, "0");

  return `${formattedSeq}/${letterType}/ABR/${month}/${year}`;
}

export async function createLetter(data: {
  letterType: string;
  subject: string;
  recipient: string;
  date: Date;
}): Promise<{ success: boolean; letterNumber: string }> {
  try {
    const letterNumber: string = await generateLetterNumber(
      data.letterType,
      data.date
    );

    await sql`
      INSERT INTO letters (
        letter_number,
        letter_type,
        subject,
        recipient,
        sequence_number,
        created_at
      ) VALUES (
        ${letterNumber},
        ${data.letterType},
        ${data.subject},
        ${data.recipient},
        (SELECT COALESCE(MAX(sequence_number), 0) + 1
         FROM letters
         WHERE EXTRACT(MONTH FROM created_at) = ${data.date.getMonth() + 1}
         AND EXTRACT(YEAR FROM created_at) = ${data.date.getFullYear()}),
        ${data.date}
      )
    `;

    revalidatePath("/");
    return { success: true, letterNumber };
  } catch (error) {
    console.error("Error creating letter:", error);
    throw new Error("Failed to create letter");
  }
}

export async function getLetters(): Promise<TLetter[]> {
  try {
    const letters: Record<string, TLetter>[] = await sql`
      SELECT * FROM letters
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return letters as unknown as TLetter[];
  } catch (error) {
    console.error("Error fetching letters:", error);
    throw new Error("Failed to fetch letters");
  }
}
