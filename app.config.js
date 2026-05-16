// Loads .env for local builds; EAS cloud builds use eas.json / Expo dashboard env vars.
require("dotenv").config();

const appJson = require("./app.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
    },
  },
};
