<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理OPTIONS请求（预检请求）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 确保请求是GET方法
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => '只支持GET请求']);
    exit;
}

// 统计目录
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

// 获取分页参数
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$page_size = isset($_GET['page_size']) ? (int)$_GET['page_size'] : 20;

// 验证页码和页面大小
if ($page < 1) $page = 1;
if ($page_size < 1 || $page_size > 100) $page_size = 20;

// 计算总页数
$total_items = count($history_data);
$total_pages = ceil($total_items / $page_size);

// 分页获取数据
$start = ($page - 1) * $page_size;
$paginated_data = array_slice($history_data, $start, $page_size);

// 返回分页后的数据和分页信息
echo json_encode([
    'items' => $paginated_data,
    'pagination' => [
        'current_page' => $page,
        'page_size' => $page_size,
        'total_items' => $total_items,
        'total_pages' => $total_pages
    ]
]); 