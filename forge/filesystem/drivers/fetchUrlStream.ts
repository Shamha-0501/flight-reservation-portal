import { Readable } from "node:stream";
import https from "node:https";
import http from "node:http";
import { URL } from "node:url";

export type FetchStreamResult = {
  stream: Readable;
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
};

export const fetchStreamByUrl = (
  urlStr: string
): Promise<FetchStreamResult> => {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;

    const req = lib.request(urlStr, { method: "GET" }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 400) {
        res.resume(); // consume
        return reject(new Error(`Failed to fetch stream. HTTP ${status}`));
      }
      resolve({
        stream: res,
        statusCode: status,
        headers: res.headers as any,
      });
    });

    req.on("error", reject);
    req.end();
  });
};
