import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@shelby-protocol/ui/components/button";
import { useState } from "react";
import { useSubmitFileToChain } from "@/hooks/useSubmitFileToChain";
import { useUploadFile } from "@/hooks/useUploadFile";
import { encodeFile } from "@/utils/encodeFile";

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export const FileUpload = ({ onUploadSuccess }: FileUploadProps) => {
  // Hooks
  const { account, wallet } = useWallet();
  const { uploadFileToRcp } = useUploadFile();
  const { submitFileToChain } = useSubmitFileToChain();

  // Internal State
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !account || !wallet) return;

    setIsUploading(true);
    try {
      // Encode the file
      const commitments = await encodeFile(selectedFile);

      // Submit the file to the chain
      await submitFileToChain(commitments, selectedFile);

      // Upload the file to the RCP
      await uploadFileToRcp(selectedFile);

      alert("File uploaded successfully");

      // Trigger refresh of AccountBlobs component
      onUploadSuccess?.();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-background">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Upload File
      </h2>
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="file-upload"
            className="text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            Choose a file to upload
          </label>
          <input
            id="file-upload"
            accept="image/*"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-gray-800 dark:file:text-gray-300 dark:hover:file:bg-gray-700"
          />
        </div>
        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Selected:
              </span>
              <span className="text-sm font-medium text-foreground">
                {selectedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button
              onClick={uploadFile}
              disabled={isUploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
