"use server";

import { signIn } from "@/auth";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { getUserByEmail } from "@/data/user";
import { sendTwoFactorTokenEmail, sendVerificationEmail } from "@/lib/mail";
import { prismadb } from "@/lib/prismadb";
import {
  generateTwoFactorToken,
  generateVerificationToken,
} from "@/lib/tokens";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { LoginSchema } from "@/schemas";
import { compare } from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }
  try {
    const { email, password, code } = validatedFields.data;
    const existingUser = await getUserByEmail(email);
    if (!existingUser || !existingUser.email || !existingUser.password) {
      return {
        error: "Email doesn't exists!",
      };
    }
    const comparePassword = await compare(password, existingUser.password);
    if (!comparePassword) {
      return {
        error: "Password is incorrect!",
      };
    }
    if (!existingUser.emailVerified) {
      const verificationToken = await generateVerificationToken(email);
      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      );
      return {
        success: "Confirmation email sent!",
      };
    }
    if (existingUser.isTwoFactorEnabled && existingUser.email) {
      if (code) {
        const twoFactorToken = await getTwoFactorTokenByEmail(
          existingUser.email
        );
        if (!twoFactorToken || twoFactorToken.token !== code) {
          return {
            error: "Invalid code!",
          };
        }
        const hasExpired = new Date(twoFactorToken.expires) < new Date();
        if (hasExpired) {
          return {
            error: "Code expired!",
          };
        }
        await prismadb.twoFactorToken.delete({
          where: {
            id: twoFactorToken.id,
          },
        });
        const existingConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );
        if (existingConfirmation) {
          await prismadb.twoFactorConfirmation.delete({
            where: {
              id: existingConfirmation.id,
            },
          });
        }
        await prismadb.twoFactorConfirmation.create({
          data: {
            userId: existingUser.id,
          },
        });
      } else {
        const twoFactorToken = await generateTwoFactorToken(existingUser.email);
        await sendTwoFactorTokenEmail(
          twoFactorToken.email,
          twoFactorToken.token
        );
        return {
          twoFactor: true,
        };
      }
    }
    await signIn("credentials", {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid Credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }
    throw error;
  }
};
