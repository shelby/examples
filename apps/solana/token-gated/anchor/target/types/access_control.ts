/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/access_control.json`.
 */
export type AccessControl = {
  address: "6XyAbrfHK5sinJAj3nXEVG2ALzKTXQv89JLuYwXictGV";
  metadata: {
    name: "accessControl";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Token-gated access control for encrypted files on Shelby";
  };
  instructions: [
    {
      name: "purchase";
      docs: [
        "Purchase access to a blob by paying the owner.",
        "Creates a receipt PDA that proves the buyer has paid.",
      ];
      discriminator: [21, 93, 113, 154, 193, 160, 242, 168];
      accounts: [
        {
          name: "blobMetadata";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  98,
                  108,
                  111,
                  98,
                  95,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97,
                ];
              },
              {
                kind: "arg";
                path: "storageAccountAddress";
              },
              {
                kind: "arg";
                path: "blobName";
              },
            ];
          };
        },
        {
          name: "receipt";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [97, 99, 99, 101, 115, 115];
              },
              {
                kind: "arg";
                path: "storageAccountAddress";
              },
              {
                kind: "arg";
                path: "blobName";
              },
              {
                kind: "account";
                path: "buyer";
              },
            ];
          };
        },
        {
          name: "buyer";
          writable: true;
          signer: true;
        },
        {
          name: "owner";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "storageAccountAddress";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "blobName";
          type: "string";
        },
      ];
    },
    {
      name: "registerBlob";
      docs: [
        "Register a new encrypted blob with its greenBox and price.",
        "Called by the file owner after uploading encrypted content to Shelby.",
      ];
      discriminator: [121, 87, 124, 41, 94, 254, 44, 87];
      accounts: [
        {
          name: "blobMetadata";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  98,
                  108,
                  111,
                  98,
                  95,
                  109,
                  101,
                  116,
                  97,
                  100,
                  97,
                  116,
                  97,
                ];
              },
              {
                kind: "arg";
                path: "storageAccountAddress";
              },
              {
                kind: "arg";
                path: "blobName";
              },
            ];
          };
        },
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "storageAccountAddress";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "blobName";
          type: "string";
        },
        {
          name: "greenBoxScheme";
          type: "u8";
        },
        {
          name: "greenBoxBytes";
          type: "bytes";
        },
        {
          name: "price";
          type: "u64";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "blobMetadata";
      discriminator: [93, 126, 241, 85, 221, 131, 119, 253];
    },
    {
      name: "receipt";
      discriminator: [39, 154, 73, 106, 80, 102, 145, 153];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "invalidOwner";
      msg: "Owner account does not match the blob's registered owner";
    },
  ];
  types: [
    {
      name: "blobMetadata";
      docs: [
        "Metadata for an encrypted blob registered on-chain.",
        "Stores the encrypted key (greenBox) and price for access.",
      ];
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            docs: ["The Solana owner who registered this blob"];
            type: "pubkey";
          },
          {
            name: "greenBoxScheme";
            docs: [
              "Encryption scheme used for the greenBox (2 = threshold IBE)",
            ];
            type: "u8";
          },
          {
            name: "greenBoxBytes";
            docs: [
              "The encrypted cipher key (greenBox) that can be decrypted via ACE",
            ];
            type: "bytes";
          },
          {
            name: "seqnum";
            docs: ["Sequence number for tracking updates"];
            type: "u64";
          },
          {
            name: "price";
            docs: ["Price in lamports to purchase access"];
            type: "u64";
          },
        ];
      };
    },
    {
      name: "receipt";
      docs: ["Receipt proving a buyer has purchased access to a blob."];
      type: {
        kind: "struct";
        fields: [
          {
            name: "seqnum";
            docs: [
              "Sequence number at time of purchase (must match blob's seqnum)",
            ];
            type: "u64";
          },
        ];
      };
    },
  ];
};
