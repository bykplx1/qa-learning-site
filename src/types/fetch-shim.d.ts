// Workaround for @astrojs/check + @types/node@22+ interaction where
// the global Response / Request interfaces lose Body methods at
// type-check time (`astro check`). Mirrors lib.dom's Body interface;
// remove once upstream merges interfaces correctly again.

export {};

declare global {
  interface Response {
    json(): Promise<any>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    bytes(): Promise<Uint8Array>;
    clone(): Response;
    readonly bodyUsed: boolean;
    readonly headers: Headers;
    readonly ok: boolean;
    readonly redirected: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly type: ResponseType;
    readonly url: string;
  }

  interface Request {
    json(): Promise<any>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    bytes(): Promise<Uint8Array>;
    clone(): Request;
    readonly bodyUsed: boolean;
    readonly headers: Headers;
    readonly url: string;
    readonly method: string;
  }
}
