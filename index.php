<?php
// 强制禁止缓存
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="AI图像生成器 - 输入中文描述，自动翻译并生成精美图像，支持多种AI模型">
    <meta name="keywords" content="AI, 图像生成, 人工智能, 文生图, 中文描述, fal.ai">
    <title>AI 图像生成器 - my.djxs.xyz</title>
    <link rel="icon" href="static/img/favicon.ico" type="image/x-icon">
    <!-- 样式表 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="static/css/style.css?v=<?php echo time(); ?>">
    <!-- Font Awesome 图标 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- 引入Lodash -->
    <script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
    <!-- 引入Vue.js -->
    <script src="https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js"></script>
    <!-- 引入axios进行HTTP请求 -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
    <div id="app">
        <!-- Vue应用将在这里渲染 -->
    </div>

    <!-- 主应用脚本 -->
    <script src="static/js/app.js?v=<?php echo time(); ?>"></script>
</body>
</html> 