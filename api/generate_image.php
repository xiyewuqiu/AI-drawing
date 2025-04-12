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
$model_id = isset($data['model_id']) ? $data['model_id'] : 'fal-ai/recraft-v3';
$image_size = isset($data['image_size']) ? $data['image_size'] : 'square';
$steps = isset($data['steps']) ? (int)$data['steps'] : 30;
$guidance = isset($data['guidance']) ? (int)$data['guidance'] : 7;

// Recraft V3 特定参数
$style = isset($data['style']) ? $data['style'] : 'realistic_image';

// 调用fal.ai API
try {
    $image_url = generate_image($model_id, $prompt, $image_size, $steps, $guidance, $style);
    echo json_encode(['success' => true, 'image_url' => $image_url]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * 调用fal.ai API生成图像
 */
function generate_image($model_id, $prompt, $image_size = 'square', $steps = 30, $guidance = 7, $style = 'realistic_image') {
    // fal.ai API密钥库
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
    
    // 准备URL
    $url = "https://fal.run/${model_id}";
    
    // 准备参数，根据不同模型调整参数格式
    $payload = [];
    
    // 对于Recraft V3模型使用特殊格式
    if ($model_id === "fal-ai/recraft-v3") {
        // 确定图像尺寸
        $image_size_param = "square_hd"; // 默认高清方形
        
        if ($image_size === "square") {
            $image_size_param = "square_hd";
        } else if ($image_size === "portrait") {
            $image_size_param = "portrait_16_9";
        } else if ($image_size === "landscape") {
            $image_size_param = "landscape_16_9";
        }
        
        // 验证风格是否合法
        $valid_styles = ["realistic_image", "digital_illustration", "vector_illustration"];
        if (!in_array($style, $valid_styles)) {
            $style = "realistic_image"; // 默认风格
        }
        
        $payload = [
            "prompt" => $prompt,
            "image_size" => $image_size_param,
            "style" => $style
        ];
    }
    // Sana 4.8B 模型使用特殊参数格式
    else if (strpos($model_id, "fal-ai/sana") !== false) {
        // 处理图像尺寸
        $image_size_param = "square_hd"; // 默认高清方形
        
        if ($image_size === "square") {
            $image_width = 1024;
            $image_height = 1024;
        } else if ($image_size === "portrait") {
            $image_width = 1024;
            $image_height = 1536;
        } else if ($image_size === "landscape") {
            $image_width = 1536;
            $image_height = 1024;
        } else {
            // 4K超高清默认尺寸
            $image_width = 3840;
            $image_height = 2160;
        }
        
        $payload = [
            "prompt" => $prompt,
            "image_size" => [
                "width" => $image_width,
                "height" => $image_height
            ],
            "num_inference_steps" => $steps,
            "guidance_scale" => $guidance,
            "num_images" => 1,
            "enable_safety_checker" => true,
            "output_format" => "jpeg",
            "style_name" => "(No style)"
        ];
    }
    // SDXL Lightning 或 SD3 模型使用不同的参数格式
    else if (strpos($model_id, "lightning") !== false || strpos($model_id, "stable-diffusion-3") !== false) {
        $image_width = $image_size == "landscape" ? 1024 : 768;
        $image_height = $image_size == "portrait" ? 1024 : 768;
        
        if ($image_size == "square") {
            $image_width = $image_height = 768;
        }
        
        $payload = [
            "prompt" => $prompt,
            "image_width" => $image_width,
            "image_height" => $image_height
        ];
    } 
    // 其他Flux模型使用标准参数格式
    else {
        $payload = [
            "prompt" => $prompt,
            "image_size" => $image_size,
            "num_inference_steps" => $steps,
            "guidance_scale" => $guidance
        ];
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
        CURLOPT_TIMEOUT => 90, // 设置较长的超时时间，因为生成可能需要时间
    ]);
    
    $response = curl_exec($curl);
    
    if (curl_errno($curl)) {
        throw new Exception('生成图像请求失败: ' . curl_error($curl));
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
                throw new Exception('生成图像失败，HTTP状态码: ' . $http_code);
            }
        } else {
            throw new Exception('生成图像失败，HTTP状态码: ' . $http_code);
        }
    }
    
    curl_close($curl);
    
    // 解析响应
    $result = json_decode($response, true);
    
    // 提取图像URL
    if ($model_id === "fal-ai/recraft-v3") {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    } else if (strpos($model_id, "lightning") !== false || strpos($model_id, "stable-diffusion-3") !== false) {
        if (isset($result['image']['url'])) {
            return $result['image']['url'];
        }
    } else {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    }
    
    throw new Exception('无法从API响应中获取图像URL');
} 