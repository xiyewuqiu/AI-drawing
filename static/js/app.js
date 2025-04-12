// 图像生成模型列表
const FAL_AI_MODELS = [
    {
        "id": "fal-ai/recraft-v3",
        "name": "Recraft V3 (超高质量)",
        "description": "最新的Recraft V3模型，提供超高质量的图像生成，支持矢量风格"
    },
    {
        "id": "fal-ai/sana/v1.5/4.8b",
        "name": "Sana 4.8B (4K高清)",
        "description": "强大的4K图像生成模型，细节丰富，适合需要高质量大图的场景"
    },
    {
        "id": "fal-ai/flux-pro/v1.1-ultra",
        "name": "Flux Pro Ultra (高质量)",
        "description": "Flux Pro Ultra模型，提供高质量图像生成"
    }
];

// Recraft V3模型风格列表
const RECRAFT_STYLES = [
    { value: "realistic_image", name: "写实风格 (逼真照片)" },
    { value: "digital_illustration", name: "数字插画风格" },
    { value: "vector_illustration", name: "矢量图风格" }
];

// 创建Vue应用
const app = Vue.createApp({
    data() {
        return {
            // 用户输入
            prompt: "",
            translatedPrompt: "",
            
            // 模型和参数
            models: FAL_AI_MODELS,
            selectedModel: "fal-ai/recraft-v3",
            imageSize: "square",
            steps: 20,
            guidance: 7,
            
            // Recraft V3专用参数
            recraftStyles: RECRAFT_STYLES,
            selectedRecraftStyle: "realistic_image",
            
            // 状态控制
            isGenerating: false,
            isTranslating: false,
            isConvertingToVideo: false,
            isGeneratingDirectVideo: false,
            progress: 0,
            
            // 图像和视频结果
            currentImageUrl: null,
            currentImageData: null,
            currentVideoUrl: null,
            
            // 视频动画控制
            videoPrompt: "",
            videoAspectRatio: "auto",
            videoDuration: "5s",
            
            // Step-Video 直接文本到视频参数
            directVideoPrompt: "",
            directVideoSteps: 30,
            directVideoUrl: null,
            
            // 历史记录
            history: [],
            
            // 界面控制
            activeTab: 'preview',
            
            // 显示错误信息
            errorMessage: "",
            showError: false
        };
    },
    computed: {
        // 返回当前选中的模型对象
        currentModel() {
            return this.models.find(model => model.id === this.selectedModel);
        },
        // 判断是否可以生成图像
        canGenerate() {
            return (this.prompt.trim() || this.translatedPrompt.trim()) && !this.isGenerating;
        },
        // 判断是否有中文字符
        hasChinese() {
            for (let char of this.prompt) {
                if (/[\u4e00-\u9fff]/.test(char)) {
                    return true;
                }
            }
            return false;
        },
        // 判断是否为Recraft V3模型
        isRecraftModel() {
            return this.selectedModel === "fal-ai/recraft-v3";
        },
        // 当前是否选择了Sana 4.8B模型
        isSanaModel() {
            return this.selectedModel === 'fal-ai/sana/v1.5/4.8b';
        },
        // 返回当前选中的模型描述
        selectedModelDescription() {
            const model = this.models.find(m => m.id === this.selectedModel);
            return model ? model.description : "未选择模型";
        }
    },
    methods: {
        // 翻译提示词
        async translatePrompt() {
            if (!this.prompt.trim()) return;
            
            this.isTranslating = true;
            this.errorMessage = "";
            
            try {
                const response = await axios.post('/api/translate.php', {
                    text: this.prompt,
                    from_lang: 'zh-CHS',
                    to_lang: 'en'
                });
                
                if (response.data && response.data.translation) {
                    this.translatedPrompt = response.data.translation;
                    
                    // 记录翻译统计
                    this.logStatistics('translate');
                } else {
                    throw new Error(response.data.error || '翻译失败');
                }
            } catch (error) {
                this.errorMessage = `AI翻译错误: ${error.message}`;
                this.showError = true;
                setTimeout(() => {
                    this.showError = false;
                }, 5000);
            } finally {
                this.isTranslating = false;
            }
        },
        
        // 生成图像
        async generateImage() {
            if (!this.canGenerate) return;
            
            this.isGenerating = true;
            this.progress = 10;
            this.errorMessage = "";
            
            // 确定使用哪个提示词：如果有翻译结果就用翻译结果，否则用原始提示词
            const promptToUse = this.translatedPrompt || this.prompt;
            
            try {
                // 准备请求参数
                const params = {
                    model_id: this.selectedModel,
                    prompt: promptToUse,
                    image_size: this.imageSize,
                    steps: this.steps,
                    guidance: this.guidance
                };
                
                // 如果是Recraft V3模型，添加风格参数
                if (this.isRecraftModel) {
                    params.style = this.selectedRecraftStyle;
                }
                
                // 发送请求到后端API
                this.progress = 30;
                const response = await axios.post('/api/generate_image.php', params);
                
                if (response.data && response.data.success) {
                    this.progress = 90;
                    this.currentImageUrl = response.data.image_url;
                    this.currentVideoUrl = null; // 清除之前的视频URL
                    
                    // 添加到历史记录
                    this.addToHistory({
                        prompt: this.prompt,
                        translatedPrompt: this.translatedPrompt,
                        imageUrl: response.data.image_url,
                        timestamp: new Date().toLocaleString(),
                        model: this.selectedModel,
                        style: this.isRecraftModel ? this.selectedRecraftStyle : null
                    });
                    
                    // 记录生成统计
                    this.logStatistics('generate', this.selectedModel);
                    
                    // 切换到预览选项卡
                    this.activeTab = 'preview';
                } else {
                    throw new Error(response.data.error || '生成图像失败');
                }
            } catch (error) {
                this.errorMessage = `生成图像错误: ${error.message}`;
                this.showError = true;
                setTimeout(() => {
                    this.showError = false;
                }, 5000);
            } finally {
                this.progress = 100;
                setTimeout(() => {
                    this.isGenerating = false;
                    this.progress = 0;
                }, 500);
            }
        },
        
        // 图像转视频
        async convertToVideo() {
            if (!this.currentImageUrl || this.isConvertingToVideo) return;
            
            // 检查视频提示词是否为空
            if (!this.videoPrompt.trim()) {
                this.errorMessage = "请先输入视频动画提示词";
                this.showError = true;
                setTimeout(() => {
                    this.showError = false;
                }, 5000);
                return;
            }
            
            this.isConvertingToVideo = true;
            this.progress = 10;
            this.errorMessage = "";
            
            try {
                // 准备请求参数
                const params = {
                    image_url: this.currentImageUrl,
                    prompt: this.videoPrompt,
                    aspect_ratio: this.videoAspectRatio,
                    duration: this.videoDuration
                };
                
                // 发送请求到后端API
                this.progress = 30;
                const response = await axios.post('/api/generate_video.php', params);
                
                if (response.data && response.data.success) {
                    this.progress = 90;
                    this.currentVideoUrl = response.data.video_url;
                    
                    // 记录视频生成统计
                    this.logStatistics('generate_video');
                    
                } else {
                    throw new Error(response.data.error || '生成视频失败');
                }
            } catch (error) {
                this.errorMessage = `生成视频错误: ${error.message}`;
                this.showError = true;
                setTimeout(() => {
                    this.showError = false;
                }, 5000);
            } finally {
                this.progress = 100;
                setTimeout(() => {
                    this.isConvertingToVideo = false;
                    this.progress = 0;
                }, 500);
            }
        },
        
        // 直接从文本生成视频
        async generateDirectVideo() {
            if (!this.directVideoPrompt.trim() || this.isGeneratingDirectVideo) return;
            
            this.isGeneratingDirectVideo = true;
            this.progress = 10;
            this.errorMessage = "";
            this.directVideoUrl = null;
            
            try {
                // 将可能的中文提示词翻译为英文
                let promptToUse = this.directVideoPrompt;
                
                // 检测是否包含中文
                if (/[\u4e00-\u9fa5]/.test(this.directVideoPrompt)) {
                    this.progress = 20;
                    try {
                        const translateResponse = await axios.post('/api/translate.php', {
                            text: this.directVideoPrompt,
                            from_lang: 'zh',
                            to_lang: 'en'
                        });
                        
                        if (translateResponse.data && translateResponse.data.translation) {
                            promptToUse = translateResponse.data.translation;
                        }
                    } catch (translateError) {
                        console.error("翻译失败，使用原始提示词", translateError);
                    }
                }
                
                // 准备请求参数
                const params = {
                    prompt: promptToUse,
                    num_inference_steps: this.directVideoSteps
                };
                
                // 发送请求到后端API
                this.progress = 30;
                const response = await axios.post('/api/generate_text_video.php', params);
                
                if (response.data && response.data.success) {
                    this.progress = 90;
                    this.directVideoUrl = response.data.video_url;
                    
                    // 添加到历史记录
                    this.addToHistory({
                        prompt: this.directVideoPrompt,
                        translatedPrompt: promptToUse !== this.directVideoPrompt ? promptToUse : null,
                        videoUrl: response.data.video_url,
                        timestamp: new Date().toLocaleString(),
                        type: 'direct_video'
                    });
                    
                    // 记录生成统计
                    this.logStatistics('generate_direct_video');
                    
                } else {
                    throw new Error(response.data.error || '生成视频失败');
                }
            } catch (error) {
                this.errorMessage = `生成视频错误: ${error.message}`;
                this.showError = true;
                setTimeout(() => {
                    this.showError = false;
                }, 5000);
            } finally {
                this.progress = 100;
                setTimeout(() => {
                    this.isGeneratingDirectVideo = false;
                    this.progress = 0;
                }, 500);
            }
        },
        
        // 保存直接生成的视频到本地
        saveDirectVideo() {
            if (!this.directVideoUrl) return;
            
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = this.directVideoUrl;
            
            // 设置文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `AI_DirectVideo_${timestamp}.mp4`;
            
            // 模拟点击下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 记录下载统计
            this.logStatistics('download_direct_video');
        },
        
        // 添加到历史记录
        addToHistory(item) {
            this.history.unshift(item);
            
            // 保存到本地存储
            try {
                localStorage.setItem('imageGeneratorHistory', JSON.stringify(this.history.slice(0, 50)));
            } catch (e) {
                console.error('无法保存到本地存储:', e);
            }
        },
        
        // 从历史记录加载
        loadFromHistory(item) {
            if (item.type === 'direct_video') {
                // 如果是文本到视频的记录
                this.directVideoPrompt = item.prompt;
                this.directVideoUrl = item.videoUrl;
                this.activeTab = 'text2video';
            } else {
                // 图像生成记录
                this.prompt = item.prompt;
                this.translatedPrompt = item.translatedPrompt || '';
                this.currentImageUrl = item.imageUrl;
                this.currentVideoUrl = null;
                
                if (item.model) {
                    this.selectedModel = item.model;
                }
                
                if (item.style) {
                    this.selectedRecraftStyle = item.style;
                }
                
                this.activeTab = 'preview';
            }
        },
        
        // 保存图像到本地
        saveImage() {
            if (!this.currentImageUrl) return;
            
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = this.currentImageUrl;
            
            // 设置文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `AI_Image_${timestamp}.png`;
            
            // 模拟点击下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 记录下载统计
            this.logStatistics('download');
        },
        
        // 保存视频到本地
        saveVideo() {
            if (!this.currentVideoUrl) return;
            
            // 创建一个临时链接
            const link = document.createElement('a');
            link.href = this.currentVideoUrl;
            
            // 设置文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `AI_Video_${timestamp}.mp4`;
            
            // 模拟点击下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // 记录下载统计
            this.logStatistics('download_video');
        },
        
        // 加载保存的历史记录
        loadHistory() {
            try {
                const savedHistory = localStorage.getItem('imageGeneratorHistory');
                if (savedHistory) {
                    this.history = JSON.parse(savedHistory);
                }
            } catch (e) {
                console.error('无法加载历史记录:', e);
            }
        },
        
        // 记录使用统计
        async logStatistics(action, model_id = '') {
            try {
                await axios.post('/api/statistics.php', {
                    action,
                    model_id
                });
            } catch (e) {
                console.error('记录统计失败:', e);
            }
        },
        
        // 获取模型名称
        getModelName(model_id) {
            const model = this.models.find(m => m.id === model_id);
            return model ? model.name : "未知模型";
        }
    },
    mounted() {
        // 加载历史记录
        this.loadHistory();
        
        // 记录页面访问统计
        this.logStatistics('visit');
    },
    template: `
    <div class="app-container">
        <!-- 标题 -->
        <div class="text-center mb-4">
            <h1 class="app-title">AI 图像生成器</h1>
            <p class="app-subtitle">输入中文，AI自动翻译并生成精美图像</p>
        </div>
        
        <!-- 错误提示 -->
        <div class="alert alert-danger alert-dismissible fade show" v-if="showError">
            <strong>错误:</strong> {{ errorMessage }}
            <button type="button" class="btn-close" @click="showError = false"></button>
        </div>
        
        <!-- 主容器 -->
        <div class="row g-4">
            <!-- 左侧：输入和控制 -->
            <div class="col-md-5">
                <div class="card mb-3">
                    <div class="card-body">
                        <!-- 提示词输入 -->
                        <div class="mb-3">
                            <label for="promptInput" class="form-label">
                                <i class="fas fa-pencil-alt me-1"></i> 请输入图像描述:
                            </label>
                            <textarea 
                                id="promptInput" 
                                class="form-control" 
                                rows="4" 
                                placeholder="输入中文或英文描述..."
                                v-model="prompt"
                                :disabled="isGenerating">
                            </textarea>
                        </div>
                        
                        <!-- 翻译结果 -->
                        <div class="mb-3">
                            <label for="translationResult" class="form-label">
                                <i class="fas fa-language me-1"></i> AI翻译结果 (将用于生成图像):
                            </label>
                            <textarea 
                                id="translationResult" 
                                class="form-control" 
                                style="color: #66ffaa; font-family: Consolas, '微软雅黑'; font-size: 15px; background-color: rgba(0, 0, 0, 0.2);"
                                rows="4" 
                                v-model="translatedPrompt"
                                readonly>
                            </textarea>
                        </div>
                        
                        <!-- 参数面板 -->
                        <div class="card mb-3 parameter-card">
                            <div class="card-header">
                                <div class="d-flex align-items-center">
                                    <span><i class="fas fa-sliders-h me-1"></i> 生成参数</span>
                                    <span class="ms-auto model-info" title="不同模型各有特点:&#10;• Recraft V3 - 最高质量图像和矢量支持&#10;• Sana 4.8B - 超高清4K图像生成&#10;• Flux Pro Ultra - 最佳图像质量"><i class="fas fa-info-circle"></i></span>
                                </div>
                            </div>
                            <div class="card-body">
                                <!-- 选择模型 -->
                                <div class="mb-3">
                                    <label for="modelSelect" class="form-label">
                                        <i class="fas fa-robot me-1"></i> 模型选择:
                                    </label>
                                    <select id="modelSelect" class="form-select" v-model="selectedModel">
                                        <option v-for="model in models" :key="model.id" :value="model.id">
                                            {{ model.name }}
                                        </option>
                                    </select>
                                    <small class="text-muted d-block mt-2">{{ selectedModelDescription }}</small>
                                </div>
                                
                                <!-- 图像尺寸 -->
                                <div class="mb-3">
                                    <label for="imageSizeSelect" class="form-label">
                                        <i class="fas fa-expand me-1"></i> 图像尺寸:
                                        <span v-if="isSanaModel" class="badge bg-info ms-1">4K</span>
                                    </label>
                                    <select id="imageSizeSelect" class="form-select" v-model="imageSize">
                                        <option value="square">正方形</option>
                                        <option value="portrait">竖向</option>
                                        <option value="landscape">横向</option>
                                    </select>
                                </div>
                                
                                <!-- Recraft V3特殊参数 -->
                                <div class="mb-3" v-if="isRecraftModel">
                                    <label for="recraftStyleSelect" class="form-label">
                                        <i class="fas fa-paint-brush me-1"></i> 风格选择:
                                    </label>
                                    <select id="recraftStyleSelect" class="form-select" v-model="selectedRecraftStyle">
                                        <option value="realistic_image">写实风格 (逼真照片)</option>
                                        <option value="digital_illustration">数字插画风格</option>
                                        <option value="vector_illustration">矢量图风格</option>
                                    </select>
                                </div>
                                
                                <!-- 一般参数 -->
                                <div v-if="!isRecraftModel && !isSanaModel">
                                    <div class="mb-3">
                                        <label for="stepsSlider" class="form-label">
                                            <i class="fas fa-step-forward me-1"></i> 生成步数: <span class="badge bg-primary">{{ steps }}</span>
                                        </label>
                                        <input type="range" class="form-range" id="stepsSlider" min="10" max="50" v-model.number="steps">
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="guidanceSlider" class="form-label">
                                            <i class="fas fa-magic me-1"></i> 引导强度: <span class="badge bg-primary">{{ guidance }}</span>
                                        </label>
                                        <input type="range" class="form-range" id="guidanceSlider" min="1" max="20" v-model.number="guidance">
                                    </div>
                                </div>
                                
                                <!-- Sana模型特有参数 -->
                                <div v-if="isSanaModel">
                                    <div class="mb-3">
                                        <label for="sanaStepsSlider" class="form-label">
                                            <i class="fas fa-step-forward me-1"></i> 生成步数: <span class="badge bg-primary">{{ steps }}</span>
                                        </label>
                                        <input type="range" class="form-range" id="sanaStepsSlider" min="10" max="30" v-model.number="steps">
                                        <small class="text-muted">Sana模型建议步数10-30</small>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="sanaGuidanceSlider" class="form-label">
                                            <i class="fas fa-magic me-1"></i> 引导强度: <span class="badge bg-primary">{{ guidance }}</span>
                                        </label>
                                        <input type="range" class="form-range" id="sanaGuidanceSlider" min="1" max="10" v-model.number="guidance">
                                        <small class="text-muted">推荐值5-7</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 进度条 -->
                        <div v-if="isGenerating || progress > 0" class="mb-3">
                            <div class="progress" style="height: 30px;">
                                <div 
                                    class="progress-bar progress-bar-striped progress-bar-animated" 
                                    role="progressbar" 
                                    :style="{ width: progress + '%' }" 
                                    :aria-valuenow="progress" 
                                    aria-valuemin="0" 
                                    aria-valuemax="100">
                                    <i class="fas fa-spinner fa-spin me-1"></i> {{ progress }}%
                                </div>
                            </div>
                        </div>
                        
                        <!-- 按钮组 -->
                        <div class="d-flex gap-2 mb-3">
                            <button 
                                class="btn btn-primary flex-grow-1" 
                                @click="translatePrompt" 
                                :disabled="!prompt.trim() || isTranslating || isGenerating">
                                <i class="fas fa-language me-1"></i> {{ isTranslating ? '翻译中...' : '点击翻译' }}
                            </button>
                            <button 
                                class="btn btn-success flex-grow-1" 
                                @click="generateImage" 
                                :disabled="!canGenerate">
                                <i class="fas fa-magic me-1"></i> {{ isGenerating ? '生成中...' : '生成图像' }}
                            </button>
                        </div>
                        
                        <!-- 保存按钮 -->
                        <button 
                            class="btn btn-warning w-100" 
                            @click="saveImage" 
                            :disabled="!currentImageUrl">
                            <i class="fas fa-download me-1"></i> 保存图像到本地
                        </button>
                        
                        <!-- 提示信息 -->
                        <div class="alert alert-info mt-3" role="alert">
                            <small><i class="fas fa-info-circle me-1"></i> 提示: 输入中文后点击"点击翻译"按钮进行翻译，或直接用英文描述生成图像</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 右侧：图像显示和历史记录 -->
            <div class="col-md-7">
                <!-- 标签页 -->
                <div class="card mb-3">
                    <div class="card-header">
                        <ul class="nav nav-tabs card-header-tabs">
                            <li class="nav-item">
                                <a class="nav-link" :class="{ active: activeTab === 'input' }" href="#" @click.prevent="activeTab = 'input'">
                                    <i class="fas fa-keyboard me-1"></i> 提示词输入
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" :class="{ active: activeTab === 'preview' }" href="#" @click.prevent="activeTab = 'preview'">
                                    <i class="fas fa-image me-1"></i> 图像预览
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" :class="{ active: activeTab === 'history' }" href="#" @click.prevent="activeTab = 'history'">
                                    <i class="fas fa-history me-1"></i> 历史记录
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" :class="{ active: activeTab === 'text2video' }" href="#" @click.prevent="activeTab = 'text2video'">
                                    <i class="fas fa-film me-1"></i> 文本到视频
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <!-- 预览标签页内容 -->
                <div v-show="activeTab === 'preview'" class="tab-content">
                    <div class="card">
                        <div class="card-header text-center">
                            <i class="fas fa-image me-1"></i> 生成的图像
                        </div>
                        <div class="card-body">
                            <div class="image-container">
                                <div v-if="!currentImageUrl && !isGenerating" class="image-placeholder">
                                    <i class="fas fa-cloud-upload-alt fa-4x mb-3"></i>
                                    <p>还没有生成图像</p>
                                </div>
                                <div v-else-if="isGenerating" class="image-placeholder">
                                    <i class="fas fa-spinner fa-spin fa-3x mb-3"></i>
                                    <p>正在使用{{ currentModel.name.split(" ")[0] }}模型生成图像，请稍候...</p>
                                </div>
                                <div v-else class="image-display">
                                    <img v-if="!currentVideoUrl" :src="currentImageUrl" alt="AI生成的图像" class="generated-image">
                                    <video v-else controls class="generated-video">
                                        <source :src="currentVideoUrl" type="video/mp4">
                                        您的浏览器不支持视频播放
                                    </video>
                                </div>
                            </div>
                            
                            <!-- 图像转视频控制面板 -->
                            <div v-if="currentImageUrl && !isGenerating" class="card mt-4 video-control-card">
                                <div class="card-header bg-info text-white">
                                    <div class="d-flex align-items-center">
                                        <span><i class="fas fa-film me-1"></i> 图像转视频 (Veo 2)</span>
                                        <span class="ms-auto" title="将静态图像转换为动态视频"><i class="fas fa-info-circle"></i></span>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <!-- 视频动画提示词 -->
                                    <div class="mb-3">
                                        <label for="videoPromptInput" class="form-label">
                                            <i class="fas fa-comment-alt me-1"></i> 视频动画提示词:
                                        </label>
                                        <input 
                                            type="text" 
                                            id="videoPromptInput" 
                                            class="form-control" 
                                            placeholder="描述图像应该如何动起来..." 
                                            v-model="videoPrompt"
                                            :disabled="isConvertingToVideo">
                                        <small class="text-muted">例如: "相机缓慢缩放", "轻微摇晃", "风吹动头发" 等</small>
                                    </div>
                                    
                                    <!-- 视频参数 -->
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="aspectRatioSelect" class="form-label">
                                                <i class="fas fa-desktop me-1"></i> 视频比例:
                                            </label>
                                            <select id="aspectRatioSelect" class="form-select" v-model="videoAspectRatio" :disabled="isConvertingToVideo">
                                                <option value="auto">自动</option>
                                                <option value="auto_prefer_portrait">自动(偏向竖屏)</option>
                                                <option value="16:9">16:9 横屏</option>
                                                <option value="9:16">9:16 竖屏</option>
                                            </select>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="durationSelect" class="form-label">
                                                <i class="fas fa-clock me-1"></i> 视频时长:
                                            </label>
                                            <select id="durationSelect" class="form-select" v-model="videoDuration" :disabled="isConvertingToVideo">
                                                <option value="5s">5秒</option>
                                                <option value="6s">6秒</option>
                                                <option value="7s">7秒</option>
                                                <option value="8s">8秒</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <!-- 视频转换按钮 -->
                                    <div class="d-grid gap-2">
                                        <button 
                                            class="btn btn-info" 
                                            @click="convertToVideo" 
                                            :disabled="isConvertingToVideo || !currentImageUrl">
                                            <i class="fas fa-magic me-1"></i> {{ isConvertingToVideo ? '转换中...' : '将图像转换为视频' }}
                                        </button>
                                        <button 
                                            v-if="currentVideoUrl" 
                                            class="btn btn-warning" 
                                            @click="saveVideo">
                                            <i class="fas fa-download me-1"></i> 保存视频到本地
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 历史记录标签页内容 -->
                <div v-show="activeTab === 'history'" class="tab-content">
                    <div class="card">
                        <div class="card-header text-center">
                            <i class="fas fa-history me-1"></i> 历史记录
                        </div>
                        <div class="card-body" style="max-height: 800px; overflow-y: auto;">
                            <div v-if="history.length === 0" class="text-center text-muted py-5">
                                <i class="fas fa-history fa-4x mb-3"></i>
                                <p>还没有历史记录</p>
                            </div>
                            <div v-else class="history-list">
                                <div v-for="(item, index) in history" :key="index" class="history-item mb-3">
                                    <div class="d-flex align-items-start">
                                        <div class="flex-grow-1">
                                            <p class="mb-1 fw-bold">
                                                {{ item.prompt }}
                                            </p>
                                            <p class="text-muted small mb-1">
                                                <i class="fas fa-calendar-alt me-1"></i> {{ item.timestamp }}
                                            </p>
                                            <p v-if="item.model" class="text-muted small mb-1">
                                                <i class="fas fa-robot me-1"></i> 模型: {{ getModelName(item.model) }}
                                                <span v-if="item.style" class="badge bg-secondary ms-2">{{ item.style }}</span>
                                            </p>
                                        </div>
                                        <div class="history-img-container" @click="loadFromHistory(item)">
                                            <img v-if="item.imageUrl" :src="item.imageUrl" alt="历史图像" class="history-img">
                                            <video v-else-if="item.videoUrl" :src="item.videoUrl" class="history-img"></video>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 文本到视频标签页内容 -->
                <div v-show="activeTab === 'text2video'" class="tab-content">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <div class="d-flex align-items-center">
                                <span><i class="fas fa-film me-1"></i> 文本到视频生成 (Step-Video)</span>
                                <span class="ms-auto" title="使用30亿参数的大型模型直接从文本生成视频"><i class="fas fa-info-circle"></i></span>
                            </div>
                        </div>
                        <div class="card-body">
                            <!-- 视频提示词输入 -->
                            <div class="mb-3">
                                <label for="directVideoPrompt" class="form-label">
                                    <i class="fas fa-comment-dots me-1"></i> 视频场景描述:
                                </label>
                                <textarea 
                                    id="directVideoPrompt" 
                                    class="form-control" 
                                    rows="3" 
                                    placeholder="详细描述您想要的视频场景，如：'一个戴着太阳镜的女孩走在海边，穿着红色连衣裙，微风吹拂着她的头发...'" 
                                    v-model="directVideoPrompt"
                                    :disabled="isGeneratingDirectVideo">
                                </textarea>
                                <small class="text-muted"><i class="fas fa-lightbulb me-1"></i> 支持中文输入，系统会自动翻译。详细、具体的描述会产生更好的效果。</small>
                            </div>
                            
                            <!-- 参数设置 -->
                            <div class="mb-3">
                                <label for="directVideoStepsSlider" class="form-label">
                                    <i class="fas fa-step-forward me-1"></i> 生成步数: <span class="badge bg-primary">{{ directVideoSteps }}</span>
                                </label>
                                <input 
                                    type="range" 
                                    class="form-range" 
                                    id="directVideoStepsSlider" 
                                    min="20" 
                                    max="50" 
                                    v-model.number="directVideoSteps"
                                    :disabled="isGeneratingDirectVideo">
                                <small class="text-muted">步数越高，视频质量越好，但生成时间更长。建议30-50步。</small>
                            </div>
                            
                            <!-- 生成视频按钮 -->
                            <div class="d-grid gap-2">
                                <button 
                                    class="btn btn-primary" 
                                    @click="generateDirectVideo" 
                                    :disabled="isGeneratingDirectVideo || !directVideoPrompt.trim()">
                                    <i class="fas fa-magic me-1"></i> {{ isGeneratingDirectVideo ? '生成中...' : '生成视频' }}
                                </button>
                            </div>
                            
                            <!-- 进度条 -->
                            <div v-if="isGeneratingDirectVideo" class="progress mt-3" style="height: 30px;">
                                <div 
                                    class="progress-bar progress-bar-striped progress-bar-animated" 
                                    role="progressbar" 
                                    :style="{ width: progress + '%' }" 
                                    :aria-valuenow="progress" 
                                    aria-valuemin="0" 
                                    aria-valuemax="100">
                                    <i class="fas fa-spinner fa-spin me-1"></i> {{ progress }}%
                                </div>
                            </div>
                            
                            <!-- 提示 -->
                            <div class="alert alert-info mt-3">
                                <i class="fas fa-info-circle me-1"></i> <small>文本到视频生成需要较长时间（1-2分钟），请耐心等待。</small>
                            </div>
                            
                            <!-- 视频预览 -->
                            <div v-if="directVideoUrl" class="mt-4">
                                <h5 class="mb-3"><i class="fas fa-play-circle me-1"></i> 生成的视频:</h5>
                                <div class="video-container">
                                    <video controls class="generated-video">
                                        <source :src="directVideoUrl" type="video/mp4">
                                        您的浏览器不支持视频播放
                                    </video>
                                </div>
                                <div class="d-grid mt-3">
                                    <button class="btn btn-warning" @click="saveDirectVideo">
                                        保存视频到本地
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 页脚 -->
        <footer class="mt-5 text-center">
            <div class="container">
                <div class="row">
                    <div class="col-md-12">
                        <h5 class="mb-3"><i class="fas fa-robot me-2"></i> AI图像生成器</h5>
                        <p class="mb-2">为您带来最优质的AI图像生成体验</p>
                        <p>&copy; 2025 my.djxs.xyz</p>
                        <div class="mt-3">
                            <a href="#" class="text-muted mx-2"><i class="fas fa-question-circle"></i> 帮助</a>
                            <a href="#" class="text-muted mx-2"><i class="fas fa-envelope"></i> 联系我们</a>
                            <a href="#" class="text-muted mx-2"><i class="fas fa-shield-alt"></i> 隐私政策</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </div>
    `
});

// 添加Lodash防抖功能
app.config.globalProperties._ = {
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
};

// 挂载Vue应用
app.mount('#app'); 