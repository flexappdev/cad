import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// IMPORTANT: Vercel auto-injects AWS_REGION=us-east-1 which silently
// breaks eu-west-2 bucket reads. Always set S3_REGION explicitly and
// prefer it over AWS_REGION.
const REGION = process.env.S3_REGION ?? "eu-west-2";
const BUCKET = process.env.S3_BUCKET ?? "com27";
const PREFIX = process.env.S3_PREFIX ?? "cad";

let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) {
    _client = new S3Client({ region: REGION });
  }
  return _client;
}

/** Public URL for an object once written. com27 has a PublicReadCad policy stanza. */
export function s3Url(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export interface PutOpts {
  contentType?: string;
}

/** Upload a buffer to s3://com27/cad/<key>. Returns the public URL. */
export async function s3Put(keySuffix: string, body: Buffer, opts: PutOpts = {}): Promise<string> {
  const Key = `${PREFIX}/${keySuffix}`;
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key,
      Body: body,
      ContentType: opts.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return s3Url(Key);
}

/** Download a remote URL and re-upload to com27. Returns the new com27 URL. */
export async function s3MirrorFromUrl(remoteUrl: string, keySuffix: string, contentType?: string): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`fetch ${remoteUrl} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return s3Put(keySuffix, buf, { contentType: contentType ?? res.headers.get("content-type") ?? undefined });
}
