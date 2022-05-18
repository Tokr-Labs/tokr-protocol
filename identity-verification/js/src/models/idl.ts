export type IdentityVerification = {
  "version": "0.2.0",
  "name": "identity_verification",
  "instructions": [
    {
      "name": "createRecord",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "getIsVerified",
      "accounts": [
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "record",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        }
      ],
      "returns": "bool"
    },
    {
      "name": "updateIaStatus",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        },
        {
          "name": "status",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateAmlStatus",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        },
        {
          "name": "status",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateKycStatus",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        },
        {
          "name": "status",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferAuthority",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferTo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferFrom",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "metadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "iaStatus",
            "type": "u8"
          },
          {
            "name": "amlStatus",
            "type": "u8"
          },
          {
            "name": "kycStatus",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UnknownStatus",
      "msg": "Unexpected Status"
    },
    {
      "code": 6001,
      "name": "NotAuthorized",
      "msg": "Not Authorized"
    }
  ]
};

export const IDL: IdentityVerification = {
  "version": "0.2.0",
  "name": "identity_verification",
  "instructions": [
    {
      "name": "createRecord",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "getIsVerified",
      "accounts": [
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "record",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        }
      ],
      "returns": "bool"
    },
    {
      "name": "updateIaStatus",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        },
        {
          "name": "status",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateAmlStatus",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        },
        {
          "name": "status",
          "type": "u8"
        }
      ]
    },
    {
      "name": "updateKycStatus",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        },
        {
          "name": "status",
          "type": "u8"
        }
      ]
    },
    {
      "name": "transferAuthority",
      "accounts": [
        {
          "name": "record",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "subject",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferTo",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "transferFrom",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "group",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "metadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "iaStatus",
            "type": "u8"
          },
          {
            "name": "amlStatus",
            "type": "u8"
          },
          {
            "name": "kycStatus",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "UnknownStatus",
      "msg": "Unexpected Status"
    },
    {
      "code": 6001,
      "name": "NotAuthorized",
      "msg": "Not Authorized"
    }
  ]
};
