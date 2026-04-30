import type { APIContext } from "astro";
import type { Session, User } from "@supabase/supabase-js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  createSupabaseServerClient,
} from "./supabase";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

function getCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: import.meta.env.PROD,
    maxAge: COOKIE_MAX_AGE,
  };
}

export function setAuthCookies(context: APIContext, session: Session) {
  const options = getCookieOptions();

  context.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, options);
  context.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, options);
}

export function clearAuthCookies(context: APIContext) {
  const options = getCookieOptions();

  context.cookies.delete(ACCESS_TOKEN_COOKIE, options);
  context.cookies.delete(REFRESH_TOKEN_COOKIE, options);
}

export async function requireAuth(
  context: APIContext,
): Promise<AuthResult | null> {
  const accessToken = context.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? "";
  const refreshToken = context.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? "";
  const supabase = createSupabaseServerClient();

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (!error && data.user) {
      return {
        accessToken,
        refreshToken,
        user: data.user,
      };
    }
  }

  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!error && data.session?.user) {
      setAuthCookies(context, data.session);

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: data.session.user,
      };
    }
  }

  clearAuthCookies(context);
  return null;
}

export function buildUserPayload(user: User) {
  return {
    id: user.id,
    email: user.email ?? "",
  };
}
