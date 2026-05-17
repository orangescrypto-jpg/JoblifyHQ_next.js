/* eslint-disable */
declare const process: { env: Record<string, string | undefined> };
export const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? '';
