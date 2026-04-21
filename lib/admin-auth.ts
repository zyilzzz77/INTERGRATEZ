import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || "inversave-super-secret-key-admin-12345";
const key = new TextEncoder().encode(secretKey);

export const ADMIN_COOKIE_NAME = "inversave_admin_session";

export async function encryptAdminSession(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decryptAdminSession(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload;
    } catch {
        return null; // Invalid or expired
    }
}

/**
 * Checks if the request is an authentic Admin session by verifying the cookie.
 */
export async function verifyAdminSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    
    return await decryptAdminSession(token);
}
