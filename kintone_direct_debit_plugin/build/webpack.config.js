const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: argv.mode || 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    entry: {
      config: './src/js/config.js',
      desktop: './src/js/desktop.js'
    },

    output: {
      path: path.resolve(__dirname, 'dist/js'),
      filename: '[name].js',
      clean: true
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: '../image/[name][ext]'
          }
        }
      ]
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development'),
        'process.env.VERSION': JSON.stringify(require('../package.json').version),
        'process.env.BUILD_DATE': JSON.stringify(new Date().toISOString())
      })
    ],

    optimization: {
      minimize: isProduction,
      usedExports: true
    },

    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  };
};