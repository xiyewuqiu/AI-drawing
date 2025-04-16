// 图像生成模型列表
const FAL_AI_MODELS = [
    {
        "id": "fal-ai/flux-pro/v1.1-ultra",
        "name": "Flux Pro Ultra (高质量)",
        "description": "FLUX 1.1 [pro] ultra是最新版本的专业级图像生成模型，提供高达2K分辨率的高质量图像，增强了照片真实感",
        "category": "text2image"
    },
    {
        "id": "fal-ai/lumina-image/v2",
        "name": "Lumina Image 2 (优质文字)",
        "description": "Lumina Image 2是一款20亿参数流式扩散变换器，具有出色的图像质量、文字排版和复杂提示理解能力",
        "category": "text2image"
    },
    {
        "id": "fal-ai/flux-pro/v1.1-ultra-finetuned",
        "name": "Flux Pro Ultra微调版",
        "description": "FLUX 1.1 [pro] ultra微调版，通过LoRA微调，保持专业级图像质量的同时提供高达2K分辨率和增强的照片真实感",
        "category": "text2image"
    },
    {
        "id": "fal-ai/minimax-image",
        "name": "MiniMax (Hailuo AI)",
        "description": "MiniMax图像生成模型，支持更长的文字描述，能生成高质量图像，支持多种纵横比选择",
        "category": "text2image"
    },
    {
        "id": "fal-ai/hidream-i1-full",
        "name": "HiDream I1 Full (开源高清)",
        "description": "HiDream-I1是一个17B参数的开源图像生成基础模型，可以在几秒钟内实现高质量的图像生成效果",
        "category": "text2image"
    },
    {
        "id": "fal-ai/recraft-v3",
        "name": "Recraft V3 (超高质量)",
        "description": "最新的Recraft V3模型，提供超高质量的图像生成，支持矢量风格",
        "category": "text2image"
    },
    {
        "id": "fal-ai/sana/v1.5/4.8b",
        "name": "Sana 4.8B (4K高清)",
        "description": "强大的4K图像生成模型，细节丰富，适合需要高质量大图的场景",
        "category": "text2image"
    },
    {
        "id": "fal-ai/flux/dev",
        "name": "Flux.1 [dev] (创意高清)",
        "description": "Flux.1 [dev]是一个12亿参数流量变换器，生成高质量图像，适合个人和商业用途",
        "category": "text2image"
    },
    {
        "id": "step-video",
        "name": "Step-Video (30亿参数)",
        "description": "使用30亿参数的大型模型直接从文本生成高质量视频",
        "category": "text2video"
    },
    {
        "id": "veo2",
        "name": "Veo2 (图像到视频)",
        "description": "将静态图像转换为流畅的短视频，支持自定义动画效果",
        "category": "image2video"
    },
    {
        "id": "wan-pro",
        "name": "WAN-Pro (高清视频)",
        "description": "WAN-Pro 2.1 专业版可生成1080p高质量6秒视频（30FPS），提供卓越的视觉质量和动态效果",
        "category": "image2video"
    }
];

