import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

const PUBLIC_PATHS = ["/connexion", "/inscription", "/auth/callback"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  // Les routes API renvoient 401 elles-mêmes ; pas de redirect HTML.
  if (!user && !isPublicPath(pathname) && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (pathname === "/connexion" || pathname === "/inscription")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    // Les layouts redirigent ensuite admin → /admin, soignant → /soignant.
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
