"use server";

import { getUserByEmail, getUserById } from "@/data/user";
import { currentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";
import { prismadb } from "@/lib/prismadb";
import { generateVerificationToken } from "@/lib/tokens";
import { SettingsSchema } from "@/schemas";
import { compare, hash } from "bcryptjs";
import z from "zod";

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user: any = await currentUser();
  if (!user || !user.id) {
    return {
      error: "Unauthorized",
    };
  }
  const dbUser = await getUserById(user.id);
  if (!dbUser) {
    return {
      error: "Unauthorized",
    };
  }
  if (user?.isOAuth) {
    values.email = undefined;
    values.password = undefined;
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined;
  }
  if (values.email && values.email !== user.email) {
    const exsistingUser = await getUserByEmail(values.email);
    if (exsistingUser && exsistingUser.id !== user.id) {
      return {
        error: "Email already in use!",
      };
    }
    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return {
      success: "Verification email sent!",
    };
  }

  if (values.password && values.newPassword && dbUser.password) {
    // const matchPassword = await compare(values.password, dbUser.password);
    // if (!matchPassword) {
    //   return {
    //     error: "Incorrect password!",
    //   };
    // }
    const hashedPassword = await hash(values.newPassword, 10);
    values.password = hashedPassword;
    values.newPassword = undefined;
  }
  console.log(values);
  await prismadb.user.update({
    where: {
      id: dbUser.id,
    },
    data: {
      ...values,
    },
  });
  return {
    success: "Settings Updated",
  };
};
