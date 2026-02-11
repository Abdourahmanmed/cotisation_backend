import { registerSchema, loginSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";
import { sendEmailOtp } from "../otp/otp.service.js";

export async function register(req, res, next) {
  try {
    // multipart/form-data => strings, donc convert acceptedConditions
    const accepted =
      req.body.acceptedConditions === true ||
      req.body.acceptedConditions === "true";

    const data = registerSchema.parse({
      fullName: req.body.fullName,
      phone: req.body.phone,
      email: req.body.email,
      country: req.body.country,
      city: req.body.city,
      password: req.body.password,
      acceptedConditions: accepted,
    });

    const user = await authService.createUser({
      data,
      files: req.files,
      req,
    });

    // ✅ Envoi OTP email automatique
    await sendEmailOtp({ email: user.email });

    return res.status(201).json({
      message: "Inscription OK. OTP envoyé par email.",
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    // Prisma unique constraint (email/phone)
    if (String(err?.code) === "P2002") {
      return res
        .status(409)
        .json({ message: "Téléphone ou email déjà utilisé." });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const result = await authService.loginUser({
      email: data.email,
      password: data.password,
      req,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getMe({ userId: req.user.sub });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}
