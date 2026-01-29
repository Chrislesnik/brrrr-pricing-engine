import { basehub } from "basehub";

export const client = basehub({
  token: process.env.BASEHUB_TOKEN!,
  // Optional: enable draft mode in development
  draft: process.env.NODE_ENV === "development",
});