// 模型类别定义
const MODEL_CATEGORIES = [
    { 
        id: "text2image", 
        name: "文字生成图片", 
        icon: "fas fa-image",
        description: "将文字描述转换为精美图像",
        hidden: false  // 将text2image类别设置为可见
    },
    { 
        id: "image2video", 
        name: "图片生成视频", 
        icon: "fas fa-film",
        description: "将静态图片转换为动态视频"
    },
    { 
        id: "text2video", 
        name: "文字生成视频", 
        icon: "fas fa-video",
        description: "直接从文字描述生成视频内容"
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
            
            // 模型分类
            modelCategories: MODEL_CATEGORIES,
            selectedCategory: "text2image",
            showCategorySelector: true,
            
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
            
            // Flux Pro Ultra参数
            fluxProSeed: null,
            fluxProRaw: false,
            fluxProAspectRatio: "16:9",
            
            // Flux Pro Ultra微调版参数
            finetuneStrength: 1.0,
            
            // 视频动画控制
            videoPrompt: "",
            videoAspectRatio: "auto",
            videoDuration: "5s",
            selectedVideoModel: "veo2", // 默认使用veo2模型
            
            // Step-Video 直接文本到视频参数
            directVideoPrompt: "",
            directVideoSteps: 30,
            directVideoUrl: null,
            
            // 界面控制
            activeTab: 'preview',
            
            // 显示错误信息
            errorMessage: "",
            showError: false,
            
            // 主题模式
            isDarkMode: true,
            
            // 加载提示
            isLoading: false,
            isVideoLoading: false,
            isDirectVideoLoading: false,
            
            // 新增UI增强
            showWelcomeAnimation: true,
            currentModelIndex: 0,
            modelChangeAnimation: false,
            showTooltips: true,
            notifications: [],
            notificationId: 0
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
        // 根据选择的类别筛选模型
        filteredModels() {
            return this.models.filter(model => model.category === this.selectedCategory);
        },
        // 当前选中的类别对象
        currentCategory() {
            return this.modelCategories.find(cat => cat.id === this.selectedCategory);
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
        // 当前是否选择了Flux.1 [dev]模型
        isFluxDevModel() {
            return this.selectedModel === 'fal-ai/flux/dev';
        },
        // 当前是否选择了Flux Pro Ultra模型
        isFluxProUltraModel() {
            return this.selectedModel === 'fal-ai/flux-pro/v1.1-ultra';
        },
        // 当前是否选择了Flux Pro Ultra微调版模型
        isFluxProUltraFinetunedModel() {
            return this.selectedModel === 'fal-ai/flux-pro/v1.1-ultra-finetuned';
        },
        // 当前是否选择了Lumina Image 2模型
        isLuminaImage2Model() {
            return this.selectedModel === 'fal-ai/lumina-image/v2';
        },
        // 当前是否选择了MiniMax (Hailuo AI)模型
        isMiniMaxModel() {
            return this.selectedModel === 'fal-ai/minimax-image';
        },
        // 当前是否选择了HiDream I1 Full模型
        isHiDreamModel() {
            return this.selectedModel === 'fal-ai/hidream-i1-full';
        },
        // 返回当前选中的模型描述
        selectedModelDescription() {
            const model = this.models.find(m => m.id === this.selectedModel);
            return model ? model.description : "未选择模型";
        },
        // 过滤掉隐藏的类别
        visibleCategories() {
            return this.modelCategories.filter(category => !category.hidden);
        },
        // 删除Midjourney相关计算属性
        isMidjourneyModel() {
            return false; // 始终返回false，因为我们已经删除了Midjourney模型
        }
    },
    methods: {
        // 切换模型类别
        changeCategory(categoryId) {
            this.selectedCategory = categoryId;
            
            // 如果当前选中的模型不属于新类别，则自动选择该类别的第一个模型
            const modelsInCategory = this.filteredModels;
            if (modelsInCategory.length > 0) {
                if (!modelsInCategory.some(m => m.id === this.selectedModel)) {
                    // 添加模型切换动画
                    this.modelChangeAnimation = true;
                    setTimeout(() => {
                        this.selectedModel = modelsInCategory[0].id;
                        setTimeout(() => {
                            this.modelChangeAnimation = false;
                        }, 300);
                    }, 300);
                }
            }
            
            // 根据选中的类别切换到适当的标签页
            if (categoryId === 'text2image') {
                this.activeTab = 'preview';
            } else if (categoryId === 'image2video') {
                this.activeTab = 'video';
            } else if (categoryId === 'text2video') {
                this.activeTab = 'direct-video';
            }
            
            // 添加视觉反馈
            this.addNotification(`已切换到${this.currentCategory.name}类别`, 'success');
        },
        
        // 切换模型
        changeModel(modelId) {
            if (this.selectedModel === modelId) return;
            
            // 添加模型切换动画
            this.modelChangeAnimation = true;
            setTimeout(() => {
                this.selectedModel = modelId;
                
                // 添加适当的默认参数
                if (this.isRecraftModel) {
                    this.selectedRecraftStyle = "realistic_image";
                }
                
                setTimeout(() => {
                    this.modelChangeAnimation = false;
                }, 300);
            }, 300);
            
            // 添加视觉反馈
            this.addNotification(`已选择 ${this.getModelName(modelId)} 模型`, 'info');
        },
        
        // 切换主题
        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('light-mode', !this.isDarkMode);
            
            // 保存到本地存储
            try {
                localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
            } catch (e) {
                console.error('无法保存主题设置', e);
            }
            
            // 添加视觉反馈
            this.addNotification(`已切换到${this.isDarkMode ? '深色' : '浅色'}模式`, 'info');
        },

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
                    
                    // 添加视觉反馈
                    if (!this.isTranslating) {
                        this.addNotification('翻译完成', 'success');
                    }
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
            if (!this.prompt.trim() && !this.translatedPrompt.trim()) return;
            
            // 确保选择了模型
            if (!this.selectedModel) {
                this.addNotification("请先选择一个模型", "error");
                return;
            }
            
            // 设置生成中状态
            this.isGenerating = true;
            this.progress = 0;
            this.errorMessage = "";
            this.showError = false;
            this.currentImageUrl = null;
            
            // 日志统计
            this.logStatistics('generate_image', this.selectedModel);
            
            try {
                // 使用翻译后的提示词（如果有），否则使用原始提示词
                const finalPrompt = this.translatedPrompt.trim() || this.prompt.trim();
                
                // 构建请求参数
                const params = new URLSearchParams();
                params.append('model_id', this.selectedModel);
                params.append('prompt', finalPrompt);
                params.append('image_size', this.imageSize);
                params.append('steps', this.steps);
                params.append('guidance', this.guidance);
                
                // Recraft V3 特定参数
                if (this.isRecraftModel) {
                    params.append('style', this.selectedRecraftStyle);
                }
                
                // Flux Pro Ultra 特定参数
                if (this.isFluxProUltraModel) {
                    if (this.fluxProSeed !== null && this.fluxProSeed !== undefined) {
                        params.append('seed', this.fluxProSeed);
                    }
                    params.append('raw', this.fluxProRaw ? '1' : '0');
                    params.append('aspect_ratio', this.fluxProAspectRatio);
                }
                
                // Flux Pro Ultra微调版特定参数
                if (this.isFluxProUltraFinetunedModel) {
                    if (this.fluxProSeed !== null && this.fluxProSeed !== undefined) {
                        params.append('seed', this.fluxProSeed);
                    }
                    params.append('raw', this.fluxProRaw ? '1' : '0');
                    params.append('aspect_ratio', this.fluxProAspectRatio);
                    params.append('finetune_id', ''); // 如果需要特定微调ID，可在此设置
                    params.append('finetune_strength', this.finetuneStrength.toString()); // 使用用户设置的微调强度
                }
                
                // HiDream I1 Full 特定参数
                if (this.isHiDreamModel) {
                    // 这里可以添加HiDream模型特有的参数，如果有的话
                    if (this.fluxProSeed !== null && this.fluxProSeed !== undefined) {
                        params.append('seed', this.fluxProSeed);  // 可以复用seed参数
                    }
                }
                
                // MiniMax模型特定参数
                if (this.isMiniMaxModel) {
                    // MiniMax模型使用aspect_ratio参数
                    params.append('aspect_ratio', this.fluxProAspectRatio);  // 复用Flux Pro Ultra的纵横比参数
                    params.append('prompt_optimizer', 'true');  // 启用提示词优化
                }
                
                // Lumina Image 2特定参数
                if (this.isLuminaImage2Model) {
                    // Lumina Image 2是一个优化的文字到图像模型，没有特殊参数
                    // 默认生成1024x768的图像
                    if (this.imageSize === "portrait") {
                        params.append('height', '1024');
                        params.append('width', '768');
                    } else if (this.imageSize === "landscape") {
                        params.append('height', '768');
                        params.append('width', '1024');
                    } else {
                        // 正方形
                        params.append('height', '768');
                        params.append('width', '768');
                    }
                }
                
                // 请求接口
                this.progress = 10;
                const response = await fetch('api/generate_image.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params.toString()
                });
                
                this.progress = 30;
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                this.progress = 90;
                
                if (result.success) {
                    this.currentImageUrl = result.image_url;
                    this.currentImageData = result;
                    
                    // 记录统计
                    await this.logStatistics('generate_image', this.selectedModel);
                    
                    // 如果是FLUX Pro Ultra，记录seed供下次使用
                    if (this.isFluxProUltraModel && result.seed) {
                        this.fluxProSeed = result.seed;
                    }
                    
                    // 如果是FLUX Pro Ultra微调版，也记录seed供下次使用
                    if (this.isFluxProUltraFinetunedModel && result.seed) {
                        this.fluxProSeed = result.seed;
                    }
                    
                    // 如果是HiDream模型，也记录seed供下次使用
                    if (this.isHiDreamModel && result.seed) {
                        this.fluxProSeed = result.seed;  // 共用同一个seed变量
                    }
                    
                    // 添加视觉反馈
                    if (!this.isGenerating) {
                        this.addNotification('图像生成成功', 'success');
                    }
                } else {
                    this.errorMessage = result.error || "生成图像失败";
                    this.showError = true;
                }
            } catch (error) {
                console.error("生成图像错误:", error);
                this.errorMessage = `请求出错: ${error.message}`;
                this.showError = true;
            } finally {
                this.isGenerating = false;
                this.progress = 100;
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
                    duration: this.videoDuration,
                    model: this.selectedVideoModel // 添加模型参数
                };
                
                // 发送请求到后端API
                this.progress = 30;
                const response = await axios.post('/api/generate_video.php', params);
                
                if (response.data && response.data.success) {
                    this.progress = 90;
                    this.currentVideoUrl = response.data.video_url;
                    
                    // 记录视频生成统计
                    this.logStatistics('generate_video', this.selectedVideoModel);
                    
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
            
            // 检查当前是否在文字生成视频的类别中
            if (this.selectedCategory !== 'text2video') {
                this.errorMessage = "请先选择文字生成视频类别";
                this.showError = true;
                setTimeout(() => {
                    this.showError = false;
                }, 5000);
                return;
            }
            
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
                    num_inference_steps: this.directVideoSteps,
                    model_id: this.selectedModel
                };
                
                // 发送请求到后端API
                this.progress = 30;
                const response = await axios.post('/api/generate_text_video.php', params);
                
                if (response.data && response.data.success) {
                    this.progress = 90;
                    this.directVideoUrl = response.data.video_url;
                    
                    // 记录生成统计
                    this.logStatistics('generate_direct_video', this.selectedModel);
                    
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
            
            // 显示加载提示
            this.isDirectVideoLoading = true;
            
            // 创建一个XMLHttpRequest对象来获取视频
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.directVideoUrl, true);
            xhr.responseType = 'blob';
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    // 获取视频blob
                    const blob = xhr.response;
                    
                    // 创建一个临时链接指向blob
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    
                    // 设置文件名
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    link.download = `AI_DirectVideo_${timestamp}.mp4`;
                    
                    // 模拟点击下载
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // 释放blob URL
                    URL.revokeObjectURL(link.href);
                    
                    // 记录下载统计
                    this.logStatistics('download_direct_video');
                } else {
                    // 如果请求失败，回退到原来的方法
                    console.error('无法加载视频，回退到直接下载链接');
                    this.fallbackDirectVideoDownload();
                }
                
                // 隐藏加载提示
                this.isDirectVideoLoading = false;
            };
            
            xhr.onerror = () => {
                // 如果加载失败，回退到原来的方法
                console.error('无法加载视频，回退到直接下载链接');
                this.fallbackDirectVideoDownload();
                this.isDirectVideoLoading = false;
            };
            
            // 开始加载视频
            xhr.send();
        },
        
        // 回退到直接下载直接视频链接方法
        fallbackDirectVideoDownload() {
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
        
        // 保存图像到本地
        saveImage() {
            if (!this.currentImageUrl) return;
            
            // 显示加载提示
            this.isLoading = true;
            
            // 创建一个图片对象来加载图片
            const img = new Image();
            img.crossOrigin = "anonymous";  // 允许跨域
            
            img.onload = () => {
                // 创建canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // 在canvas上绘制图片
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                // 将canvas转换为blob
                canvas.toBlob((blob) => {
                    // 创建一个临时链接指向blob
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    
                    // 设置文件名
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    link.download = `AI_Image_${timestamp}.png`;
                    
                    // 模拟点击下载
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // 释放blob URL
                    URL.revokeObjectURL(link.href);
                    
                    // 隐藏加载提示
                    this.isLoading = false;
                    
                    // 记录下载统计
                    this.logStatistics('download');
                }, 'image/png');
            };
            
            img.onerror = () => {
                // 如果加载失败，回退到原来的方法
                console.error('无法加载图片，回退到直接下载链接');
                
                const link = document.createElement('a');
                link.href = this.currentImageUrl;
                
                // 设置文件名
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                link.download = `AI_Image_${timestamp}.png`;
                
                // 模拟点击下载
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.isLoading = false;
                
                // 记录下载统计
                this.logStatistics('download');
            };
            
            // 开始加载图片
            img.src = this.currentImageUrl;
        },
        
        // 保存视频到本地
        saveVideo() {
            if (!this.currentVideoUrl) return;
            
            // 显示加载提示
            this.isVideoLoading = true;
            
            // 创建一个XMLHttpRequest对象来获取视频
            const xhr = new XMLHttpRequest();
            xhr.open('GET', this.currentVideoUrl, true);
            xhr.responseType = 'blob';
            
            xhr.onload = () => {
                if (xhr.status === 200) {
                    // 获取视频blob
                    const blob = xhr.response;
                    
                    // 创建一个临时链接指向blob
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    
                    // 设置文件名
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    link.download = `AI_Video_${timestamp}.mp4`;
                    
                    // 模拟点击下载
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // 释放blob URL
                    URL.revokeObjectURL(link.href);
                    
                    // 记录下载统计
                    this.logStatistics('download_video');
                } else {
                    // 如果请求失败，回退到原来的方法
                    console.error('无法加载视频，回退到直接下载链接');
                    this.fallbackVideoDownload();
                }
                
                // 隐藏加载提示
                this.isVideoLoading = false;
            };
            
            xhr.onerror = () => {
                // 如果加载失败，回退到原来的方法
                console.error('无法加载视频，回退到直接下载链接');
                this.fallbackVideoDownload();
                this.isVideoLoading = false;
            };
            
            // 开始加载视频
            xhr.send();
        },
        
        // 回退到直接下载视频链接方法
        fallbackVideoDownload() {
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
        },
        
        // 关闭欢迎动画
        closeWelcomeAnimation() {
            this.showWelcomeAnimation = false;
            // 保存到本地存储
            try {
                localStorage.setItem('welcomeShown', 'true');
            } catch (e) {
                console.error('无法保存欢迎设置', e);
            }
        },
        
        // 循环展示模型
        cycleModels() {
            setInterval(() => {
                if (!this.isGenerating && !this.isTranslating) {
                    this.currentModelIndex = (this.currentModelIndex + 1) % this.filteredModels.length;
                }
            }, 5000);
        }
    },
    mounted() {
        // 检查本地存储的主题设置
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            this.isDarkMode = false;
            document.documentElement.classList.remove('dark-theme');
        } else {
            this.isDarkMode = true;
            document.documentElement.classList.add('dark-theme');
        }
        
        // 默认选择类别和模型
        this.selectedCategory = 'text2video';
        this.selectedModel = 'step-video';
        
        // 每3秒循环展示模型
        // setInterval(this.cycleModels, 3000);
        
        // 3秒后自动关闭欢迎动画
        setTimeout(() => {
            this.showWelcomeAnimation = false;
        }, 3000);
    },
    template: `
    <div class="app-container">
        <!-- 标题 -->
        <div class="text-center mb-4">
            <h1 class="app-title">AI 图像生成器</h1>
            <p class="app-subtitle">输入中文，AI自动翻译并生成精美图像</p>
            
            <!-- 主题切换按钮和图库按钮 -->
            <div class="theme-toggle">
                <a href="/gallery.php" class="btn btn-outline-secondary btn-sm me-2" title="查看所有生成作品">
                    <i class="fas fa-images me-1"></i> 图库
                </a>
                <button @click="toggleTheme" class="theme-toggle-btn" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
                    <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
                </button>
            </div>
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
                        
                        <!-- 参数面板 - 优化设计 -->
                        <div class="mb-4">
                            <div class="parameter-section">
                                <h5 class="section-title"><i class="fas fa-sliders-h me-1"></i> 生成参数</h5>
                                
                                <!-- 模型类别选择 -->
                                <div class="mb-3">
                                    <label for="categorySelect" class="form-label">
                                        <i class="fas fa-th-large me-1"></i> 功能选择:
                                    </label>
                                    <select id="categorySelect" class="form-select" v-model="selectedCategory" @change="changeCategory(selectedCategory)">
                                        <option v-for="category in visibleCategories" :key="category.id" :value="category.id">
                                            {{ category.name }}
                                        </option>
                                    </select>
                                    <small class="text-muted d-block mt-2">
                                        <i :class="currentCategory ? currentCategory.icon : ''"></i> {{ currentCategory ? currentCategory.description : '' }}
                                    </small>
                                </div>
                                
                                <!-- 选择模型 -->
                                <div class="mb-3">
                                    <label for="modelSelect" class="form-label">
                                        <i class="fas fa-robot me-1"></i> 模型选择:
                                    </label>
                                    <select id="modelSelect" class="form-select" v-model="selectedModel">
                                        <option v-for="model in filteredModels" :key="model.id" :value="model.id">
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

                                <!-- FLUX Pro Ultra模型特有参数 -->
                                <div v-if="isFluxProUltraModel || isFluxProUltraFinetunedModel">
                                    <div class="mb-3">
                                        <label for="fluxProAspectRatioSelect" class="form-label">
                                            <i class="fas fa-crop me-1"></i> 图像比例:
                                        </label>
                                        <select id="fluxProAspectRatioSelect" class="form-select" v-model="fluxProAspectRatio">
                                            <option value="21:9">21:9 (超宽)</option>
                                            <option value="16:9">16:9 (宽屏)</option>
                                            <option value="4:3">4:3 (标准)</option>
                                            <option value="3:2">3:2 (相机)</option>
                                            <option value="1:1">1:1 (正方形)</option>
                                            <option value="2:3">2:3 (竖版相机)</option>
                                            <option value="3:4">3:4 (竖版标准)</option>
                                            <option value="9:16">9:16 (竖版宽屏)</option>
                                            <option value="9:21">9:21 (竖版超宽)</option>
                                        </select>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="fluxProSeedInput" class="form-label">
                                            <i class="fas fa-seedling me-1"></i> 随机种子 (可选):
                                        </label>
                                        <input 
                                            type="number" 
                                            id="fluxProSeedInput" 
                                            class="form-control" 
                                            placeholder="留空随机生成"
                                            v-model.number="fluxProSeed">
                                        <small class="text-muted">相同种子+提示词会生成相同图像</small>
                                    </div>
                                    
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="fluxProRawCheck" v-model="fluxProRaw">
                                        <label class="form-check-label" for="fluxProRawCheck">
                                            <i class="fas fa-image me-1"></i> 自然风格模式
                                        </label>
                                        <small class="text-muted d-block">生成更自然、处理更少的图像</small>
                                    </div>
                                    
                                    <!-- 微调版特有参数 -->
                                    <div v-if="isFluxProUltraFinetunedModel" class="mb-3">
                                        <label for="finetuneStrengthSlider" class="form-label">
                                            <i class="fas fa-sliders-h me-1"></i> 微调强度: <span class="badge bg-primary">{{finetuneStrength}}</span>
                                        </label>
                                        <input type="range" class="form-range" id="finetuneStrengthSlider" min="0.1" max="2.0" step="0.1" v-model.number="finetuneStrength">
                                        <small class="text-muted">控制微调影响强度。如果目标特征不够明显，可增加此值</small>
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
                        
                        <!-- 翻译按钮和生成按钮行 -->
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <button 
                                    class="btn btn-primary w-100" 
                                    @click="translatePrompt"
                                    :disabled="!prompt.trim() || isTranslating">
                                    <i class="fas fa-language me-1"></i> 
                                    <span v-if="isTranslating"><i class="fas fa-spinner fa-spin me-1"></i> 翻译中...</span>
                                    <span v-else>AI翻译</span>
                                </button>
                            </div>
                            <div class="col-6">
                                <button 
                                    class="btn btn-success w-100" 
                                    @click="generateImage"
                                    :disabled="!canGenerate">
                                    <i class="fas fa-magic me-1"></i> 
                                    <span v-if="isGenerating"><i class="fas fa-spinner fa-spin me-1"></i> 生成中...</span>
                                    <span v-else>生成图像</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- 保存按钮 -->
                        <button 
                            class="btn btn-warning w-100" 
                            @click="saveImage" 
                            :disabled="!currentImageUrl || isLoading">
                            <i class="fas" :class="isLoading ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                            {{ isLoading ? '正在下载中...' : '保存图像到本地' }}
                        </button>
                        
                        <!-- 提示信息 -->
                        <div class="alert alert-info mt-3" role="alert">
                            <small><i class="fas fa-info-circle me-1"></i> 提示: 输入中文后点击"点击翻译"按钮进行翻译，或直接用英文描述生成图像</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 右侧：预览和输出 -->
            <div class="col-md-7">
                <!-- 标签页 -->
                <ul class="nav nav-tabs mb-3">
                    <li class="nav-item">
                        <a class="nav-link" :class="{ active: activeTab === 'preview' }" @click.prevent="activeTab = 'preview'" href="#">
                            <i class="fas fa-image me-1"></i> 预览
                        </a>
                    </li>
                    <li class="nav-item" v-if="selectedCategory === 'text2video'">
                        <a class="nav-link" :class="{ active: activeTab === 'text2video' }" @click.prevent="activeTab = 'text2video'" href="#">
                            <i class="fas fa-film me-1"></i> 文本到视频
                        </a>
                    </li>
                </ul>
                
                <!-- 预览标签页内容 -->
                <div v-show="activeTab === 'preview'" class="tab-content">
                    <div class="preview-container">
                        <h5 class="preview-title text-center"><i class="fas fa-image me-1"></i> 生成的图像</h5>
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
                        <div v-if="currentImageUrl && !isGenerating" class="video-controls-section mt-4">
                            <h5 class="section-title"><i class="fas fa-film me-1"></i> 图像转视频</h5>
                            
                            <!-- 视频模型选择 -->
                            <div class="mb-3">
                                <label for="videoModelSelect" class="form-label">
                                    <i class="fas fa-robot me-1"></i> 视频模型:
                                </label>
                                <select id="videoModelSelect" class="form-select" v-model="selectedVideoModel" :disabled="isConvertingToVideo">
                                    <option v-for="model in models.filter(m => m.category === 'image2video')" :key="model.id" :value="model.id">
                                        {{ model.name }}
                                    </option>
                                </select>
                                <small class="text-muted">{{ models.find(m => m.id === selectedVideoModel)?.description || '' }}</small>
                            </div>
                            
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
                            <div class="row mb-3" v-if="selectedVideoModel === 'veo2'">
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
                            
                            <!-- WAN-Pro模型信息 -->
                            <div class="alert alert-info" v-if="selectedVideoModel === 'wan-pro'">
                                <i class="fas fa-info-circle me-1"></i> WAN-Pro模型将生成固定6秒时长、1080p高清的视频（30FPS）
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
                                    @click="saveVideo"
                                    :disabled="isVideoLoading">
                                    <i class="fas" :class="isVideoLoading ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                                    {{ isVideoLoading ? '正在下载中...' : '保存视频到本地' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 文本到视频标签页内容 -->
                <div v-show="activeTab === 'text2video'" class="tab-content">
                    <div class="preview-container">
                        <h5 class="preview-title text-center"><i class="fas fa-film me-1"></i> 文本到视频生成 ({{ selectedModel === 'step-video' ? 'Step-Video' : '选择模型' }})</h5>
                        <div class="content-padding">
                            <!-- 模型选择 -->
                            <div class="mb-3">
                                <label for="text2VideoModelSelect" class="form-label">
                                    <i class="fas fa-robot me-1"></i> 视频生成模型:
                                </label>
                                <select id="text2VideoModelSelect" class="form-select" v-model="selectedModel">
                                    <option v-for="model in filteredModels" :key="model.id" :value="model.id">
                                        {{ model.name }}
                                    </option>
                                </select>
                                <small class="text-muted d-block mt-2">{{ selectedModelDescription }}</small>
                            </div>
                            
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
                                    <button class="btn btn-warning" 
                                        @click="saveDirectVideo"
                                        :disabled="isDirectVideoLoading">
                                        <i class="fas" :class="isDirectVideoLoading ? 'fa-spinner fa-spin' : 'fa-download'"></i>
                                        {{ isDirectVideoLoading ? '正在下载中...' : '保存视频到本地' }}
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