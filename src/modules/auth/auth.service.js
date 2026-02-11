import prisma from "../../config/prisma.js";
import { hashPassword, verifyPassword } from "../../utils/hash.js";
import { signAccessToken, signRefreshToken } from "../../utils/tokens.js";
import { auditLog } from "../../utils/audit.js";

export async function createUser({ data, files, req }) {
  const idDoc = files?.idDoc?.[0];
  const selfie = files?.selfie?.[0];

  if (!idDoc || !selfie) {
    const err = new Error("ID Doc et selfie requis.");
    err.status = 400;
    throw err;
  }

  if (!data.acceptedConditions) {
    const err = new Error("Tu dois accepter les conditions d’utilisation.");
    err.status = 400;
    throw err;
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      country: data.country,
      city: data.city,
      passwordHash,
      status: "PENDING_VERIFICATION",
      role: "CLIENT",
      idDocPath: idDoc.path,
      selfiePath: selfie.path,
    },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      country: true,
      city: true,
      status: true,
      role: true,
      createdAt: true,
    },
  });

  await auditLog({
    userId: user.id,
    action: "REGISTER",
    entity: "User",
    entityId: user.id,
    req,
    meta: { email: user.email, phone: user.phone },
  });

  return user;
}

export async function loginUser({ email, password, req }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error("Identifiants invalides.");
    err.status = 401;
    throw err;
  }

  // 🔒 interdit tant que OTP pas validé
  if (user.status !== "ACTIVE") {
    const err = new Error("Compte non actif. Vérifie ton OTP.");
    err.status = 403;
    throw err;
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    const err = new Error("Identifiants invalides.");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

  await auditLog({
    userId: user.id,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    req,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      country: user.country,
      city: user.city,
      role: user.role,
      status: user.status,
    },
  };
}

export async function getMe({ userId }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      country: true,
      city: true,
      role: true,
      status: true,
      idDocPath: true,
      selfiePath: true,
      createdAt: true,
    },
  });

  return user;
}
