'use strict';

//用来遍历文件
const glob = require('glob'); 
//用来获取路径
const path = require('path');
//用来获取webpack库
const webpack = require('webpack'); 
//用来应用各种插件功能
const HtmlWebpackPlugin = require('html-webpack-plugin'); 
//用来自动清理dist目录
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
//用来提取页面公共资源
const HtmlWebpackExternalsPlugin= require('html-webpack-externals-plugin');

const setMPA = () => {
    const entry = {};
    const htmlWebpackPlugins = [];
    
    //利用glob遍历所有的入口文件
    const entryFiles = glob.sync(path.join(__dirname, './src/*/index.js'));
    /*
    console.log(entryFiles);
    [
        'E:/work/web-project/webpack-test/c2/src/index/index.js',
        'E:/work/web-project/webpack-test/c2/src/search/index.js'
    ]
    */
    Object.keys(entryFiles)
        .map((index) => {
            //入口文件路径
            const entryFile = entryFiles[index];
            //匹配入口文件chunk
            const match = entryFile.match(/src\/(.*)\/index\.js/);
            const chunk = match && match[1];
            entry[chunk] = entryFile;
            //组装HtmlWebpackPlugin
            htmlWebpackPlugins.push(
                new HtmlWebpackPlugin({
                    template: path.join(__dirname, `./src/${chunk}/index.html`),
                    filename: `${chunk}.html`,
                    chunks: [chunk]
                    /*inject: true,
                    minify: {
                        html5: true,
                        collapseWhitespace: true,
                        preserveLineBreaks: false,
                        minifyCSS: true,
                        minifyJS: true,
                        removeComments: false
                    }*/
                })
            )
        })

    return {
        entry,
        htmlWebpackPlugins
    }
}

const { entry, htmlWebpackPlugins } = setMPA();

module.exports = {
    entry: entry,
    output: {
        path: path.join(__dirname, './dist'),
        filename: '[name].js'
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /.js$/,
                use: 'babel-loader'
            },
            {
                test: /.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /.(png|jpg|gif|jpeg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10240
                        }
                    }
                ]
            },
            {
                test: /.(woff|woff2|eot|ttf|otf)$/,
                use: 'file-loader'
            },
            {
                test: /\.js$/,
                loader: 'eslint-loader',
                enforce: "pre",
                include: [path.resolve(__dirname, 'src')], // 指定检查的目录
                options: { // 这里的配置项参数将会被传递到 eslint 的 CLIEngine 
                    formatter: require('eslint-friendly-formatter') // 指定错误报告的格式规范
                }
            }
        ]
    },
    externals: {
        //jQuery: "jQuery" //需要不打包的外部库
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        //new CleanWebpackPlugin(),
        new HtmlWebpackExternalsPlugin({ //可以替代externals
            externals: [
                {
                    module: 'jQuery',
                    entry: 'https://code.jquery.com/jquery-1.9.0.min.js',
                    global: 'jQuery'
                }
            ]
        })
    ].concat(htmlWebpackPlugins),
    devtool: 'source-map',
    devServer: {
        contentBase: './dist',
        hot: true
    },
};
