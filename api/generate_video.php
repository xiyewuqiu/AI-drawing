<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 引入API密钥配置文件
require_once __DIR__ . '/config/keys.php';

// 处理OPTIONS请求（预检请求）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 确保请求是POST方法
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => '只支持POST请求']);
    exit;
}

// 获取JSON请求体
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// 验证请求参数
if (!isset($data['image_url']) || empty($data['image_url'])) {
    http_response_code(400);
    echo json_encode(['error' => '缺少image_url参数']);
    exit;
}

if (!isset($data['prompt']) || empty($data['prompt'])) {
    http_response_code(400);
    echo json_encode(['error' => '缺少prompt参数']);
    exit;
}

// 提取必要参数
$image_url = $data['image_url'];
$prompt = $data['prompt'];
$aspect_ratio = isset($data['aspect_ratio']) ? $data['aspect_ratio'] : 'auto';
$duration = isset($data['duration']) ? $data['duration'] : '5s';
$model = isset($data['model']) ? $data['model'] : 'veo2'; // 默认使用veo2模型

// 调用API生成视频
try {
    $video_url = '';
    if ($model === 'wan-pro') {
        $video_url = generate_video_wan_pro($image_url, $prompt);
    } else {
        $video_url = generate_video_veo2($image_url, $prompt, $aspect_ratio, $duration);
    }
    
    // 记录生成历史
    save_generation_history([
        'type' => 'video',
        'from' => 'image',
        'video_url' => $video_url,
        'original_image' => $image_url,
        'prompt' => $prompt,
        'aspect_ratio' => $aspect_ratio,
        'duration' => $duration,
        'model' => $model,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR']
    ]);
    
    echo json_encode(['success' => true, 'video_url' => $video_url]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * 保存生成历史记录
 */
function save_generation_history($record) {
    // 历史记录目录
    $history_dir = __DIR__ . '/../static/history';
    if (!file_exists($history_dir)) {
        mkdir($history_dir, 0755, true);
    }
    
    // 历史记录文件
    $history_file = $history_dir . '/generation_history.json';
    
    // 读取现有历史记录
    $history_data = [];
    if (file_exists($history_file)) {
        $history_content = file_get_contents($history_file);
        if (!empty($history_content)) {
            $history_data = json_decode($history_content, true);
        }
    }
    
    // 添加新记录
    array_unshift($history_data, $record);
    
    // 保留最近5000条记录
    if (count($history_data) > 5000) {
        $history_data = array_slice($history_data, 0, 5000);
    }
    
    // 保存历史记录
    file_put_contents($history_file, json_encode($history_data, JSON_PRETTY_PRINT));
}

/**
 * 调用fal.ai Veo2 API生成视频
 */
function generate_video_veo2($image_url, $prompt, $aspect_ratio = 'auto', $duration = '5s') {
    // 使用全局密钥变量
    global $FAL_API_KEYS;
    
    // 随机选择一个API密钥
    $api_key = getRandomApiKey($FAL_API_KEYS);
    
    // 准备URL - Veo 2 API端点
    $url = "https://fal.run/fal-ai/veo2/image-to-video";
    
    // 准备请求参数
    $payload = [
        "prompt" => $prompt,
        "image_url" => $image_url,
        "aspect_ratio" => $aspect_ratio,
        "duration" => $duration
    ];
    
    // 准备HTTP请求
    $headers = [
        'Authorization: Key ' . $api_key,
        'Content-Type: application/json'
    ];
    
    // 发送请求
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 180, // 设置较长的超时时间，视频生成需要更长时间
    ]);
    
    $response = curl_exec($curl);
    
    if (curl_errno($curl)) {
        throw new Exception('生成视频请求失败: ' . curl_error($curl));
    }
    
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if ($http_code >= 400) {
        // 如果第一次请求失败，尝试使用另一个API密钥
        $second_api_key = getRandomApiKey($FAL_API_KEYS);
        if ($second_api_key !== $api_key) {
            curl_setopt($curl, CURLOPT_HTTPHEADER, [
                'Authorization: Key ' . $second_api_key,
                'Content-Type: application/json'
            ]);
            $response = curl_exec($curl);
            $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            
            if ($http_code >= 400) {
                throw new Exception('生成视频失败，HTTP状态码: ' . $http_code);
            }
        } else {
            throw new Exception('生成视频失败，HTTP状态码: ' . $http_code);
        }
    }
    
    curl_close($curl);
    
    // 解析响应
    $result = json_decode($response, true);
    
    // 提取视频URL
    if (isset($result['video']) && isset($result['video']['url'])) {
        return $result['video']['url'];
    }
    
    // 如果无法直接获取URL，尝试其他格式
    if (isset($result['video'])) {
        return $result['video']['url'] ?? '';
    }
    
    throw new Exception('无法从API响应中获取视频URL');
}

/**
 * 调用fal.ai WAN-Pro API生成视频
 */
function generate_video_wan_pro($image_url, $prompt) {
    // 使用全局密钥变量
    global $WAN_PRO_API_KEYS;
    
    // 随机选择一个API密钥
    $api_key = getRandomApiKey($WAN_PRO_API_KEYS);
    
    // 准备URL - WAN-Pro API端点
    $url = "https://fal.run/fal-ai/wan-pro/image-to-video";
    
    // 准备请求参数
    $payload = [
        "prompt" => $prompt,
        "image_url" => $image_url,
        "enable_safety_checker" => true
    ];
    
    // 准备HTTP请求
    $headers = [
        'Authorization: Key ' . $api_key,
        'Content-Type: application/json'
    ];
    
    // 发送请求
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 180, // WAN-Pro可能需要更长时间来生成高质量视频
    ]);
    
    $response = curl_exec($curl);
    
    if (curl_errno($curl)) {
        throw new Exception('生成视频请求失败: ' . curl_error($curl));
    }
    
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if ($http_code >= 400) {
        // 如果第一次请求失败，尝试使用另一个API密钥
        $second_api_key = getRandomApiKey($WAN_PRO_API_KEYS);
        if ($second_api_key !== $api_key) {
            curl_setopt($curl, CURLOPT_HTTPHEADER, [
                'Authorization: Key ' . $second_api_key,
                'Content-Type: application/json'
            ]);
            $response = curl_exec($curl);
            $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            
            if ($http_code >= 400) {
                throw new Exception('生成视频失败，HTTP状态码: ' . $http_code);
            }
        } else {
            throw new Exception('生成视频失败，HTTP状态码: ' . $http_code);
        }
    }
    
    curl_close($curl);
    
    // 解析响应
    $result = json_decode($response, true);
    
    // 提取视频URL
    if (isset($result['video']) && isset($result['video']['url'])) {
        return $result['video']['url'];
    }
    
    // 如果无法直接获取URL，尝试其他格式
    if (isset($result['video'])) {
        return $result['video']['url'] ?? '';
    }
    
    throw new Exception('无法从API响应中获取视频URL');
} 