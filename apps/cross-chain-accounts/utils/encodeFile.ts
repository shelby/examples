import {
  BlobCommitments,
  generateCommitments,
} from "@shelby-protocol/sdk/node";

export const encodeFile = async (file: File): Promise<BlobCommitments> => {
  const data = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await file.arrayBuffer());

  const commitments = await generateCommitments(data);

  return commitments;
};
