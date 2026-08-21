module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-transform-imports',
        {
          // Metro does not tree-shake the lucide barrel (1700+ icons), so rewrite
          // each named import to the package's own ./icons/* subpath export.
          // Deep paths like dist/esm/icons/*.mjs must NOT be used: package
          // exports are enabled by default from SDK 53 on and would block them.
          'lucide-react-native': {
            transform: (importName) =>
              `lucide-react-native/icons/${importName
                .replace(/([a-z])([A-Z])/g, '$1-$2')
                .replace(/([A-Za-z])(\d)/g, '$1-$2')
                .toLowerCase()}`,
            preventFullImport: true,
          },
        },
      ],
    ],
  };
};
