import Fingerprint2 from "fingerprintjs2";

export interface DeviceFingerprint {
  fingerprint: string;
  components: Record<string, unknown>;
}

let cachedFingerprint: DeviceFingerprint | null = null;

export const getDeviceFingerprint = async (): Promise<DeviceFingerprint> => {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  return new Promise((resolve) => {
    Fingerprint2.get((components) => {
      const values = components.map((component) => component.value);
      const fingerprint = Fingerprint2.x64hash128(values.join(), 31);

      cachedFingerprint = {
        fingerprint,
        components: Object.fromEntries(components.map((c) => [c.key, c.value])),
      };

      resolve(cachedFingerprint);
    });
  });
};

export const clearCachedFingerprint = () => {
  cachedFingerprint = null;
};
