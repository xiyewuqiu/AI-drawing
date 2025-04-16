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
    <!-- 引入动画库 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
</head>
<body>
    <div id="app">
        <!-- 欢迎动画 -->
        <transition name="fade">
            <div class="welcome-animation" v-if="showWelcomeAnimation">
                <button class="welcome-close" @click="closeWelcomeAnimation">
                    <i class="fas fa-times"></i>
                </button>
                <div class="welcome-content">
                    <div class="welcome-logo">AI 图像生成器</div>
                    <div class="welcome-subtitle">输入中文描述，一键生成精美AI图像</div>
                    <button class="btn btn-primary" @click="closeWelcomeAnimation">
                        <i class="fas fa-magic me-2"></i>开始创作
                    </button>
                </div>
            </div>
        </transition>
        
        <!-- 通知系统 -->
        <div class="notification-container">
            <transition-group name="notification">
                <div v-for="notification in notifications" :key="notification.id" 
                     :class="['notification', notification.type, { 'closing': !notification.show }]">
                    <div class="notification-icon">
                        <i class="fas" 
                           :class="{
                               'fa-info-circle': notification.type === 'info',
                               'fa-check-circle': notification.type === 'success',
                               'fa-exclamation-triangle': notification.type === 'warning',
                               'fa-times-circle': notification.type === 'error'
                           }">
                        </i>
                    </div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <button class="notification-close" @click="closeNotification(notification.id)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </transition-group>
        </div>
        
        <div class="app-container">
            <!-- 主题切换按钮 -->
            <div class="theme-toggle">
                <button @click="toggleTheme" class="theme-toggle-btn" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
                    <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
                </button>
                <a href="/gallery.php" class="btn btn-outline-secondary btn-sm">
                    <i class="fas fa-images me-1"></i> 图库
                </a>
            </div>
            
            <!-- 应用标题 -->
            <div class="app-title">AI 图像生成器</div>
            <div class="app-subtitle">输入中文描述，一键生成精美AI图像，支持多种模型和风格</div>
            
            <div class="row g-4">
                <!-- 左侧参数控制区 -->
                <div class="col-md-5">
                    <!-- 模型类别选择 -->
                    <div class="parameter-section glow-effect">
                        <div class="section-title">
                            <i class="fas fa-layer-group"></i> 选择类别
                        </div>
                        <div class="category-buttons mb-3">
                            <div class="btn-group w-100">
                                <button 
                                    v-for="category in visibleCategories" 
                                    :key="category.id"
                                    @click="changeCategory(category.id)"
                                    :class="[
                                        'btn', 
                                        selectedCategory === category.id ? 'btn-primary' : 'btn-outline-secondary',
                                        'animate__animated',
                                        selectedCategory === category.id ? 'animate__pulse' : ''
                                    ]"
                                    :title="category.description"
                                    class="tooltip"
                                    :data-tooltip="category.description"
                                >
                                    <i :class="category.icon + ' me-1'"></i>
                                    {{ category.name }}
                                </button>
                            </div>
                        </div>
                        
                        <!-- 模型选择 -->
                        <div class="model-selector">
                            <label class="form-label d-flex justify-content-between">
                                <span><i class="fas fa-robot me-1"></i> 选择模型</span>
                                <small class="text-muted">{{ selectedModelDescription }}</small>
                            </label>
                            
                            <transition name="model-fade" mode="out-in">
                                <select 
                                    v-model="selectedModel" 
                                    class="form-select mb-3"
                                    :disabled="isGenerating || isTranslating"
                                    :class="{ 'animate__animated animate__fadeIn': modelChangeAnimation }"
                                    @change="changeModel($event.target.value)"
                                >
                                    <option 
                                        v-for="model in filteredModels" 
                                        :key="model.id" 
                                        :value="model.id"
                                    >
                                        {{ model.name }}
                                    </option>
                                </select>
                            </transition>
                        </div>
                        
                        <!-- 文本输入区 -->
                        <div v-if="selectedCategory === 'text2image' || selectedCategory === 'text2video'">
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-keyboard me-1"></i> 输入中文描述
                                    <small class="text-muted ms-2">(支持直接使用中文)</small>
                                </label>
                                <textarea 
                                    id="promptInput" 
                                    v-model="prompt" 
                                    class="form-control" 
                                    rows="3" 
                                    placeholder="请输入中文描述，描述您想要的图像，例如：一只可爱的小猫在阳光下玩耍" 
                                    :disabled="isGenerating || isTranslating"
                                ></textarea>
                                
                                <div class="d-flex justify-content-between mt-2">
                                    <button 
                                        @click="translatePrompt" 
                                        class="btn btn-info" 
                                        :disabled="!prompt.trim() || isTranslating || isGenerating"
                                    >
                                        <i class="fas fa-language me-1"></i>
                                        <span v-if="isTranslating">翻译中...</span>
                                        <span v-else>翻译</span>
                                    </button>
                                    
                                    <div>
                                        <button 
                                            class="btn btn-outline-secondary me-2" 
                                            @click="prompt = ''" 
                                            :disabled="!prompt.trim() || isTranslating || isGenerating"
                                        >
                                            <i class="fas fa-eraser"></i>
                                        </button>
                                        
                                        <button 
                                            class="btn btn-primary" 
                                            @click="generateImage" 
                                            :disabled="!canGenerate"
                                        >
                                            <i class="fas fa-magic me-1"></i>
                                            <span v-if="isGenerating">生成中...</span>
                                            <span v-else>生成图像</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 翻译结果 -->
                            <div class="mb-3" v-if="translatedPrompt">
                                <label class="form-label"><i class="fas fa-globe-americas me-1"></i> 翻译结果</label>
                                <div id="translationResult" class="form-control">{{ translatedPrompt }}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 模型参数设置 -->
                    <div class="parameter-section glow-effect">
                        <div class="section-title">
                            <i class="fas fa-sliders-h"></i> 参数设置
                        </div>
                        
                        <!-- 不同模型的专用参数 -->
                        <div v-if="selectedCategory === 'text2image'">
                            <!-- 图片尺寸 -->
                            <div class="mb-3">
                                <label class="form-label"><i class="fas fa-crop-alt me-1"></i> 图片尺寸</label>
                                <select 
                                    v-model="imageSize" 
                                    class="form-select" 
                                    :disabled="isGenerating"
                                >
                                    <option value="square">方形 (1:1)</option>
                                    <option value="portrait">竖向 (3:4)</option>
                                    <option value="landscape">横向 (4:3)</option>
                                    <option value="widescreen">宽屏 (16:9)</option>
                                </select>
                            </div>
                            
                            <!-- 迭代步数 -->
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-shoe-prints me-1"></i> 迭代步数
                                    <small class="text-muted ms-2">(步数越高，质量越好，但速度越慢)</small>
                                </label>
                                <div class="d-flex align-items-center">
                                    <input 
                                        type="range" 
                                        class="form-range me-2" 
                                        v-model.number="steps" 
                                        min="10" 
                                        max="50" 
                                        step="1" 
                                        :disabled="isGenerating"
                                    >
                                    <span class="badge bg-primary">{{ steps }}</span>
                                </div>
                            </div>
                            
                            <!-- 引导系数 -->
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-compass me-1"></i> 引导系数
                                    <small class="text-muted ms-2">(越高越符合描述，但创意性降低)</small>
                                </label>
                                <div class="d-flex align-items-center">
                                    <input 
                                        type="range" 
                                        class="form-range me-2" 
                                        v-model.number="guidance" 
                                        min="1" 
                                        max="20" 
                                        step="0.5" 
                                        :disabled="isGenerating"
                                    >
                                    <span class="badge bg-primary">{{ guidance }}</span>
                                </div>
                            </div>
                            
                            <!-- Recraft V3专用参数 -->
                            <div v-if="isRecraftModel" class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-paint-brush me-1"></i> 图像风格
                                </label>
                                <select 
                                    v-model="selectedRecraftStyle" 
                                    class="form-select" 
                                    :disabled="isGenerating"
                                >
                                    <option 
                                        v-for="style in recraftStyles" 
                                        :key="style.value" 
                                        :value="style.value"
                                    >
                                        {{ style.name }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 右侧预览区 -->
                <div class="col-md-7">
                    <!-- 标签页导航 -->
                    <ul class="nav nav-tabs mb-3" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button 
                                @click="activeTab = 'preview'" 
                                :class="['nav-link', activeTab === 'preview' ? 'active' : '']" 
                                type="button"
                            >
                                <i class="fas fa-image me-1"></i> 图像预览
                            </button>
                        </li>
                        <li class="nav-item" role="presentation" v-if="selectedCategory !== 'text2video'">
                            <button 
                                @click="activeTab = 'video'" 
                                :class="['nav-link', activeTab === 'video' ? 'active' : '']" 
                                type="button"
                                :disabled="!currentImageUrl"
                            >
                                <i class="fas fa-film me-1"></i> 转为视频
                            </button>
                        </li>
                        <li class="nav-item" role="presentation" v-if="selectedCategory === 'text2video'">
                            <button 
                                @click="activeTab = 'direct-video'" 
                                :class="['nav-link', activeTab === 'direct-video' ? 'active' : '']" 
                                type="button"
                            >
                                <i class="fas fa-video me-1"></i> 文字生成视频
                            </button>
                        </li>
                    </ul>
                    
                    <!-- 标签页内容 -->
                    <div class="tab-content">
                        <!-- 图像预览 -->
                        <div :class="['tab-pane fade', activeTab === 'preview' ? 'show active' : '']">
                            <div class="image-container position-relative">
                                <!-- 加载遮罩 -->
                                <transition name="fade">
                                    <div class="loading-overlay" v-if="isGenerating">
                                        <div class="loading-content">
                                            <div class="loading-spinner"></div>
                                            <div class="loading-text">AI 创作中...</div>
                                            <div class="progress mt-3" style="width: 200px;">
                                                <div class="progress-bar" :style="{ width: progress + '%' }"></div>
                                            </div>
                                        </div>
                                    </div>
                                </transition>
                                
                                <!-- 图像展示 -->
                                <div v-if="currentImageUrl" class="image-display text-center">
                                    <img :src="currentImageUrl" alt="生成的图像" class="img-fluid generated-image animate__animated animate__fadeIn">
                                    <div class="mt-3 d-flex justify-content-center">
                                        <button @click="saveImage" class="btn btn-success me-2">
                                            <i class="fas fa-download me-1"></i> 保存图像
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- 图像占位符 -->
                                <div v-else class="image-placeholder text-center">
                                    <div>
                                        <i class="fas fa-image fa-5x mb-3 text-secondary"></i>
                                        <p class="text-muted">输入描述并点击"生成图像"按钮生成图片</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 错误提示 -->
                            <div class="alert alert-danger mt-3" v-if="showError">
                                <i class="fas fa-exclamation-triangle me-2"></i> {{ errorMessage }}
                            </div>
                        </div>
                        
                        <!-- 其他标签页内容 -->
                        <!-- ... 原有代码 ... -->
                    </div>
                </div>
            </div>
            
            <!-- 页脚 -->
            <footer class="mt-5 text-center text-muted">
                <p>© <?php echo date('Y'); ?> AI 图像生成器 | 基于先进的人工智能模型构建</p>
                <p class="small">使用先进的 AI 技术，将您的创意变为现实</p>
            </footer>
        </div>
    </div>

    <!-- 主应用脚本 -->
    <script src="static/js/app.js?v=<?php echo time(); ?>"></script>
</body>
</html> 