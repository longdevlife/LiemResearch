const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withPackagingOptions(config) {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Add the packagingOptions block to merge duplicate libworklets.so files
    const packagingOptions = `
android {
    packagingOptions {
        pickFirst 'lib/x86/libworklets.so'
        pickFirst 'lib/x86_64/libworklets.so'
        pickFirst 'lib/armeabi-v7a/libworklets.so'
        pickFirst 'lib/arm64-v8a/libworklets.so'
    }
}
`;
    if (!buildGradle.includes('packagingOptions')) {
      config.modResults.contents = buildGradle + packagingOptions;
    }
    return config;
  });
};
