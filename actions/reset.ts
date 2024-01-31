"use server";
import { getUserByEmail } from "@/data/user";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";
import { ResetSchema } from "@/schemas";
import { z } from "zod";

export const reset = async (value: z.infer<typeof ResetSchema>) => {
  const validatedFields = await ResetSchema.safeParse(value);
  if (!validatedFields.success) {
    return {
      error: "Invalid email!",
    };
  }
  try {
    const { email } = validatedFields.data;
    const existingUser = await getUserByEmail(email);
    if (!existingUser) {
      return {
        error: "Email not found!",
      };
    }
    const token = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(token.email, token.token);
    return {
      success: "Email sent!",
    };
  } catch (error) {
    throw error;
  }
};
