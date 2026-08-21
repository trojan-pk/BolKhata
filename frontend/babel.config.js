module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'babel-plugin-transform-import-meta',
      [
        'babel-plugin-transform-imports',
        {
          'lucide-react-native': {
            transform: importName => `lucide-react-native/dist/esm/icons/${importName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.js`,
            preventFullImport: true,
          },
        },
      ],
    ],
  };
};
