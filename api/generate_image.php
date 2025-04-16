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

// 读取请求数据（支持JSON和表单格式）
$data = [];
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';

if (strpos($contentType, 'application/json') !== false) {
    // 解析JSON格式
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
} else if (strpos($contentType, 'application/x-www-form-urlencoded') !== false) {
    // 解析表单格式
    $data = $_POST;
}

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

// FLUX Ultra 特定参数
$seed = isset($data['seed']) ? (int)$data['seed'] : null;
$raw = isset($data['raw']) ? (bool)$data['raw'] : false;
$aspect_ratio = isset($data['aspect_ratio']) ? $data['aspect_ratio'] : '16:9';

// 调用fal.ai API
try {
    $image_url = generate_image($model_id, $prompt, $image_size, $steps, $guidance, $style, $seed, $raw, $aspect_ratio);
    
    // 记录生成历史
    save_generation_history([
        'type' => 'image',
        'image_url' => $image_url,
        'prompt' => $prompt,
        'model_id' => $model_id,
        'image_size' => $image_size,
        'steps' => $steps,
        'guidance' => $guidance,
        'style' => $style,
        'seed' => $seed,
        'raw' => $raw,
        'aspect_ratio' => $aspect_ratio,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR']
    ]);
    
    echo json_encode(['success' => true, 'image_url' => $image_url]);
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
 * 调用fal.ai API生成图像
 */
function generate_image($model_id, $prompt, $image_size = 'square', $steps = 30, $guidance = 7, $style = 'realistic_image', $seed = null, $raw = false, $aspect_ratio = '16:9') {
    // 使用全局密钥变量
    global $COMMON_API_KEYS;
    
    // 随机选择一个API密钥
    $api_key = $COMMON_API_KEYS[array_rand($COMMON_API_KEYS)];
    
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
    // HiDream-I1-Full 模型使用特殊参数格式
    else if ($model_id === "fal-ai/hidream-i1-full") {
        // 处理图像尺寸
        $image_size_param = "square_hd"; // 默认高清方形
        
        if ($image_size === "square") {
            $image_size_param = "square_hd";
        } else if ($image_size === "portrait") {
            $image_size_param = "portrait_16_9";
        } else if ($image_size === "landscape") {
            $image_size_param = "landscape_16_9";
        }
        
        $payload = [
            "prompt" => $prompt,
            "negative_prompt" => "", // 使用空字符串作为默认值
            "image_size" => $image_size_param,
            "num_inference_steps" => $steps,
            "guidance_scale" => $guidance,
            "num_images" => 1,
            "enable_safety_checker" => true,
            "output_format" => "jpeg"
        ];
        
        // 如果提供了seed，添加到payload
        if ($seed !== null) {
            $payload["seed"] = $seed;
        }
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
    // Flux.1 [dev] 模型参数格式
    else if ($model_id === "fal-ai/flux/dev") {
        // 确定图像尺寸
        $image_size_param = "square"; // 默认方形
        
        if ($image_size === "square") {
            $image_size_param = "square";
        } else if ($image_size === "portrait") {
            $image_size_param = "portrait_4_3";
        } else if ($image_size === "landscape") {
            $image_size_param = "landscape_4_3";
        }
        
        $payload = [
            "prompt" => $prompt,
            "image_size" => $image_size_param,
            "num_inference_steps" => $steps,
            "guidance_scale" => $guidance,
            "num_images" => 1,
            "enable_safety_checker" => true
        ];
    }
    // FLUX Ultra 特定参数格式
    else if ($model_id === "fal-ai/flux-pro/v1.1-ultra") {
        // 对于FLUX 1.1 [pro] ultra, 使用aspect_ratio参数
        $payload = [
            "prompt" => $prompt,
            "num_images" => 1,
            "enable_safety_checker" => true,
            "safety_tolerance" => "2",
            "output_format" => "jpeg",
            "aspect_ratio" => $aspect_ratio
        ];
        
        // 如果提供了seed，添加到payload
        if ($seed !== null) {
            $payload["seed"] = $seed;
        }
        
        // 如果启用了raw模式，添加到payload
        if ($raw) {
            $payload["raw"] = true;
        }
    }
    // FLUX Ultra 微调版特定参数格式
    else if ($model_id === "fal-ai/flux-pro/v1.1-ultra-finetuned") {
        // 对于FLUX 1.1 [pro] ultra微调版, 使用类似的参数但添加微调相关参数
        $payload = [
            "prompt" => $prompt,
            "num_images" => 1,
            "enable_safety_checker" => true,
            "safety_tolerance" => "2",
            "output_format" => "jpeg",
            "aspect_ratio" => $aspect_ratio,
            "finetune_id" => "", // 如果需要特定微调ID，可通过前端传入
            "finetune_strength" => 1.0 // 默认微调强度，可通过前端调整
        ];
        
        // 如果提供了seed，添加到payload
        if ($seed !== null) {
            $payload["seed"] = $seed;
        }
        
        // 如果启用了raw模式，添加到payload
        if ($raw) {
            $payload["raw"] = true;
        }
    }
    // MiniMax (Hailuo AI) 模型使用特殊参数格式
    else if ($model_id === "fal-ai/minimax-image") {
        $payload = [
            "prompt" => $prompt,
            "aspect_ratio" => $aspect_ratio,
            "num_images" => 1,
            "prompt_optimizer" => true
        ];
    }
    // Lumina Image 2 模型使用特殊参数格式
    else if ($model_id === "fal-ai/lumina-image/v2") {
        // 处理图像尺寸
        $width = 1024;
        $height = 768;
        
        if ($image_size === "portrait") {
            $width = 768;
            $height = 1024;
        } else if ($image_size === "square") {
            $width = $height = 768;
        }
        
        $payload = [
            "prompt" => $prompt
        ];
        
        // 如果提供了宽高，使用提供的宽高
        if (isset($data['width']) && isset($data['height'])) {
            $width = (int)$data['width'];
            $height = (int)$data['height'];
        }
        
        $payload["width"] = $width;
        $payload["height"] = $height;
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
        $used_keys = [$api_key];
        
        // 尝试最多3次
        for ($i = 0; $i < 3; $i++) {
            // 获取一个新的、不同的API密钥
            do {
                $new_api_key = $COMMON_API_KEYS[array_rand($COMMON_API_KEYS)];
            } while (in_array($new_api_key, $used_keys) && count($COMMON_API_KEYS) > count($used_keys));
            
            // 如果所有密钥都已尝试，退出循环
            if (in_array($new_api_key, $used_keys)) {
                break;
            }
            
            $used_keys[] = $new_api_key;
            
            // 使用新密钥重试
            curl_setopt($curl, CURLOPT_HTTPHEADER, [
                'Authorization: Key ' . $new_api_key,
                'Content-Type: application/json'
            ]);
            
            $response = curl_exec($curl);
            $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            
            // 如果成功，退出循环
            if ($http_code < 400) {
                break;
            }
        }
        
        // 如果仍然失败
        if ($http_code >= 400) {
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
    } else if ($model_id === "fal-ai/flux/dev" || $model_id === "fal-ai/flux-pro/v1.1-ultra") {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    } else if ($model_id === "fal-ai/flux-pro/v1.1-ultra-finetuned") {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    } else if ($model_id === "fal-ai/hidream-i1-full") {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    } else if ($model_id === "fal-ai/minimax-image") {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    } else if ($model_id === "fal-ai/lumina-image/v2") {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    } else {
        if (isset($result['images']) && is_array($result['images']) && count($result['images']) > 0) {
            return $result['images'][0]['url'];
        }
    }
    
    throw new Exception('无法从API响应中获取图像URL');
} 