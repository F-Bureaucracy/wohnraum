import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "$env/dynamic/private";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

let client: S3Client | undefined;
let bucket: string | undefined;

// Lazily build the client on first use so the module can be imported (e.g.
// during the build) without the S3 env vars being present. They are read at
// runtime, when an actual request triggers one of the functions below.
function getClient(): { s3: S3Client; bucket: string } {
  if (!client) {
    client = new S3Client({
      region: env.S3_REGION ?? "auto",
      endpoint: required("S3_URL", env.S3_URL),
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: required("S3_ACCESS_KEY", env.S3_ACCESS_KEY),
        secretAccessKey: required("S3_SECRET_KEY", env.S3_SECRET_KEY),
      },
    });
    bucket = required("S3_BUCKET", env.S3_BUCKET);
  }
  return { s3: client, bucket: bucket! };
}

export function signUpload(key: string, contentType: string) {
  const { s3, bucket } = getClient();
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 },
  );
}

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
) {
  const { s3, bucket } = getClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export function signDownload(key: string, fileName?: string) {
  const { s3, bucket } = getClient();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: fileName
        ? `inline; filename="${encodeURIComponent(fileName)}"`
        : undefined,
    }),
    { expiresIn: 60 * 10 },
  );
}

export async function deleteObject(key: string) {
  const { s3, bucket } = getClient();
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
