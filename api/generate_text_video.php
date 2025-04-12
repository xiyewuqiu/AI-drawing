<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
if (!isset($data['prompt']) || empty($data['prompt'])) {
    http_response_code(400);
    echo json_encode(['error' => '缺少prompt参数']);
    exit;
}

// 提取必要参数
$prompt = $data['prompt'];
$num_inference_steps = isset($data['num_inference_steps']) ? (int)$data['num_inference_steps'] : 30;
$seed = isset($data['seed']) ? (int)$data['seed'] : null;
$enable_safety_checker = isset($data['enable_safety_checker']) ? (bool)$data['enable_safety_checker'] : true;

// 调用fal.ai API
try {
    $video_url = generate_text_video($prompt, $num_inference_steps, $seed, $enable_safety_checker);
    echo json_encode(['success' => true, 'video_url' => $video_url]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * 调用fal.ai StepFun Video API生成视频
 */
function generate_text_video($prompt, $num_inference_steps = 30, $seed = null, $enable_safety_checker = true) {
    // fal.ai API密钥库（与其他API共用密钥）
    $fal_api_keys = [
        "736c053d-58db-4f6f-9717-154dfd0a181b:857c40692e3bc5a5f3e496282a506b91",
        "84066f4d-e970-4a22-9bd1-d861b44892e3:7081ca3f337ff27477809c9014c0adb1",
        "afe539a9-640b-454a-9e66-86d49ee9d514:f58269ca0839d93d8323eadd21a36695",
        "825d67cd-c89b-4ca1-a8a8-bbe5c99da1b2:42cf185082ace2d1699962adaf60f182",
        "afa7c832-f593-420c-aa7f-7d1952b4bff2:ee6b6772f37b0b69d45130b9dc98e3b6",
        "fc42dc90-aedb-44bc-bd05-4d8dd4b246d3:c39b514b7c2b55d3d2e09ccf484b7bcb",
        "3adf5573-42e6-4ec0-b734-91e29a5591cb:c754392ecf1b4d016c4676c98ead3983",
        "d5ee4097-467b-46e2-84c2-75b1bc391f17:190abc27f2924ee6fb248332ca5ac09b",
        "05ecd944-db81-4582-984b-4faf815d6f0b:1123a5dd1535d6a1e8456e7be1a1051b",
        "7f65279f-f9d3-4c83-a88e-c79887fadc80:ec6d6aa2c7d55b30ec06c2c3a898d70a"
    ];
    
    // 随机选择一个API密钥
    $api_key = $fal_api_keys[array_rand($fal_api_keys)];
    
    // 准备URL - StepFun Video API端点
    $url = "https://fal.run/fal-ai/stepfun-video";
    
    // 准备请求参数
    $payload = [
        "prompt" => $prompt,
        "num_inference_steps" => $num_inference_steps,
        "enable_safety_checker" => $enable_safety_checker
    ];
    
    // 如果提供了种子，添加到请求中
    if (!is_null($seed)) {
        $payload["seed"] = $seed;
    }
    
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
        CURLOPT_TIMEOUT => 300, // 设置较长的超时时间，视频生成需要更长时间
    ]);
    
    $response = curl_exec($curl);
    
    if (curl_errno($curl)) {
        throw new Exception('生成视频请求失败: ' . curl_error($curl));
    }
    
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if ($http_code >= 400) {
        // 如果第一次请求失败，尝试使用另一个API密钥
        $second_api_key = $fal_api_keys[array_rand($fal_api_keys)];
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
        // 记录日志
        log_video_generation($prompt, $result['video']['url'], $result['seed'] ?? null);
        return $result['video']['url'];
    }
    
    throw new Exception('无法从API响应中获取视频URL');
}

/**
 * 记录视频生成日志
 */
function log_video_generation($prompt, $video_url, $seed = null) {
    try {
        $log_dir = __DIR__ . '/../static/logs';
        
        // 如果日志目录不存在，创建它
        if (!file_exists($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        $log_file = $log_dir . '/text_video_generation_log.txt';
        
        // 生成日志内容
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] 直接文本到视频生成\n";
        $log_entry .= "Prompt: $prompt\n";
        $log_entry .= "Video URL: $video_url\n";
        
        if (!is_null($seed)) {
            $log_entry .= "Seed: $seed\n";
        }
        
        $log_entry .= "-------------------------------------------\n";
        
        // 写入日志文件
        file_put_contents($log_file, $log_entry, FILE_APPEND);
    } catch (Exception $e) {
        // 如果记录日志失败，只记录到错误日志，不影响正常功能
        error_log('记录视频生成日志失败: ' . $e->getMessage());
    }
} 