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
    <meta name="description" content="AI图像库 - 展示所有用户生成的AI图片和视频">
    <meta name="keywords" content="AI, 图像生成, 图库, 视频, 人工智能, fal.ai">
    <title>AI 图库 - 生成作品展示</title>
    <link rel="icon" href="static/img/favicon.ico" type="image/x-icon">
    <!-- 样式表 -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="static/css/style.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="static/css/gallery.css?v=<?php echo time(); ?>">
    <!-- Font Awesome 图标 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- 引入Vue.js -->
    <script src="https://cdn.jsdelivr.net/npm/vue@3.3.4/dist/vue.global.prod.js"></script>
    <!-- 引入axios进行HTTP请求 -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <!-- Masonry布局库 -->
    <script src="https://cdn.jsdelivr.net/npm/masonry-layout@4.2.2/dist/masonry.pkgd.min.js"></script>
    <!-- ImagesLoaded库 -->
    <script src="https://cdn.jsdelivr.net/npm/imagesloaded@5.0.0/imagesloaded.pkgd.min.js"></script>
    <!-- 引入动画库 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
</head>
<body>
    <div id="gallery-app">
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
        
        <div class="gallery-container animate__animated animate__fadeIn">
            <!-- 标题栏 -->
            <div class="gallery-header">
                <div class="gallery-brand">
                    <div class="gallery-logo">AI 图库</div>
                    <div class="gallery-subtitle">探索用户创作的AI图像与视频世界</div>
                </div>
                
                <div class="gallery-actions">
                    <!-- 主题切换按钮 -->
                    <button @click="toggleTheme" class="theme-toggle-btn me-2" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
                        <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
                    </button>
                    
                    <!-- 返回按钮 -->
                    <a @click.prevent="goToHome" href="/" class="back-to-home">
                        <i class="fas fa-arrow-left me-1"></i> 返回生成器
                    </a>
                </div>
            </div>
            
            <!-- 筛选工具栏 -->
            <div class="gallery-toolbar">
                <!-- 媒体类型筛选 -->
                <div class="filter-group">
                    <label class="form-label">媒体类型</label>
                    <div class="btn-group">
                        <button 
                            v-for="type in mediaTypes" 
                            :key="type.id" 
                            @click="changeFilterType(type.id)"
                            :class="['btn', filterType === type.id ? 'btn-primary' : 'btn-outline-secondary']"
                            class="animate__animated"
                            :class="{'animate__pulse': filterType === type.id}"
                        >
                            <i :class="type.icon + ' me-1'"></i> {{ type.name }}
                        </button>
                    </div>
                </div>
                
                <!-- 模型筛选 -->
                <div class="filter-group">
                    <label class="form-label">模型筛选</label>
                    <select 
                        v-model="filterModel" 
                        @change="changeFilterModel(filterModel)" 
                        class="form-select"
                    >
                        <option 
                            v-for="model in models" 
                            :key="model.id" 
                            :value="model.id"
                        >
                            {{ model.name }}
                        </option>
                    </select>
                </div>
            </div>
            
            <!-- 加载状态 -->
            <div class="loading-container" v-if="isLoading">
                <div class="loading-spinner"></div>
            </div>
            
            <!-- 错误提示 -->
            <div class="alert alert-danger" v-if="loadError">
                <i class="fas fa-exclamation-triangle me-2"></i> {{ loadError }}
            </div>
            
            <!-- 瀑布流布局 -->
            <div class="masonry-grid" v-if="!isLoading && !loadError && filteredItems.length > 0">
                <div v-for="item in filteredItems" :key="item.id" class="gallery-item animate__animated animate__fadeIn">
                    <div class="gallery-item-inner">
                        <!-- 视频标识 -->
                        <div class="video-badge" v-if="item.type === 'video'">
                            <i class="fas fa-film me-1"></i> 视频
                        </div>
                        
                        <!-- 图片或视频 -->
                        <img 
                            v-if="item.type === 'image'" 
                            :src="item.url" 
                            :alt="item.prompt" 
                            class="gallery-media"
                            loading="lazy"
                            @error="e => e.target.src = 'static/img/placeholder.png'"
                        >
                        
                        <video 
                            v-else-if="item.type === 'video'" 
                            :src="item.url" 
                            class="gallery-media" 
                            autoplay 
                            muted 
                            loop
                            @error="e => e.target.style.display = 'none'"
                        ></video>
                        
                        <!-- 提示文本 -->
                        <div class="gallery-prompt">{{ item.prompt }}</div>
                    </div>
                </div>
            </div>
            
            <!-- 无内容提示 -->
            <div class="no-items-message" v-if="!isLoading && !loadError && filteredItems.length === 0">
                <i class="fas fa-image"></i>
                <p>暂无符合条件的作品</p>
                <p v-if="filterType !== 'all' || filterModel !== 'all'">
                    尝试调整筛选条件或
                    <a href="#" @click.prevent="resetFilters" class="text-primary">清除筛选</a>
                </p>
            </div>
            
            <!-- 分页控制 -->
            <div class="pagination-controls" v-if="!isLoading && !loadError && totalPages > 1">
                <button 
                    @click="goPrevious" 
                    class="pagination-button" 
                    :disabled="!canGoPrevious"
                >
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div class="page-indicator">
                    第 {{ currentPage }} 页 / 共 {{ totalPages }} 页
                </div>
                
                <button 
                    @click="goNext" 
                    class="pagination-button" 
                    :disabled="!canGoNext"
                >
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <!-- 页脚 -->
            <footer class="mt-5 text-center text-muted">
                <p>© <?php echo date('Y'); ?> AI 图库 | 基于先进的人工智能模型构建的图像分享平台</p>
                <p class="small">探索无限创意和想象力</p>
            </footer>
        </div>
    </div>

    <!-- 图库应用脚本 -->
    <script src="static/js/gallery.js?v=<?php echo time(); ?>"></script>
</body>
</html> 