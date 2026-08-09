import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import type Docker from 'dockerode';
import { extract as tarExtract, pack as tarPack } from 'tar-stream';
import yauzl from 'yauzl';

export interface FileEntry {
  /** Path relative to the directory the archive is unpacked into. */
  name: string;
  content: Buffer;
  mode?: number;
}

/**
 * Files are moved in and out of the CS2 volume through the container's own
 * filesystem API rather than by mounting the volume into the agent. The volume
 * is created at runtime, and `putArchive` works even while the container is
 * stopped, which is exactly when plugins get installed.
 */
export function packEntries(entries: FileEntry[]): Readable {
  const pack = tarPack();
  for (const entry of entries) {
    pack.entry(
      { name: entry.name, mode: entry.mode ?? 0o644, size: entry.content.length },
      entry.content,
    );
  }
  pack.finalize();
  return pack as unknown as Readable;
}

export async function putFiles(
  container: Docker.Container,
  destination: string,
  entries: FileEntry[],
): Promise<void> {
  if (entries.length === 0) return;
  await container.putArchive(packEntries(entries), { path: destination });
}

/** Reads one file out of a container. Returns null when it does not exist. */
export async function readFile(
  container: Docker.Container,
  path: string,
): Promise<Buffer | null> {
  let stream: NodeJS.ReadableStream;
  try {
    stream = await container.getArchive({ path });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return null;
    throw error;
  }

  const chunks: Buffer[] = [];
  const extractor = tarExtract();

  const collected = new Promise<Buffer | null>((resolve, reject) => {
    extractor.on('entry', (header, entryStream, next) => {
      if (header.type !== 'file') {
        entryStream.resume();
        entryStream.on('end', next);
        return;
      }
      entryStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      entryStream.on('end', next);
      entryStream.on('error', reject);
    });
    extractor.on('finish', () =>
      resolve(chunks.length > 0 ? Buffer.concat(chunks) : null),
    );
    extractor.on('error', reject);
  });

  await pipeline(stream, extractor);
  return collected;
}

export async function readTextFile(
  container: Docker.Container,
  path: string,
): Promise<string | null> {
  const buffer = await readFile(container, path);
  return buffer?.toString('utf8') ?? null;
}

/** Everything a downloaded release archive contains, flattened into memory. */
export async function unpackArchive(
  data: Buffer,
  format: 'tar.gz' | 'zip',
  stripComponents: number,
): Promise<FileEntry[]> {
  return format === 'zip'
    ? unpackZip(data, stripComponents)
    : unpackTarGz(data, stripComponents);
}

function strip(name: string, components: number): string | null {
  if (components === 0) return name;
  const parts = name.split('/').filter(Boolean);
  if (parts.length <= components) return null;
  return parts.slice(components).join('/');
}

async function unpackTarGz(
  data: Buffer,
  stripComponents: number,
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const extractor = tarExtract();

  const done = new Promise<void>((resolve, reject) => {
    extractor.on('entry', (header, stream, next) => {
      if (header.type !== 'file') {
        stream.resume();
        stream.on('end', next);
        return;
      }
      const name = strip(header.name, stripComponents);
      if (!name) {
        stream.resume();
        stream.on('end', next);
        return;
      }
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        entries.push({
          name,
          content: Buffer.concat(chunks),
          mode: header.mode ?? 0o644,
        });
        next();
      });
      stream.on('error', reject);
    });
    extractor.on('finish', resolve);
    extractor.on('error', reject);
  });

  await pipeline(Readable.from(data), createGunzip(), extractor);
  await done;
  return entries;
}

function unpackZip(data: Buffer, stripComponents: number): Promise<FileEntry[]> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(data, { lazyEntries: true }, (error, zipFile) => {
      if (error || !zipFile) {
        reject(error ?? new Error('Could not read the zip archive'));
        return;
      }

      const entries: FileEntry[] = [];
      zipFile.readEntry();

      zipFile.on('entry', (entry: yauzl.Entry) => {
        if (entry.fileName.endsWith('/')) {
          zipFile.readEntry();
          return;
        }
        const name = strip(entry.fileName, stripComponents);
        if (!name) {
          zipFile.readEntry();
          return;
        }

        zipFile.openReadStream(entry, (readError, stream) => {
          if (readError || !stream) {
            reject(readError ?? new Error(`Could not read ${entry.fileName}`));
            return;
          }
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => {
            // The high 16 bits of externalFileAttributes hold the unix mode;
            // zips produced on Windows leave them at zero.
            const unixMode = (entry.externalFileAttributes >>> 16) & 0o7777;
            entries.push({
              name,
              content: Buffer.concat(chunks),
              mode: unixMode || 0o644,
            });
            zipFile.readEntry();
          });
          stream.on('error', reject);
        });
      });

      zipFile.on('end', () => resolve(entries));
      zipFile.on('error', reject);
    });
  });
}
