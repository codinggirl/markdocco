# Markdocco

Markdocco 是一个简单粗暴的文档生成器，仅用于将有注释的 markdown 文件生成 html 文件。

## 背景

项目受 Jash Kenas's [Docco](http://jashkenas.github.com/docco/) 的启发而生。

一开始我用的就是 `docco` 来生成文档，但对于 markdown 文件来说，多少有些不便，因此我在 `docco` 的
基础上重新写了一个程序。

## 用法

安装:

```
npm install -g markdocco
```

用法: `markdocco [参数] 文件项`

参数：

```
    -h, --help             output usage information
    -V, --version          output the version number
    -l, --layout [layout]  choose a built-in layouts (parallel, linear)
    -c, --css [file]       use a custom css file
    -o, --output [path]    use a custom output path
    -t, --template [file]  use a custom .jst template
    -e, --extension [ext]  use the given file extension for all inputs
    -L, --languages [file] use a custom languages.json
    -m, --marked [file]    use custom marked options
```

## 授权协议

Copyright (c) 2019 Richard Libre.

本项目基于 [MIT 协议](LICENSE)。
