import { mkdir, readFile as fsReadFile, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Local-disk file storage for task/approval attachments. Swap this module's
// implementation to call the Microsoft Graph API against the company's
// OneDrive/SharePoint once Azure app credentials (tenant ID, client ID,
// client secret) are available — callers only depend on saveFile/readFile/
// deleteFile below, so nothing outside this file needs to change.

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export async function saveFile(
  buffer: Buffer,
  originalFilename: string
): Promise<{ storagePath: string; size: number }> {
  await mkdir(UPLOAD_ROOT, { recursive: true });

  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const storagePath = `${randomUUID()}-${safeName}`;
  await writeFile(path.join(UPLOAD_ROOT, storagePath), buffer);

  return { storagePath, size: buffer.length };
}

export async function readFile(storagePath: string): Promise<Buffer> {
  return fsReadFile(path.join(UPLOAD_ROOT, storagePath));
}

export async function deleteFile(storagePath: string): Promise<void> {
  await unlink(path.join(UPLOAD_ROOT, storagePath)).catch(() => {});
}
