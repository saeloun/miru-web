const encoder = new globalThis.TextEncoder();

const base64UrlToUint8Array = (value: string) => {
  const padding = "=".repeat((4 - (value.length % 4 || 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const bufferToBase64Url = (value?: ArrayBuffer | null) => {
  if (!value) return null;

  const bytes = new Uint8Array(value);
  let binary = "";

  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const prepareCreationOptions = (options: any) => {
  if (typeof window.PublicKeyCredential !== "undefined") {
    const parser = (window.PublicKeyCredential as any)
      .parseCreationOptionsFromJSON;
    if (typeof parser === "function") {
      return { publicKey: parser(options) };
    }
  }

  return {
    publicKey: {
      ...options,
      challenge: base64UrlToUint8Array(options.challenge),
      user: {
        ...options.user,
        id:
          typeof options.user?.id === "string"
            ? encoder.encode(options.user.id)
            : options.user?.id,
      },
      excludeCredentials: (options.excludeCredentials || []).map(
        credential => ({
          ...credential,
          id: base64UrlToUint8Array(credential.id),
        })
      ),
    },
  };
};

const prepareRequestOptions = (options: any) => {
  if (typeof window.PublicKeyCredential !== "undefined") {
    const parser = (window.PublicKeyCredential as any)
      .parseRequestOptionsFromJSON;
    if (typeof parser === "function") {
      return { publicKey: parser(options) };
    }
  }

  return {
    publicKey: {
      ...options,
      challenge: base64UrlToUint8Array(options.challenge),
      allowCredentials: (options.allowCredentials || []).map(credential => ({
        ...credential,
        id: base64UrlToUint8Array(credential.id),
      })),
    },
  };
};

const serializeCredential = (credential: any) => {
  if (!credential) throw new Error("No passkey response received.");

  if (typeof credential.toJSON === "function") return credential.toJSON();

  return {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    clientExtensionResults:
      typeof credential.getClientExtensionResults === "function"
        ? credential.getClientExtensionResults()
        : {},
    response:
      credential.response &&
      "attestationObject" in credential.response &&
      "getTransports" in credential.response
        ? {
            attestationObject: bufferToBase64Url(
              credential.response.attestationObject
            ),
            clientDataJSON: bufferToBase64Url(
              credential.response.clientDataJSON
            ),
            transports:
              typeof credential.response.getTransports === "function"
                ? credential.response.getTransports()
                : [],
          }
        : {
            authenticatorData: bufferToBase64Url(
              credential.response.authenticatorData
            ),
            clientDataJSON: bufferToBase64Url(
              credential.response.clientDataJSON
            ),
            signature: bufferToBase64Url(credential.response.signature),
            userHandle: bufferToBase64Url(credential.response.userHandle),
          },
  };
};

export const passkeysSupported = () =>
  typeof window !== "undefined" &&
  typeof window.PublicKeyCredential !== "undefined" &&
  typeof navigator !== "undefined" &&
  !!navigator.credentials;

export const beginPasskeyRegistration = async (options: any) => {
  if (!passkeysSupported()) {
    throw new Error("Passkeys are not supported in this browser.");
  }

  const credential = await navigator.credentials.create(
    prepareCreationOptions(options)
  );

  return serializeCredential(credential);
};

export const beginPasskeyAuthentication = async (options: any) => {
  if (!passkeysSupported()) {
    throw new Error("Passkeys are not supported in this browser.");
  }

  const credential = await navigator.credentials.get(
    prepareRequestOptions(options)
  );

  return serializeCredential(credential);
};
