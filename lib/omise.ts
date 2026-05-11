import "server-only";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Omise = require("omise");

export const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY!,
  secretKey: process.env.OMISE_SECRET_KEY!,
});
