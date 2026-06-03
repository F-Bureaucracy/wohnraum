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

const region = env.S3_REGION ?? "auto";
const endpoint = required("S3_URL", env.S3_URL);

export const s3Bucket = required("S3_BUCKET", env.S3_BUCKET);

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: required("S3_ACCESS_KEY", env.S3_ACCESS_KEY),
    secretAccessKey: required("S3_SECRET_KEY", env.S3_SECRET_KEY),
  },
});

export function signUpload(key: string, contentType: string) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 * 10 },
  );
}

export function signDownload(key: string, fileName?: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      ResponseContentDisposition: fileName
        ? `inline; filename="${encodeURIComponent(fileName)}"`
        : undefined,
    }),
    { expiresIn: 60 * 10 },
  );
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: key }));
}
