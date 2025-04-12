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
if (!isset($data['text']) || empty($data['text'])) {
    http_response_code(400);
    echo json_encode(['error' => '缺少text参数']);
    exit;
}

$text = $data['text'];
$from_lang = isset($data['from_lang']) ? $data['from_lang'] : 'zh';
$to_lang = isset($data['to_lang']) ? $data['to_lang'] : 'en';

// 调用腾讯云翻译API
try {
    $translation = tencent_translate($text, $from_lang, $to_lang);
    echo json_encode(['success' => true, 'translation' => $translation]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * 使用腾讯云机器翻译API进行翻译
 */
function tencent_translate($text, $from_lang = 'zh', $to_lang = 'en') {
    // 腾讯云API密钥信息
    $secret_id = 'AKIDgMOHyRhu2xhS0KQK1VmrjOr69zc2NVP6';  // 腾讯云SecretId
    $secret_key = 'XrxqVwAF7mMjtqa6PUM1SgiW6SaUDk8I';     // 腾讯云SecretKey
    
    // 转换语言代码为腾讯云需要的格式
    $from = ($from_lang == 'zh-CHS' || $from_lang == 'zh-CN') ? 'zh' : $from_lang;
    $to = ($to_lang == 'zh-CHS' || $to_lang == 'zh-CN') ? 'zh' : $to_lang;
    
    // 服务地址
    $endpoint = "tmt.tencentcloudapi.com";
    $region = "ap-guangzhou"; // 广州区域
    
    // 准备请求参数
    $action = "TextTranslate";
    $version = "2018-03-21";
    $algorithm = "TC3-HMAC-SHA256";
    $timestamp = time();
    $date = gmdate("Y-m-d", $timestamp);
    $service = "tmt";
    
    // 构建规范请求串
    $payload = json_encode([
        "SourceText" => $text,
        "Source" => $from,
        "Target" => $to,
        "ProjectId" => 0
    ]);
    
    // 签名流程
    $http_request_method = "POST";
    $canonical_uri = "/";
    $canonical_querystring = "";
    $canonical_headers = "content-type:application/json; charset=utf-8\n"."host:".$endpoint."\n";
    $signed_headers = "content-type;host";
    $hashed_request_payload = hash("SHA256", $payload);
    $canonical_request = $http_request_method."\n"
        .$canonical_uri."\n"
        .$canonical_querystring."\n"
        .$canonical_headers."\n"
        .$signed_headers."\n"
        .$hashed_request_payload;
    
    // 计算签名
    $credential_scope = $date."/".$service."/tc3_request";
    $hashed_canonical_request = hash("SHA256", $canonical_request);
    $string_to_sign = $algorithm."\n"
        .$timestamp."\n"
        .$credential_scope."\n"
        .$hashed_canonical_request;
    
    $secret_date = hash_hmac("SHA256", $date, "TC3".$secret_key, true);
    $secret_service = hash_hmac("SHA256", $service, $secret_date, true);
    $secret_signing = hash_hmac("SHA256", "tc3_request", $secret_service, true);
    $signature = hash_hmac("SHA256", $string_to_sign, $secret_signing);
    
    // 构建授权信息
    $authorization = $algorithm
        ." Credential=".$secret_id."/".$credential_scope
        .", SignedHeaders=".$signed_headers
        .", Signature=".$signature;
    
    // 发送HTTP请求
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://".$endpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            "Authorization: ".$authorization,
            "Content-Type: application/json; charset=utf-8",
            "Host: ".$endpoint,
            "X-TC-Action: ".$action,
            "X-TC-Timestamp: ".$timestamp,
            "X-TC-Version: ".$version,
            "X-TC-Region: ".$region,
        ]
    ]);
    
    $response = curl_exec($curl);
    
    if (curl_errno($curl)) {
        log_error('腾讯云翻译请求失败: ' . curl_error($curl), [
            'text' => substr($text, 0, 100) . (strlen($text) > 100 ? "..." : "")
        ]);
        curl_close($curl);
        return "翻译请求失败，请稍后重试";
    }
    
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    if ($http_code >= 400) {
        log_error('腾讯云翻译返回错误状态码: ' . $http_code, [
            'response' => $response,
            'text' => substr($text, 0, 100) . (strlen($text) > 100 ? "..." : "")
        ]);
        return "翻译服务出错，请稍后重试";
    }
    
    // 解析响应
    $result = json_decode($response, true);
    
    // 检查响应格式
    if (!isset($result['Response']) || !isset($result['Response']['TargetText'])) {
        log_error('无法从腾讯云翻译API响应中获取翻译结果', [
            'response' => $response,
            'text' => substr($text, 0, 100) . (strlen($text) > 100 ? "..." : "")
        ]);
        return "获取翻译结果失败";
    }
    
    // 提取翻译结果
    $translation = $result['Response']['TargetText'];
    
    // 记录到翻译日志
    log_translation($text, $translation, $from, $to, 'tencent_translate');
    
    return $translation;
}

/**
 * 记录翻译日志
 */
function log_translation($source_text, $translated_text, $source_lang, $target_lang, $provider) {
    try {
        $log_dir = __DIR__ . '/../static/logs';
        
        // 如果日志目录不存在，创建它
        if (!file_exists($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        $log_file = $log_dir . '/translation_log.txt';
        
        // 生成日志内容
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] $source_lang -> $target_lang\n";
        $log_entry .= "Source: $source_text\n";
        $log_entry .= "Translation: $translated_text\n";
        $log_entry .= "Provider: $provider\n";
        $log_entry .= "-------------------------------------------\n";
        
        // 写入日志文件
        file_put_contents($log_file, $log_entry, FILE_APPEND);
    } catch (Exception $e) {
        // 如果记录日志失败，只记录到错误日志，不影响正常功能
        error_log('记录翻译日志失败: ' . $e->getMessage());
    }
}

/**
 * 记录错误信息到日志文件
 */
function log_error($message, $context = []) {
    $log_dir = __DIR__ . '/../static/logs';
    
    // 如果日志目录不存在，创建它
    if (!file_exists($log_dir)) {
        mkdir($log_dir, 0755, true);
    }
    
    $log_file = $log_dir . '/error_log.txt';
    $log_entry = date('Y-m-d H:i:s') . " | ERROR: " . $message;
    
    // 添加上下文信息（如果有）
    if (!empty($context)) {
        $log_entry .= " | Context: " . json_encode($context, JSON_UNESCAPED_UNICODE);
    }
    
    $log_entry .= "\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);
} 