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
    <title>测试 Midjourney API</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body>
    <div class="container mt-5">
        <h1>Midjourney API 测试</h1>
        
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">生成图像</h5>
                <form id="generateForm" class="mb-3">
                    <div class="mb-3">
                        <label for="prompt" class="form-label">提示词：</label>
                        <textarea id="prompt" class="form-control" rows="3" placeholder="请输入描述，例如：一只可爱的小猫在阳光下玩耍">A cozy treehouse cafe with a cat reading a book, cinematic style</textarea>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col">
                            <label for="width" class="form-label">宽度：</label>
                            <input type="number" id="width" class="form-control" value="1024">
                        </div>
                        <div class="col">
                            <label for="height" class="form-label">高度：</label>
                            <input type="number" id="height" class="form-control" value="768">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" id="generateBtn">
                        生成图像
                    </button>
                </form>
                
                <div class="mt-3 d-none" id="statusContainer">
                    <div class="alert alert-info mb-3" id="statusMessage">
                        任务已提交，正在处理...
                    </div>
                    <div class="progress mb-3">
                        <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 0%" id="progressBar"></div>
                    </div>
                </div>
                
                <div class="mt-3 d-none" id="resultContainer">
                    <h5>生成结果：</h5>
                    <div class="text-center">
                        <img id="resultImage" class="img-fluid border" alt="生成结果" style="max-height: 500px;">
                    </div>
                </div>
                
                <div class="mt-3 d-none" id="errorContainer">
                    <div class="alert alert-danger" id="errorMessage"></div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.getElementById('generateForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // 获取表单数据
            const prompt = document.getElementById('prompt').value.trim();
            const width = parseInt(document.getElementById('width').value);
            const height = parseInt(document.getElementById('height').value);
            
            if (!prompt) {
                alert('请输入提示词');
                return;
            }
            
            // 禁用按钮，显示状态
            const generateBtn = document.getElementById('generateBtn');
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 生成中...';
            
            // 显示状态容器
            document.getElementById('statusContainer').classList.remove('d-none');
            document.getElementById('resultContainer').classList.add('d-none');
            document.getElementById('errorContainer').classList.add('d-none');
            
            try {
                // 发送请求
                const response = await fetch('api/midjourney_generate.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        width: width,
                        height: height
                    })
                });
                
                updateProgress(50);
                
                // 解析响应
                const result = await response.json();
                
                if (result.success && result.image_url) {
                    // 显示结果
                    document.getElementById('resultImage').src = result.image_url;
                    document.getElementById('resultContainer').classList.remove('d-none');
                    updateProgress(100);
                } else {
                    // 显示错误
                    document.getElementById('errorMessage').textContent = result.error || '生成失败，请重试';
                    document.getElementById('errorContainer').classList.remove('d-none');
                    updateProgress(100, true);
                }
            } catch (error) {
                // 显示错误
                document.getElementById('errorMessage').textContent = `请求出错: ${error.message}`;
                document.getElementById('errorContainer').classList.remove('d-none');
                updateProgress(100, true);
            } finally {
                // 恢复按钮状态
                generateBtn.disabled = false;
                generateBtn.innerHTML = '生成图像';
            }
        });
        
        function updateProgress(percent, isError = false) {
            const progressBar = document.getElementById('progressBar');
            progressBar.style.width = `${percent}%`;
            
            if (isError) {
                progressBar.classList.remove('bg-primary');
                progressBar.classList.add('bg-danger');
            } else {
                progressBar.classList.remove('bg-danger');
                progressBar.classList.add('bg-primary');
            }
            
            if (percent === 100) {
                setTimeout(() => {
                    document.getElementById('statusContainer').classList.add('d-none');
                }, 1000);
            }
        }
    </script>
</body>
</html> 