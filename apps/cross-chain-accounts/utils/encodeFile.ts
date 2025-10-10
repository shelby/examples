import {
  type BlobCommitments,
  ClayErasureCodingProvider,
  generateCommitments,
} from "@shelby-protocol/sdk/browser";

export const encodeFile = async (file: File): Promise<BlobCommitments> => {
  const data = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await file.arrayBuffer());
  const provider = await ClayErasureCodingProvider.create();
  const commitments = await generateCommitments(provider, data);

  return commitments;
};
