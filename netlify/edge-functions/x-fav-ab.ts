import type { Context } from "https://edge.netlify.com";

const VARIANTS = ["x-fav-simple", "x-fav-rich"] as const;

export default async (request: Request, _context: Context): Promise<Response> => {
  const url = new URL(request.url);
  const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  const target = new URL(`/lp/${variant}/`, url.origin);
  target.search = url.search;
  return Response.redirect(target.toString(), 302);
};

export const config = {
  path: ["/x-fav-ab", "/x-fav-ab/"],
};
