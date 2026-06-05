import type { Context } from "https://edge.netlify.com";

/**
 * /x-fav-ab/ への流入を /lp/x-fav-simple/ または /lp/x-fav-rich/ に
 * 50/50 で 302 リダイレクトする AB スプリッタ。
 *
 * session-sticky: 初回 visit で lp_variant cookie を発行し、以降の
 * visit は同じ variant に固定する。これで「同一 user が両 LP を見て
 * conversion 帰属が曖昧になる」AB 汚染を防ぐ。
 *
 * cookie 有効期限: 30 日 (Round 1 観察期間 2 週間より十分長い)。
 */

const VARIANTS = ["x-fav-simple", "x-fav-rich"] as const;
type Variant = (typeof VARIANTS)[number];

const COOKIE_NAME = "lp_variant";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 日

const readCookieVariant = (cookieHeader: string | null): Variant | null => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  const value = match[1];
  return (VARIANTS as readonly string[]).includes(value)
    ? (value as Variant)
    : null;
};

const pickRandomVariant = (): Variant =>
  VARIANTS[Math.floor(Math.random() * VARIANTS.length)];

export default async (
  request: Request,
  _context: Context,
): Promise<Response> => {
  const url = new URL(request.url);
  const sticky = readCookieVariant(request.headers.get("cookie"));
  const variant: Variant = sticky ?? pickRandomVariant();

  const target = new URL(`/lp/${variant}/`, url.origin);
  target.search = url.search;

  const headers = new Headers({ Location: target.toString() });
  if (!sticky) {
    headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${variant}; Max-Age=${COOKIE_MAX_AGE_SEC}; Path=/; SameSite=Lax`,
    );
  }
  return new Response(null, { status: 302, headers });
};

export const config = {
  path: ["/x-fav-ab", "/x-fav-ab/"],
};
