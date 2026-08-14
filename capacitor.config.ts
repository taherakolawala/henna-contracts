import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tampabayhenna.contracts",
  appName: "HennaDocs",
  webDir: "dist/renderer",
  android: {
    allowMixedContent: false,
  },
};

export default config;
