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
if (!isset($data['action']) || empty($data['action'])) {
    http_response_code(400);
    echo json_encode(['error' => '缺少action参数']);
    exit;
}

$action = $data['action'];
$model_id = isset($data['model_id']) ? $data['model_id'] : '';
$timestamp = date('Y-m-d H:i:s');
$ip = $_SERVER['REMOTE_ADDR'];

// 统计目录
$stats_dir = __DIR__ . '/../static/stats';
if (!file_exists($stats_dir)) {
    mkdir($stats_dir, 0755, true);
}

// 统计文件
$log_file = $stats_dir . '/usage_log.json';

// 读取现有日志
$log_data = [];
if (file_exists($log_file)) {
    $log_content = file_get_contents($log_file);
    if (!empty($log_content)) {
        $log_data = json_decode($log_content, true);
    }
}

// 添加新记录
$log_data[] = [
    'action' => $action,
    'model_id' => $model_id,
    'timestamp' => $timestamp,
    'ip' => $ip,
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
];

// 只保留最近1000条记录
if (count($log_data) > 1000) {
    $log_data = array_slice($log_data, -1000);
}

// 保存日志
file_put_contents($log_file, json_encode($log_data, JSON_PRETTY_PRINT));

// 返回成功
echo json_encode(['success' => true]); 