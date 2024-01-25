"use server";

import { RegisterSchema } from "@/schemas";
import { z } from "zod";
import bcrypt from "bcrypt";
import { prismadb } from "@/lib/prismadb";
import { getUserByEmail } from "@/data/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }
  const { username, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userFound = await getUserByEmail(email);
  if (userFound) {
    return {
      error: "User already exist",
    };
  }
  await prismadb.user.create({
    data: {
      name: username,
      email,
      password: hashedPassword,
    },
  });
  return {
    success: "User registered",
  };
};
