const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './index.ts',
  target: 'node',
  node: {
    __dirname: false,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json',
              transpileOnly: true
            }
          }
        ],
      }
    ]
  },
  plugins: [
    new CopyPlugin([
      { from: 'src/client', to: 'src/client' },
      { from: 'src/*.cer', to: '' },
      { from: 'src/*.key', to: '' }
    ]),
  ],
};