/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ace_hook.json`.
 */
export type AceHook = {
  address: "8jDv41SQVKCaVtkbFS1ZaVDDCEtKkAc7QXV3Y1psGts9";
  metadata: {
    name: "aceHook";
    version: "0.1.0";
    spec: "0.1.0";
    description: "ACE hook - allows users to prove access by signing a transaction for decryption key providers";
  };
  instructions: [
    {
      name: "assertAccess";
      docs: [
        "Assert that the caller has access to the specified blob.",
        "This function is called by consumers who sign a transaction proving their access.",
        "The signed transaction can then be presented to decryption key providers as proof of permission.",
      ];
      discriminator: [236, 161, 40, 115, 1, 219, 223, 121];
      accounts: [
        {
          name: "blobMetadata";
        },
        {
          name: "receipt";
        },
        {
          name: "user";
          signer: true;
        },
      ];
      args: [
        {
          name: "fullBlobNameBytes";
          type: "bytes";
        },
      ];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "accessDenied";
      msg: "Access denied";
    },
    {
      code: 6001;
      name: "invalidBlobName";
      msg: "Invalid blob name format";
    },
    {
      code: 6002;
      name: "invalidAccountOwner";
      msg: "Invalid account owner";
    },
  ];
};
