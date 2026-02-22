import { Request, Response } from "express";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export async function handleFileUpload(req: Request, res: Response) {
  try {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      const contentType = (req.headers["content-type"] as string) ?? "application/octet-stream";
      const ext = contentType.split("/")[1] ?? "bin";
      const userId = (req as any).user?.id ?? "anon";
      const key = `uploads/${userId}/${nanoid()}.${ext}`;

      const { url } = await storagePut(key, buffer, contentType);
      res.json({ success: true, url, key });
    });
    req.on("error", (err) => {
      res.status(500).json({ error: err.message });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
