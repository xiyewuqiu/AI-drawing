// 创建Vue应用
const app = Vue.createApp({
    data() {
        return {
            // 媒体项目
            items: [],
            filteredItems: [],
            
            // 筛选参数
            filterType: 'all', // all, image, video
            filterModel: 'all',
            
            // 加载状态
            isLoading: true,
            loadError: null,
            
            // 分页控制
            currentPage: 1,
            pageSize: 40,
            totalItems: 0,
            totalPages: 0,
            
            // 主题设置
            isDarkMode: true,
            
            // 模型列表
            models: [
                { id: 'all', name: '所有模型' },
                { id: 'fal-ai/recraft-v3', name: 'Recraft V3' },
                { id: 'fal-ai/hidream-i1-full', name: 'HiDream I1 Full' },
                { id: 'fal-ai/minimax-image', name: 'MiniMax (Hailuo AI)' },
                { id: 'fal-ai/lumina-image/v2', name: 'Lumina Image 2' },
                { id: 'fal-ai/sana/v1.5/4.8b', name: 'Sana 4.8B' },
                { id: 'fal-ai/flux/dev', name: 'Flux.1 [dev]' },
                { id: 'fal-ai/flux-pro/v1.1-ultra', name: 'Flux Pro Ultra' },
                { id: 'fal-ai/flux-pro/v1.1-ultra-finetuned', name: 'Flux Pro Ultra微调版' },
                { id: 'step-video', name: 'Step-Video' }
            ],
            
            // 媒体类型选项
            mediaTypes: [
                { id: 'all', name: '所有作品', icon: 'fas fa-th-large' },
                { id: 'image', name: '仅图片', icon: 'fas fa-image' },
                { id: 'video', name: '仅视频', icon: 'fas fa-video' }
            ],
            
            // 瀑布流设置
            masonry: null,
            
            // 通知系统
            notifications: [],
            notificationId: 0
        };
    },
    computed: {
        // 检查是否可以前往前一页
        canGoPrevious() {
            return this.currentPage > 1;
        },
        
        // 检查是否可以前往后一页
        canGoNext() {
            return this.currentPage < this.totalPages;
        }
    },
    methods: {
        // 初始化瀑布流布局
        initMasonry() {
            this.$nextTick(() => {
                const grid = document.querySelector('.masonry-grid');
                if (grid) {
                    // 确保所有图片加载完成后初始化Masonry
                    imagesLoaded(grid, () => {
                        this.masonry = new Masonry(grid, {
                            itemSelector: '.gallery-item',
                            columnWidth: '.gallery-item',
                            percentPosition: true,
                            transitionDuration: '0.3s'
                        });
                    });
                }
            });
        },
        
        // 重新布局瀑布流
        relayoutMasonry() {
            this.$nextTick(() => {
                if (this.masonry) {
                    imagesLoaded(document.querySelector('.masonry-grid'), () => {
                        this.masonry.layout();
                    });
                } else {
                    this.initMasonry();
                }
            });
        },
        
        // 加载所有历史记录
        async loadAllHistory() {
            this.isLoading = true;
            this.loadError = null;
            
            try {
                const response = await axios.get(`/api/get_all_history.php?page=${this.currentPage}&page_size=${this.pageSize}`);
                
                if (response.data && response.data.items) {
                    this.items = response.data.items;
                    this.totalItems = response.data.pagination.total_items;
                    this.totalPages = response.data.pagination.total_pages;
                    
                    // 应用过滤器
                    this.applyFilters();
                    
                    // 显示成功通知
                    if (this.items.length > 0) {
                        this.addNotification(`已加载 ${this.items.length} 个作品`, 'success');
                    }
                } else {
                    this.loadError = '加载历史记录时出错：数据格式不正确';
                    this.addNotification('加载数据格式有误', 'error');
                }
            } catch (error) {
                this.loadError = `加载历史记录时出错：${error.message || '未知错误'}`;
                console.error('加载历史记录错误:', error);
                this.addNotification('加载数据失败', 'error');
            } finally {
                this.isLoading = false;
            }
        },
        
        // 应用过滤器
        applyFilters() {
            let filtered = [...this.items];
            
            // 按类型过滤
            if (this.filterType !== 'all') {
                filtered = filtered.filter(item => item.type === this.filterType);
            }
            
            // 按模型过滤
            if (this.filterModel !== 'all') {
                filtered = filtered.filter(item => item.model_id === this.filterModel);
            }
            
            this.filteredItems = filtered;
            
            // 重新布局瀑布流
            this.relayoutMasonry();
            
            // 显示过滤结果
            if (this.filterType !== 'all' || this.filterModel !== 'all') {
                const typeText = this.filterType !== 'all' ? 
                    this.mediaTypes.find(t => t.id === this.filterType)?.name : '所有类型';
                    
                const modelText = this.filterModel !== 'all' ? 
                    this.getModelName(this.filterModel) : '所有模型';
                    
                this.addNotification(`显示${typeText}中的${modelText}作品`, 'info');
            }
        },
        
        // 重置过滤器
        resetFilters() {
            this.filterType = 'all';
            this.filterModel = 'all';
            this.applyFilters();
            this.addNotification('已重置所有筛选条件', 'info');
        },
        
        // 切换页面
        changePage(page) {
            if (page < 1 || page > this.totalPages) return;
            
            this.currentPage = page;
            this.loadAllHistory();
            
            // 滚动到顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },
        
        // 转到前一页
        goPrevious() {
            if (this.canGoPrevious) {
                this.changePage(this.currentPage - 1);
                this.addNotification(`前往第 ${this.currentPage} 页`, 'info');
            }
        },
        
        // 转到后一页
        goNext() {
            if (this.canGoNext) {
                this.changePage(this.currentPage + 1);
                this.addNotification(`前往第 ${this.currentPage} 页`, 'info');
            }
        },
        
        // 切换过滤类型
        changeFilterType(type) {
            if (this.filterType === type) return;
            this.filterType = type;
            this.applyFilters();
        },
        
        // 切换过滤模型
        changeFilterModel(model) {
            if (this.filterModel === model) return;
            this.filterModel = model;
            this.applyFilters();
        },
        
        // 获取模型名称
        getModelName(modelId) {
            const model = this.models.find(m => m.id === modelId);
            return model ? model.name : "未知模型";
        },
        
        // 切换主题
        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('light-mode', !this.isDarkMode);
            
            // 保存主题偏好
            try {
                localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
            } catch (e) {
                console.error('无法保存主题偏好:', e);
            }
            
            // 添加通知
            this.addNotification(`已切换到${this.isDarkMode ? '深色' : '浅色'}模式`, 'info');
        },
        
        // 跳转到图片生成页面
        goToHome() {
            window.location.href = '/';
        },
        
        // 加载初始设置
        loadInitialSettings() {
            // 加载主题偏好
            try {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme) {
                    this.isDarkMode = savedTheme === 'dark';
                    document.body.classList.toggle('light-mode', !this.isDarkMode);
                }
            } catch (e) {
                console.error('无法加载主题偏好:', e);
            }
        },
        
        // 添加通知
        addNotification(message, type = 'info') {
            const id = this.notificationId++;
            this.notifications.push({
                id,
                message,
                type,
                show: true
            });
            
            // 3秒后自动关闭
            setTimeout(() => {
                const index = this.notifications.findIndex(n => n.id === id);
                if (index !== -1) {
                    this.notifications[index].show = false;
                    // 动画结束后移除
                    setTimeout(() => {
                        this.notifications = this.notifications.filter(n => n.id !== id);
                    }, 500);
                }
            }, 3000);
        },
        
        // 关闭通知
        closeNotification(id) {
            const index = this.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
                this.notifications[index].show = false;
                // 动画结束后移除
                setTimeout(() => {
                    this.notifications = this.notifications.filter(n => n.id !== id);
                }, 500);
            }
        }
    },
    mounted() {
        // 加载初始设置
        this.loadInitialSettings();
        
        // 加载历史记录
        this.loadAllHistory();
        
        // 添加欢迎通知
        setTimeout(() => {
            this.addNotification('欢迎来到AI图库，探索AI创作的精彩世界', 'success');
        }, 1000);
    },
    template: `
    <div class="gallery-container">
        <!-- 标题栏 -->
        <div class="gallery-header">
            <div class="gallery-brand">
                <div class="gallery-logo">AI 图库</div>
                <div class="gallery-subtitle">所有用户生成的AI图片与视频</div>
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
                <label class="form-label">媒体类型:</label>
                <div class="btn-group">
                    <button 
                        v-for="type in mediaTypes" 
                        :key="type.id"
                        @click="changeFilterType(type.id)"
                        class="btn"
                        :class="filterType === type.id ? 'btn-primary' : 'btn-outline-secondary'">
                        <i :class="type.icon + ' me-1'"></i> {{ type.name }}
                    </button>
                </div>
            </div>
            
            <!-- 模型筛选 -->
            <div class="filter-group">
                <label for="modelFilter" class="form-label">模型筛选:</label>
                <select id="modelFilter" class="form-select" v-model="filterModel" @change="applyFilters()">
                    <option v-for="model in models" :key="model.id" :value="model.id">
                        {{ model.name }}
                    </option>
                </select>
            </div>
        </div>
        
        <!-- 加载指示器 -->
        <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
        </div>
        
        <!-- 错误消息 -->
        <div v-else-if="loadError" class="alert alert-danger">
            {{ loadError }}
        </div>
        
        <!-- 无内容提示 -->
        <div v-else-if="filteredItems.length === 0" class="no-items-message">
            <i class="fas fa-search me-2"></i> 未找到符合条件的内容
        </div>
        
        <!-- 图库网格 -->
        <div v-else class="masonry-grid">
            <!-- 图片/视频卡片 -->
            <div v-for="(item, index) in filteredItems" :key="index" class="gallery-item">
                <div class="gallery-item-inner">
                    <!-- 视频标识 -->
                    <div v-if="item.type === 'video'" class="video-badge">
                        <i class="fas fa-film me-1"></i> 视频
                    </div>
                    
                    <!-- 图片内容 -->
                    <img 
                        v-if="item.type === 'image'" 
                        :src="item.image_url" 
                        class="gallery-media" 
                        :alt="item.prompt"
                        loading="lazy" />
                    
                    <!-- 视频内容 -->
                    <video 
                        v-else-if="item.type === 'video'" 
                        :src="item.video_url" 
                        class="gallery-media" 
                        controls 
                        muted 
                        loop 
                        preload="metadata">
                        您的浏览器不支持视频播放
                    </video>
                    
                    <!-- 提示词显示 -->
                    <div class="gallery-prompt">
                        <div v-if="item.model_id" class="badge bg-secondary mb-1">{{ getModelName(item.model_id) }}</div>
                        <p>{{ item.prompt }}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 分页控制 -->
        <div v-if="!isLoading && totalPages > 1" class="pagination-controls">
            <button 
                @click="goPrevious" 
                class="pagination-button" 
                :disabled="!canGoPrevious"
                title="上一页">
                <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="page-indicator">
                <span>{{ currentPage }} / {{ totalPages }}</span>
            </div>
            
            <button 
                @click="goNext" 
                class="pagination-button" 
                :disabled="!canGoNext"
                title="下一页">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    </div>
    `
});

// 挂载应用
app.mount('#gallery-app'); 