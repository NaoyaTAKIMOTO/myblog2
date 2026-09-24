import type { Context } from "https://edge.netlify.com";

/**
 * /x-fav-ab/ への流入を 50/50 で 302 リダイレクトする AB スプリッタ。
 *
 * session-sticky: 初回 visit で lp_variant cookie を発行し、以降の
 * visit は同じ variant に固定する。これで「同一 user が両 LP を見て
 * conversion 帰属が曖昧になる」AB 汚染を防ぐ。
 *
 * cookie 有効期限: 30 日 (Round 1 観察期間 2 週間より十分長い)。
 *
 * **2026-09: rich 対 rich-visual の冒頭実画面 A/B。**
 * rich は同時対照として維持し、旧 pain / gain cookie は無効化する。
 * 値を変えたことで、旧 cohort が持っている lp_variant cookie は
 * readCookieVariant が null を返して引き直されるため、自動的に無効化される。
 *   → x-fav-gellery docs/implementation-plans/ad-ab-creative-lp-2026-09.md
 *
 * query string は target.search で透過する。**広告リンクの utm_content
 * (creative アーム) が振り分け先まで届かないとセルが割れない。**
 */

const VARIANTS = ["x-fav-rich", "x-fav-rich-visual"] as const;
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
  // 広告着地 `/x-fav/` を 50/50 に分ける。Netlify の 301 より Edge が先に処理されることは
  // 2026-09-16 の実験で確認済み。edge 無効時の 301 は rich への fallback。
  path: ["/x-fav/", "/x-fav-ab", "/x-fav-ab/"],
};
