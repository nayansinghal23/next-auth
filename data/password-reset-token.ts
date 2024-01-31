import { prismadb } from "@/lib/prismadb";

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordToken = await prismadb.passwordResetToken.findUnique({
      where: {
        token,
      },
    });
    return passwordToken;
  } catch {
    return null;
  }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordToken = await prismadb.passwordResetToken.findFirst({
      where: {
        email,
      },
    });
    return passwordToken;
  } catch {
    return null;
  }
};
