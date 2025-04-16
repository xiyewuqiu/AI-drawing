<?php
/**
 * API密钥配置文件
 * 集中存储所有API服务的密钥
 */

// 所有服务共用的API密钥库（除翻译服务外）
$COMMON_API_KEYS = [
    "0a170b44-d459-41da-95be-8b13408e647c:13ad6a53a3bf96381a17cf168f014b77",
    "624cf58e-234c-4bee-a236-a6bfb9802214:89186f11eb748161381e5084efe3de5f",
    "afb5d055-2be4-4c42-b650-7aa4a81076a1:6a30886b9928d398cad6d4d0588bd9b4"
];

// 为了保持向后兼容性，将共用API密钥赋值给各个服务的密钥变量
$FAL_API_KEYS = $COMMON_API_KEYS;
$WAN_PRO_API_KEYS = $COMMON_API_KEYS;
$HIDREAM_API_KEYS = $COMMON_API_KEYS;

// 翻译API密钥（单独保留）
$TRANSLATION_API_KEYS = [
    'tencent' => [
        'secret_id' => 'AKIDgMOHyRhu2xhS0KQK1VmrjOr69zc2NVP6', 
        'secret_key' => 'XrxqVwAF7mMjtqa6PUM1SgiW6SaUDk8I'
    ],
    // 这里可以添加其他翻译服务的API密钥
];

// 函数：随机获取一个API密钥
function getRandomApiKey($keyArray) {
    // 对于除翻译外的所有服务，使用共同的API密钥池
    global $COMMON_API_KEYS, $TRANSLATION_API_KEYS;
    
    // 如果传入的不是翻译API密钥数组，则使用共用密钥
    if ($keyArray !== $TRANSLATION_API_KEYS) {
        return $COMMON_API_KEYS[array_rand($COMMON_API_KEYS)];
    }
    
    // 对于翻译API，保持原有逻辑
    return $keyArray[array_rand($keyArray)];
} 

/**
 * @param array $keyArray 包含API密钥的数组
 * @return string|null 随机选择的API密钥，如果数组为空则返回null
 */
function getRandomApiKeyFromArray($keyArray) {
    if (empty($keyArray)) {
        return null;
    }
    return $keyArray[array_rand($keyArray)];
}