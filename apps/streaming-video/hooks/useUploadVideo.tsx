import { useState } from "react";
import { getShelbyClient } from "@/utils/client";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { toast } from "sonner";
import {
    ClayErasureCodingProvider,
    expectedTotalChunksets,
    generateCommitments,
} from "@shelby-protocol/sdk/browser";

export const useUploadVideo = () => {
    const { signAndSubmitTransaction, account } = useWallet();
    const [isUploading, setIsUploading] = useState(false);

    const uploadVideo = async (file: File) => {
        if (!account) throw new Error("Wallet not connected");

        setIsUploading(true);
        try {
            const client = getShelbyClient();

            // DẪN CHỨNG: Trên Shelbynet, module nằm tại địa chỉ này
            const moduleAddress = "0xc63d6a5efb0080a6029403131715bd4971e1149f7cc099aac69bb0069b3ddbf5";

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const blobName = `${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}-${Date.now()}`;

            const provider = await ClayErasureCodingProvider.create();
            const commitments = await generateCommitments(provider, buffer);

            // CHUYỂN ĐỔI: Sử dụng Uint8Array cho vector<u8> (Browser compatible)
            const cleanHex = commitments.blob_merkle_root.startsWith("0x")
                ? commitments.blob_merkle_root.slice(2)
                : commitments.blob_merkle_root;
            const merkleRootBytes = new Uint8Array(
                cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
            );

            // Tính thời gian hết hạn: Đặt time-to-live là 30 ngày (tính bằng microseconds)
            const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
            const expirationMicros = BigInt(Date.now() * 1000) + BigInt(TTL_SECONDS * 1000000);

            // Log để debug
            console.log("Debug Upload:", {
                moduleAddress,
                blobName,
                expirationMicros: expirationMicros.toString(),
                nowMicros: BigInt(Date.now() * 1000).toString()
            });

            const payload = {
                data: {
                    function: `${moduleAddress}::blob_metadata::register_blob`,
                    typeArguments: [],
                    functionArguments: [
                        blobName,                                                 // 1. String
                        expirationMicros.toString(),                              // 2. u64 (Expiration)
                        merkleRootBytes,                                          // 3. vector<u8> (Uint8Array)
                        expectedTotalChunksets(commitments.raw_data_size),        // 4. u32 (Number)
                        String(commitments.raw_data_size),                        // 5. u64 (Size)
                        0,                                                        // 6. u8 (Number)
                        0                                                         // 7. u8 (Number)
                    ],
                }
            };

            // Gửi giao dịch
            const response = await signAndSubmitTransaction(payload as any);

            // Upload Blob Data lên RPC
            await client.rpc.putBlob({
                account: account.address,
                blobName,
                blobData: new Uint8Array(buffer),
            });

            toast.success("Upload successful!");
            return { blobName, transactionHash: response.hash };

        } catch (error: any) {
            console.error("Execution error:", error);
            // In chi tiết lỗi từ Simulation nếu có
            const errorMsg = error.data?.message || error.message || "Transaction failed";
            toast.error(errorMsg);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadVideo, isUploading };
};