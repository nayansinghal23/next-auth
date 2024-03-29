"use server";

import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import { prismadb } from "@/lib/prismadb";
import { NewPasswordSchema } from "@/schemas";
import { hash } from "bcryptjs";
import { z } from "zod";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | undefined | null
) => {
  if (!token) {
    return {
      error: "Missing token!",
    };
  }
  const validatedFields = NewPasswordSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }
  const { password } = validatedFields.data;
  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) {
    return {
      error: "Invalid token!",
    };
  }
  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) {
    return {
      error: "Token expired!",
    };
  }
  const existingUser = await getUserByEmail(existingToken.email);
  if (!existingUser) {
    return {
      error: "Email doesn't exists!",
    };
  }
  const hashedPassword = await hash(password, 10);
  await prismadb.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      password: hashedPassword,
    },
  });
  await prismadb.passwordResetToken.delete({
    where: {
      id: existingToken.id,
    },
  });
  return {
    success: "Password updated",
  };
};
