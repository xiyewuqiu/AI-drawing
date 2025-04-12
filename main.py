import os
import sys
import fal_client
import webbrowser
from PySide6.QtWidgets import (QApplication, QMainWindow, QLabel, QLineEdit, 
                             QPushButton, QVBoxLayout, QHBoxLayout, QWidget, 
                             QMessageBox, QSpinBox, QSlider, QComboBox, 
                             QProgressBar, QFrame, QTextEdit, QFileDialog,
                             QListWidget, QTabWidget, QSplitter, QScrollArea,
                             QSizePolicy)
from PySide6.QtCore import Qt, QThread, Signal, QSize, QUrl, QDateTime, QByteArray, QTimer
from PySide6.QtGui import QFont, QIcon, QPixmap, QImage, QDesktopServices, QPalette, QColor
import requests
import json
from io import BytesIO
from PIL import Image
import datetime
import re
import hashlib
import random
import uuid
import time

# 设置 fal.ai API 密钥库
FAL_API_KEYS = [
    "736c053d-58db-4f6f-9717-154dfd0a181b:857c40692e3bc5a5f3e496282a506b91",
    "84066f4d-e970-4a22-9bd1-d861b44892e3:7081ca3f337ff27477809c9014c0adb1",
    "afe539a9-640b-454a-9e66-86d49ee9d514:f58269ca0839d93d8323eadd21a36695",
    "825d67cd-c89b-4ca1-a8a8-bbe5c99da1b2:42cf185082ace2d1699962adaf60f182",
    "afa7c832-f593-420c-aa7f-7d1952b4bff2:ee6b6772f37b0b69d45130b9dc98e3b6",
    "fc42dc90-aedb-44bc-bd05-4d8dd4b246d3:c39b514b7c2b55d3d2e09ccf484b7bcb",
    "3adf5573-42e6-4ec0-b734-91e29a5591cb:c754392ecf1b4d016c4676c98ead3983",
    "d5ee4097-467b-46e2-84c2-75b1bc391f17:190abc27f2924ee6fb248332ca5ac09b",
    "05ecd944-db81-4582-984b-4faf815d6f0b:1123a5dd1535d6a1e8456e7be1a1051b",
    "7f65279f-f9d3-4c83-a88e-c79887fadc80:ec6d6aa2c7d55b30ec06c2c3a898d70a",
    "438f7451-90b1-4083-a377-34e20d15e713:042e34928cc63cf17c711044b9f9314b",
    "c4de621f-81b1-4f74-8116-8b4384d5d97b:045d4fbb8ab6107a3544b56a68cce96f",
    "567c3b78-0223-4bce-88ea-7535da1b6116:2cbaec4d8895f8d3dc9622fff89748c8",
    "9beb322e-dde4-4557-bbde-18f69bf77ad5:4057c799ee889e49339d6996d0d3a57f",
    "68b64ff8-2961-4cb6-b5bb-4483c2aff8a2:70d4042353d4ce47a49937a69a764125",
    "08dd3686-91c6-488c-a8f5-68f12cb508b8:9749c25e995ac7f824a041a073ebf0d6",
    "d28bbd10-101b-4bdf-962f-ab961547bb37:60349d918585e3e4ecd5fecb9163e323",
    "2048c002-9a0a-4b72-b335-b819d445c2e5:8c8ce517c4cd2cc5abfd57e77fd84e8f",
    "8f121193-3155-437c-a2a0-18cc6e22b90b:70861e3702d1e46d576547789ddbb6ab",
    "c5187f1f-ce95-4261-a504-1dd5aab48114:e9a1ef918477dec2714f31bfe95b1f89",
    "df1e0187-8c3d-4547-a8ba-8ff05dd81bdb:72f966a46eec757f2b38a930af77c957",
    "6dbed75c-cedf-42c5-9dd4-030c2ede7b95:c5e94d16957f49b1939596c0772f8dd9",
    "b16a020c-fa5f-46b7-839d-19f36818b75f:cae5e24fe9bc4af3b388e0ba96c40f24",
    "5563572d-ebc8-4647-92c0-3a1e2614d4f8:184421d3ed8365ba9f0b397dbd777e4e",
    "f85c82e7-3f3d-4212-b878-2a626025aa37:b8fa23d5781d89c292a6aadd32267cdb",
    "b0dfae1d-8741-497a-9143-71683f845621:1f1a135310b08288da548b476b8072ee",
    "b63ee1ec-ccaa-4885-951b-6ad897ac9ddd:b7dc046ddeefd6589e46b3b9fb3bcbcf",
    "66b688a1-5461-495b-87d6-cf6df4890293:6f669c2eab5a50b6d83ac0af28dfb1dd",
    "8910668f-54fe-4644-b484-c9eb041576c3:cb1d42a754f25753688438cf6f85a52e",
    "5d343b30-cc2a-4b07-98ee-5adebd0b2bf7:c601b6d0ae67549a0a9d44e8542ff94a",
    "c693dd6a-8cb1-46e7-a186-c312fe516b09:2e6412cad48a29e4db9c746e742aa6e3",
    "1d11865e-547e-42f7-baa7-f4bc4f99fa3b:213e0e2c798a8b349ee53dc6f2d1f5f0",
    "dc578fc7-79a5-43ba-b835-e5c71b2f4664:53cdb0b823ed6a8c19a9858447710fa0",
    "a244e46d-dcae-4ed7-bc7c-b59923287334:275ab67b5f29f3e95fde850eb1e934da",
    "9b27d1f1-23bb-463a-811f-efee0721ee33:84455f2f01ac6d5b737a356606ee89ca",
    "ad113d79-df6d-4a75-8e6a-2c9eb6a8b7c0:71c906c5ea6b6e685c6817461304d8f3",
    "2edad100-b8f6-4fc0-928e-30173fea48b4:50518e25fc665f4c1ae42bdb00b470c2",
    "42459492-020a-4a4f-88a6-2b30b6ec399a:e7b44463bb754077dcbd21dd713ed3ac",
    "037aab38-f0c9-478e-b890-bf1ab91e7488:289ac2df661473213e4a691eac816aed",
    "2e4efe17-39fc-4884-99ab-c05f5ac09f78:30a0e201644e617887b0fb58ec8b05a0",
    "c22ae084-ea27-4ed8-bd4c-9d0d20c9a9dd:4b9f9e6c96bcf9e307a823908d664adb",
    "aec522a3-1c26-48c2-8d9c-aebe90f01f1e:a52688a9de174eb652d88f177f5fd9cb",
    "19702454-143a-420a-9932-66094966b4ab:15c7948a637a4646025b2cc44783d941",
    "be6e0fc7-dd19-4cd6-a0b6-5a02bdf71187:e9e304ac35bb5ab3c7b48e8d3f39bc8f",
    "56ad245f-8402-4b00-bfba-e423f5573e86:e8408092f4ec0144b524e81de8ece888",
    "32f7a470-8521-48b8-b0a1-58ae4215ca7d:a0162beea6bfe51f2e994f7a247d08c6",
    "65f2f2da-f1f0-4cc9-8387-8ff7bcca0e9e:eea2098bc6cd76e6edb411c31fe77d9a",
    "fecf4b8e-62cd-49ff-9c2d-bad9124fe568:0f7ebcafd57faee95cc657878bfa5357",
    "bd98bf1f-362f-485e-8e93-7a45252008ae:d6c4a67ff47ee164c13b4cf9b9f8827b",
    "bcbb989b-a9b5-4710-b32f-0ced63d25ff6:8ffd52428ad3b6af6afa741e16c5eb11",
    "60954e68-1093-4900-91a0-61f2ef64681e:09e7a4abad3e75bf8d8c06e4471b9062",
    "4fffead3-352b-4d22-9014-e8d7d7ad5da5:4cf1c87a7f599f2a3387600efb545fdf",
    "deb25f2b-b49b-4d93-b4dc-e8da2c06bfae:8c8b7e6a7600d302fb027014133e0898",
    "dbcae110-8117-4cea-a1c9-e02b23628936:bc239b492d1b0fa049441beab8ff7983",
    "3a3be279-3d26-4ed6-b001-136b1fc2690b:43e6e8d2c08679e4d6539ac80020f2f3",
    "5d2cc275-87ed-4754-aaac-2e1e081225c1:0e6f4dc5f711637e2f96fbd19f63f6fc",
    "c7a583c8-223b-4fad-9fba-60814e41d642:0fdda953b3d9909a751514524276142d",
    "2b4b9dca-905d-4ebd-94c8-c9069ade1e68:57f572e95269605448133118e521ed21",
    "f7395b76-16e8-45e7-9074-e96c959d35bd:0205401819fca4aaac28dd85978330bf",
    "5e03a844-4385-4264-a414-bcaf7c98b181:13ba343aaaff5ff2f2078906c83a1844",
    "7baceaf9-8651-4d32-bc27-f34c4606a365:102bc503c985b11b193405bbefe4197e",
    "e5179d87-c760-44b9-b69e-0f65e6eea253:60b36cd228712abf7ab3f5225403f070",
    "1aad8e57-3bbf-4781-8c6f-7662075504a8:e468c5dcb2b28d85a38825f9c54cc86b",
    "406b8458-402c-4412-b976-6d229380939c:f703928c5a4ef9e7bc1cdd8a83030296",
    "982f945f-2b22-4a58-a4d9-9a94bdc32056:342b3f6081991b354be9a110d38c7084",
    "e70aad16-a61c-4c0b-a171-0d4cd8ec33cd:d1b7160174de7b93f4d176ccedc12661",
    "542cb60b-c20d-45b7-bd97-b2535363d184:330c36936b21ceb8cb13aa3d657b1cb5",
    "e4d1374f-a805-4da7-a2f1-b7ace2332bac:085ff83738c6d57a391ed7e08ee06dc4",
    "2f0aa073-57d2-46de-9cb6-52e3befc9c63:218cbaca09a24adcf69c28c151a486de",
    "85649d41-dd49-4c86-9669-d9aeb3ee8f55:f1b6a7862bed6d5bd0ec66df74be71f1",
    "87c84332-6401-44f3-9308-d81168ebabae:a8269c691786a498b0b114117e886dc6",
    "fd31e0ac-350a-44ec-8000-a43885147fff:eec85e7d9f8a8c615d8fb92d0b94b7e9",
    "821a1aa5-b6ae-417b-ba1d-df08e086b9b2:03f1fb3afcb80d41e08051a7d7df9bbb",
    "56faff90-f47c-45ab-bbd3-b3c3f6aae4ea:72eb5a1222f6b6ae0678d518f057b216",
    "084c4027-e403-4250-858b-80d1a1c7ad88:e1f3bb7cd07a113e7bf1cc5ee8c351d1",
    "0284145d-a1fa-4fb9-a845-8e99f73e36b7:5b25caf3e5ff7ea33c5cd20f9a76acb0",
    "4e17f079-e657-4386-8a3b-b4b3b7ab611c:39689bc2325c4f7ed82b547a0c156557",
    "601b748d-ec22-4519-a0d8-4e600f288f50:9b2d98c64833ce5c59dda9cec18eb7ae",
    "35729a46-67b0-49b5-a372-3707650de05b:63743728bc6c9cd1895c9093bb1ddec4",
    "474b50a4-7f3c-4fc2-87b1-3d4d7b86ce44:7986260f5d951c5ce0d81be411fab889",
    "200591b0-0a39-4de7-bb3d-be96a328dba4:772e266a2f9a65ce098137ee3e3c596c",
    "3b032203-bf8d-413f-9093-2f10fcf8e1f6:0c8ee8a54e24e48f9c6dc34b67190268",
    "29912458-ef6d-4d76-b605-48eabf911fd8:6b6e3ea3317195509a59ab0134dcde5b",
    "ba129523-f437-49c4-ab2e-8399fd4b2f1b:016fca0a8d37b5c2bbcc4134e106c988",
    "e9c01a4f-35d3-4c3d-826d-30dca8953302:ac88335645a0a160d2a8fb581e47b2ab",
    "60c4aed0-3ec3-4beb-9fc0-79eef29d5b05:b99b33642283eb4c230be1f0951ebec8",
    "d252a675-73ae-409b-9c92-2e0a2a7c7b12:89ebdf3065262a722c24d1c77e626fee",
    "6e3495dc-ba8f-40f3-9fdb-af9db3618884:ae91b52cb001bba91a0d1cd7532deb92",
    "9d68c879-0a95-4697-9bdd-823996692d09:01f6a83d902db010a319ed13a132432a",
    "4394497e-859d-4368-902f-578d93a578ec:e36dfbeb80d157d57c8b7d9957ae946a"
]

# 图像生成模型列表
FAL_AI_MODELS = [
    {
        "id": "fal-ai/flux-pro/v1.1-ultra",
        "name": "Flux Pro Ultra (高质量)",
        "description": "Flux Pro Ultra模型，提供高质量图像生成"
    },
    {
        "id": "fal-ai/flux-pro/v1",
        "name": "Flux Pro (平衡)",
        "description": "Flux Pro标准模型，平衡速度和质量"
    },
    {
        "id": "fal-ai/flux-lite/v1",
        "name": "Flux Lite (快速)",
        "description": "Flux Lite轻量级模型，更快的生成速度"
    },
    {
        "id": "fal-ai/sdxl-lightning/v1-fast",
        "name": "SDXL Lightning (极速)",
        "description": "SDXL Lightning模型，生成速度极快"
    },
    {
        "id": "fal-ai/stable-diffusion-3-medium/gen",
        "name": "SD3 Medium (最新)",
        "description": "Stable Diffusion 3.0 Medium模型，最新技术"
    }
]

# 随机选择一个API密钥
def get_random_api_key():
    return random.choice(FAL_API_KEYS)

# 有道翻译API
def youdao_translate(text, from_lang='zh-CHS', to_lang='en'):
    """使用有道翻译API进行翻译"""
    try:
        # 有道翻译API密钥
        app_id = '7dc69120250c4def'
        app_key = 'jZzqwQ6VAqKnx9AsUKNtzDcpE2MbonH2'
        
        # 如果没有有道翻译API密钥，直接返回原文
        if app_id == '您的有道翻译应用ID' or app_key == '您的有道翻译密钥':
            return text
            
        salt = str(uuid.uuid1())
        timestamp = str(int(time.time()))
        input_text = text
        if len(input_text) > 20:
            input_len = len(input_text)
            input_text = input_text[:10] + str(input_len) + input_text[input_len - 10:]
            
        sign_str = app_id + input_text + salt + timestamp + app_key
        sign = hashlib.sha256(sign_str.encode()).hexdigest()
        
        url = 'https://openapi.youdao.com/api'
        params = {
            'q': text,
            'from': from_lang,
            'to': to_lang,
            'appKey': app_id,
            'salt': salt,
            'sign': sign,
            'signType': 'v3',
            'curtime': timestamp
        }
        
        response = requests.get(url, params=params)
        result = response.json()
        
        if 'translation' in result and len(result['translation']) > 0:
            return result['translation'][0]
        else:
            # 如果API返回错误，返回原文
            return text
    except Exception as e:
        print(f"有道翻译错误: {str(e)}")
        # 出错时返回原文
        return text

# 翻译函数
def translate_text(text, from_lang='zh-CHS', to_lang='en'):
    """翻译文本"""
    return youdao_translate(text, from_lang, to_lang)

# 生成图像的工作线程
class ImageGeneratorThread(QThread):
    finished = Signal(str, bytes)  # 修改为同时返回URL和图像数据
    error = Signal(str)
    progress = Signal(int)
    
    def __init__(self, model_id, prompt, image_size, steps, guidance):
        super().__init__()
        self.model_id = model_id
        self.prompt = prompt
        self.image_size = image_size
        self.steps = steps
        self.guidance = guidance
    
    def run(self):
        try:
            # 随机选择一个API密钥并设置环境变量
            os.environ["FAL_KEY"] = get_random_api_key()
            
            self.progress.emit(10)
            
            # 准备参数，根据不同模型调整参数格式
            if "lightning" in self.model_id or "stable-diffusion-3" in self.model_id:
                # SDXL Lightning 或 SD3 模型使用不同的参数格式
                arguments = {
                    "prompt": self.prompt,
                    "image_width": 1024 if self.image_size == "landscape" else 768, 
                    "image_height": 1024 if self.image_size == "portrait" else 768,
                }
            else:
                # 其他Flux模型使用标准参数格式
                arguments = {
                    "prompt": self.prompt,
                    "image_size": self.image_size,
                    "num_inference_steps": self.steps,
                    "guidance_scale": self.guidance
                }
            
            response = fal_client.run(
                self.model_id,
                arguments=arguments
            )
            self.progress.emit(80)
            
            # 获取图像URL
            if "lightning" in self.model_id or "stable-diffusion-3" in self.model_id:
                image_url = response["image"]["url"]
            else:
                image_url = response["images"][0]["url"]
            
            # 下载图像数据
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                self.progress.emit(100)
                self.finished.emit(image_url, img_response.content)
            else:
                # 如果下载失败，尝试使用另一个API密钥
                os.environ["FAL_KEY"] = get_random_api_key()
                retry_response = requests.get(image_url)
                if retry_response.status_code == 200:
                    self.progress.emit(100)
                    self.finished.emit(image_url, retry_response.content)
                else:
                    self.error.emit(f"下载图像失败: HTTP {img_response.status_code}")
                
        except Exception as e:
            # 如果出错，尝试使用另一个API密钥重试一次
            try:
                os.environ["FAL_KEY"] = get_random_api_key()
                self.progress.emit(10)
                
                # 重试时重新准备参数
                if "lightning" in self.model_id or "stable-diffusion-3" in self.model_id:
                    arguments = {
                        "prompt": self.prompt,
                        "image_width": 1024 if self.image_size == "landscape" else 768, 
                        "image_height": 1024 if self.image_size == "portrait" else 768,
                    }
                else:
                    arguments = {
                        "prompt": self.prompt,
                        "image_size": self.image_size,
                        "num_inference_steps": self.steps,
                        "guidance_scale": self.guidance
                    }
                
                response = fal_client.run(
                    self.model_id,
                    arguments=arguments
                )
                self.progress.emit(80)
                
                # 获取图像URL
                if "lightning" in self.model_id or "stable-diffusion-3" in self.model_id:
                    image_url = response["image"]["url"]
                else:
                    image_url = response["images"][0]["url"]
                
                # 下载图像数据
                img_response = requests.get(image_url)
                if img_response.status_code == 200:
                    self.progress.emit(100)
                    self.finished.emit(image_url, img_response.content)
                else:
                    self.error.emit(f"下载图像失败: HTTP {img_response.status_code}")
            except Exception as retry_error:
                # 如果重试也失败，返回原始错误
                self.error.emit(f"生成图像失败: {str(e)}")

# 下载图像的工作线程
class ImageDownloadThread(QThread):
    finished = Signal(str, bytes)
    error = Signal(str)
    
    def __init__(self, url, prompt):
        super().__init__()
        self.url = url
        self.prompt = prompt
    
    def run(self):
        try:
            response = requests.get(self.url)
            if response.status_code == 200:
                self.finished.emit(self.prompt, response.content)
            else:
                self.error.emit(f"下载失败: HTTP {response.status_code}")
        except Exception as e:
            self.error.emit(f"下载错误: {str(e)}")

# 历史记录项目类
class HistoryItem:
    def __init__(self, prompt, translated_prompt, image_url, image_data=None, timestamp=None):
        self.prompt = prompt
        self.translated_prompt = translated_prompt
        self.image_url = image_url
        self.image_data = image_data
        self.timestamp = timestamp or QDateTime.currentDateTime()
    
    def __str__(self):
        return f"{self.timestamp.toString('yyyy-MM-dd HH:mm:ss')} - {self.prompt}"

# 主窗口类
class ImageGeneratorApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("AI 图像生成器")
        
        # 设置窗口初始大小为屏幕大小的70%
        desktop = QApplication.primaryScreen().availableGeometry()
        self.setGeometry(100, 100, int(desktop.width() * 0.7), int(desktop.height() * 0.7))
        
        # 设置全局字体
        self.font = QFont("微软雅黑", 10)
        QApplication.setFont(self.font)
        
        # 设置应用程序样式表
        self.setStyleSheet("""
            QMainWindow, QWidget {
                background-color: #2d2d30;
                color: #ffffff;
                font-family: '微软雅黑';
            }
            QLabel {
                color: #ffffff;
            }
            QLineEdit, QComboBox, QSpinBox, QTextEdit {
                padding: 8px;
                border-radius: 5px;
                border: 1px solid #3c3c3c;
                background-color: #1e1e1e;
                color: #ffffff;
                selection-background-color: #264f78;
            }
            QLineEdit:focus, QComboBox:focus, QSpinBox:focus, QTextEdit:focus {
                border: 1px solid #4a86e8;
            }
            QPushButton {
                background-color: #4a86e8;
                color: #ffffff;
                padding: 8px 16px;
                border: none;
                border-radius: 5px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #5a96f8;
            }
            QPushButton:pressed {
                background-color: #3a76d8;
            }
            QPushButton:disabled {
                background-color: #666666;
                color: #bbbbbb;
            }
            QFrame {
                border-radius: 5px;
                background-color: #333337;
                border: 1px solid #444444;
            }
            QProgressBar {
                border: 1px solid #3c3c3c;
                border-radius: 3px;
                text-align: center;
                background-color: #1e1e1e;
                color: #ffffff;
            }
            QProgressBar::chunk {
                background-color: #4a86e8;
                border-radius: 2px;
            }
            QComboBox QAbstractItemView {
                background-color: #2d2d30;
                border: 1px solid #3c3c3c;
                selection-background-color: #264f78;
            }
            QListWidget {
                border-radius: 5px;
                border: 1px solid #3c3c3c;
                background-color: #252526;
                color: #ffffff;
                outline: none;
            }
            QListWidget::item:selected {
                background-color: #264f78;
                color: #ffffff;
            }
            QTabWidget::pane {
                border: 1px solid #3c3c3c;
                border-radius: 5px;
                background-color: #252526;
            }
            QTabBar::tab {
                background-color: #2d2d30;
                color: #cccccc;
                border: 1px solid #3c3c3c;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                padding: 6px 12px;
            }
            QTabBar::tab:selected {
                background-color: #1e1e1e;
                color: #ffffff;
                border-bottom-color: #1e1e1e;
            }
            QScrollBar {
                background-color: #2d2d30;
                width: 10px;
                height: 10px;
            }
            QScrollBar::handle {
                background-color: #666666;
                border-radius: 2px;
                min-height: 20px;
                min-width: 20px;
            }
            QScrollBar::handle:hover {
                background-color: #777777;
            }
            QScrollBar::add-line, QScrollBar::sub-line {
                width: 0px;
                height: 0px;
            }
        """)
        
        self.current_image_url = None
        self.current_image_data = None
        self.current_prompt = None
        self.history = []
        
        # 创建防抖动定时器
        self.debounce_timer = QTimer()
        self.debounce_timer.setSingleShot(True)
        self.debounce_timer.timeout.connect(self.delayed_translate)
        
        # 窗口大小变化时重新调整图像
        self.resizeTimer = QTimer()
        self.resizeTimer.setSingleShot(True)
        self.resizeTimer.timeout.connect(self.on_resize_timeout)
        
        self.setup_ui()
        
        # 窗口显示后调整分割器比例和最大化窗口
        QTimer.singleShot(100, self.post_initialization)
    
    def post_initialization(self):
        """窗口显示后的初始化操作"""
        # 调整分割器比例
        self.adjust_splitter_ratio()
        # 最大化窗口
        self.showMaximized()
    
    def adjust_splitter_ratio(self):
        """调整分割器比例"""
        for splitter in self.findChildren(QSplitter):
            width = splitter.width()
            splitter.setSizes([int(width * 0.35), int(width * 0.65)])
    
    def resizeEvent(self, event):
        """窗口大小改变时触发"""
        super().resizeEvent(event)
        # 使用定时器延迟处理，避免频繁重绘
        self.resizeTimer.start(200)
        
        # 调整分割器比例
        QTimer.singleShot(50, self.adjust_splitter_ratio)
    
    def on_resize_timeout(self):
        """窗口调整大小后的处理"""
        # 如果有当前图像，重新调整大小
        if hasattr(self, 'current_image_data') and self.current_image_data:
            self.display_image(self.current_image_data)
    
    def setup_ui(self):
        # 创建主布局
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)
        
        # 标题标签
        title_label = QLabel("AI 图像生成器")
        title_label.setStyleSheet("font-size: 32px; font-weight: bold; color: #4a86e8; margin-bottom: 5px; font-family: '微软雅黑';")
        title_label.setAlignment(Qt.AlignCenter)
        title_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        main_layout.addWidget(title_label)
        
        # 副标题
        subtitle_label = QLabel("输入中文，自动翻译为英文生成精美图像")
        subtitle_label.setStyleSheet("font-size: 16px; color: #cccccc; margin-bottom: 15px; font-family: '微软雅黑';")
        subtitle_label.setAlignment(Qt.AlignCenter)
        subtitle_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        main_layout.addWidget(subtitle_label)
        
        # 创建分割器以放置左右两个面板
        splitter = QSplitter(Qt.Horizontal)
        splitter.setChildrenCollapsible(False)
        splitter.setHandleWidth(2)
        splitter.setStyleSheet("QSplitter::handle { background-color: #4a86e8; }")
        splitter.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        # 左侧面板 - 输入和控制
        left_panel = QWidget()
        left_panel.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(5, 5, 10, 5)
        left_layout.setSpacing(10)
        
        # 创建表单面板
        form_frame = QFrame()
        form_frame.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        form_layout = QVBoxLayout(form_frame)
        form_layout.setContentsMargins(15, 15, 15, 15)
        form_layout.setSpacing(10)
        
        # 提示词输入
        prompt_label = QLabel("请输入图像描述:")
        prompt_label.setStyleSheet("font-weight: bold; font-size: 16px; color: #4a86e8;")
        prompt_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        self.prompt_input = QTextEdit()
        self.prompt_input.setPlaceholderText("输入中文或英文描述...")
        self.prompt_input.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        form_layout.addWidget(prompt_label)
        form_layout.addWidget(self.prompt_input)
        
        # 翻译结果显示
        translation_label = QLabel("翻译结果 (将用于生成图像):")
        translation_label.setStyleSheet("font-weight: bold; font-size: 16px; color: #4a86e8;")
        translation_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        self.translation_result = QTextEdit()
        self.translation_result.setReadOnly(True)
        self.translation_result.setStyleSheet("background-color: #1a1a1a; color: #a9f5bc; font-family: 'Consolas', '微软雅黑'; font-size: 15px;")
        self.translation_result.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        form_layout.addWidget(translation_label)
        form_layout.addWidget(self.translation_result)
        
        # 参数面板
        params_frame = QFrame()
        params_frame.setStyleSheet("background-color: #282828; padding: 10px; border-radius: 10px;")
        params_frame.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        params_layout = QVBoxLayout(params_frame)
        params_layout.setSpacing(10)
        
        # 添加模型选择下拉框
        model_layout = QHBoxLayout()
        model_label = QLabel("AI模型:")
        model_label.setStyleSheet("font-weight: bold; font-size: 15px; color: #4a86e8;")
        model_label.setSizePolicy(QSizePolicy.Minimum, QSizePolicy.Minimum)
        self.model_combo = QComboBox()
        
        # 添加模型选项
        for model in FAL_AI_MODELS:
            self.model_combo.addItem(model["name"])
        
        self.model_combo.setStyleSheet("color: #ffffff; font-size: 14px;")
        self.model_combo.setCurrentIndex(0)  # 默认选择第一个模型
        self.model_combo.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        
        # 添加模型描述提示工具
        model_tip = QLabel("ℹ️")
        model_tip.setToolTip("不同模型各有特点:\n• 高质量模型 - 最佳图像质量，但速度较慢\n• 平衡模型 - 质量和速度的平衡\n• 快速模型 - 生成速度更快，质量略低\n• 极速模型 - 2-3秒即可生成，但细节较少\n• 最新模型 - 使用最新SD3技术")
        model_tip.setCursor(Qt.WhatsThisCursor)
        model_tip.setStyleSheet("color: #4a86e8; font-size: 18px;")
        model_tip.setSizePolicy(QSizePolicy.Minimum, QSizePolicy.Minimum)
        
        model_layout.addWidget(model_label)
        model_layout.addWidget(self.model_combo, 1)
        model_layout.addWidget(model_tip)
        params_layout.addLayout(model_layout)
        
        # 图像参数区布局
        image_params_layout = QHBoxLayout()
        image_params_layout.setSpacing(10)
        
        # 图像尺寸选择
        size_layout = QVBoxLayout()
        size_label = QLabel("图像尺寸:")
        size_label.setStyleSheet("font-weight: bold; font-size: 15px; color: #4a86e8;")
        size_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        self.size_combo = QComboBox()
        self.size_combo.addItems(["square (方形)", "portrait (竖向)", "landscape (横向)"])
        self.size_combo.setStyleSheet("color: #ffffff; font-size: 14px;")
        self.size_combo.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        size_layout.addWidget(size_label)
        size_layout.addWidget(self.size_combo)
        image_params_layout.addLayout(size_layout)
        
        # 步数和引导值
        steps_layout = QVBoxLayout()
        steps_label = QLabel("步数 (精细度):")
        steps_label.setStyleSheet("font-weight: bold; font-size: 15px; color: #4a86e8;")
        steps_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        self.steps_spin = QSpinBox()
        self.steps_spin.setRange(10, 50)
        self.steps_spin.setValue(30)
        self.steps_spin.setStyleSheet("color: #ffffff; font-size: 14px;")
        self.steps_spin.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        steps_layout.addWidget(steps_label)
        steps_layout.addWidget(self.steps_spin)
        image_params_layout.addLayout(steps_layout)
        
        guidance_layout = QVBoxLayout()
        guidance_label = QLabel("引导值 (创意度):")
        guidance_label.setStyleSheet("font-weight: bold; font-size: 15px; color: #4a86e8;")
        guidance_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        self.guidance_spin = QSpinBox()
        self.guidance_spin.setRange(5, 20)
        self.guidance_spin.setSingleStep(1)
        self.guidance_spin.setValue(7)
        self.guidance_spin.setStyleSheet("color: #ffffff; font-size: 14px;")
        self.guidance_spin.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        guidance_layout.addWidget(guidance_label)
        guidance_layout.addWidget(self.guidance_spin)
        image_params_layout.addLayout(guidance_layout)
        
        params_layout.addLayout(image_params_layout)
        form_layout.addWidget(params_frame)
        
        # 进度条
        self.progress_bar = QProgressBar()
        self.progress_bar.setMaximum(100)
        self.progress_bar.setValue(0)
        self.progress_bar.setTextVisible(True)
        self.progress_bar.setVisible(False)
        self.progress_bar.setMinimumHeight(25)
        self.progress_bar.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        form_layout.addWidget(self.progress_bar)
        
        # 按钮
        buttons_layout = QHBoxLayout()
        buttons_layout.setSpacing(10)
        
        self.translate_btn = QPushButton("翻译")
        self.translate_btn.setIcon(QIcon(""))
        self.translate_btn.clicked.connect(self.translate_prompt)
        self.translate_btn.setMinimumHeight(40)
        self.translate_btn.setCursor(Qt.PointingHandCursor)
        self.translate_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        
        self.generate_btn = QPushButton("生成图像")
        self.generate_btn.setIcon(QIcon(""))
        self.generate_btn.clicked.connect(self.generate_image)
        self.generate_btn.setMinimumHeight(40)
        self.generate_btn.setCursor(Qt.PointingHandCursor)
        self.generate_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        self.generate_btn.setStyleSheet("""
            QPushButton {
                background-color: #00a67d;
                font-size: 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #00b78d;
            }
            QPushButton:pressed {
                background-color: #00956d;
            }
        """)
        
        buttons_layout.addWidget(self.translate_btn)
        buttons_layout.addWidget(self.generate_btn)
        form_layout.addLayout(buttons_layout)
        
        # 保存按钮
        self.save_btn = QPushButton("保存图像到本地")
        self.save_btn.setIcon(QIcon(""))
        self.save_btn.clicked.connect(self.save_image)
        self.save_btn.setMinimumHeight(40)
        self.save_btn.setEnabled(False)
        self.save_btn.setCursor(Qt.PointingHandCursor)
        self.save_btn.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        self.save_btn.setStyleSheet("""
            QPushButton {
                background-color: #ff9800;
                font-size: 16px;
            }
            QPushButton:hover {
                background-color: #ffab33;
            }
            QPushButton:pressed {
                background-color: #e68900;
            }
            QPushButton:disabled {
                background-color: #666666;
                color: #bbbbbb;
            }
        """)
        form_layout.addWidget(self.save_btn)
        
        # 提示信息
        tip_label = QLabel("提示: 描述越具体，生成的图像效果越好")
        tip_label.setStyleSheet("color: #aaaaaa; font-style: italic; font-size: 14px;")
        tip_label.setAlignment(Qt.AlignCenter)
        tip_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        form_layout.addWidget(tip_label)
        
        left_layout.addWidget(form_frame)
        
        # 右侧面板 - 图像显示和历史记录
        right_panel = QWidget()
        right_panel.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(10, 5, 5, 5)
        right_layout.setSpacing(10)
        
        # 添加标签页
        tab_widget = QTabWidget()
        tab_widget.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        tab_widget.setStyleSheet("""
            QTabWidget::tab-bar {
                alignment: center;
            }
        """)
        
        # 图像显示页
        image_tab = QWidget()
        image_tab.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        image_tab.setStyleSheet("background-color: #252526;")
        image_layout = QVBoxLayout(image_tab)
        image_layout.setContentsMargins(10, 10, 10, 10)
        image_layout.setSpacing(10)
        
        # 图像显示区域标签
        image_title = QLabel("生成的图像")
        image_title.setStyleSheet("font-weight: bold; font-size: 18px; color: #4a86e8;")
        image_title.setAlignment(Qt.AlignCenter)
        image_title.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        image_layout.addWidget(image_title)
        
        # 图像显示区域
        self.image_scroll_area = QScrollArea()
        self.image_scroll_area.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.image_scroll_area.setWidgetResizable(True)
        self.image_scroll_area.setAlignment(Qt.AlignCenter)
        self.image_scroll_area.setStyleSheet("background-color: #1e1e1e; border-radius: 10px; border: 1px solid #3c3c3c;")
        
        self.image_container = QWidget()
        self.image_container.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.image_container_layout = QVBoxLayout(self.image_container)
        self.image_container_layout.setAlignment(Qt.AlignCenter)
        self.image_container_layout.setContentsMargins(10, 10, 10, 10)
        
        self.image_label = QLabel("还没有生成图像")
        self.image_label.setAlignment(Qt.AlignCenter)
        self.image_label.setStyleSheet("color: #bbbbbb; font-size: 18px; background-color: #252526; padding: 50px; border-radius: 10px;")
        self.image_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        self.image_container_layout.addWidget(self.image_label)
        self.image_scroll_area.setWidget(self.image_container)
        
        image_layout.addWidget(self.image_scroll_area)
        
        # 历史记录页
        history_tab = QWidget()
        history_tab.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        history_tab.setStyleSheet("background-color: #252526;")
        history_layout = QVBoxLayout(history_tab)
        history_layout.setContentsMargins(10, 10, 10, 10)
        history_layout.setSpacing(10)
        
        history_label = QLabel("历史记录")
        history_label.setStyleSheet("font-weight: bold; font-size: 18px; color: #4a86e8;")
        history_label.setAlignment(Qt.AlignCenter)
        history_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Minimum)
        history_layout.addWidget(history_label)
        
        self.history_list = QListWidget()
        self.history_list.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        self.history_list.itemClicked.connect(self.on_history_item_clicked)
        self.history_list.setStyleSheet("font-size: 15px;")
        history_layout.addWidget(self.history_list)
        
        # 添加标签页到标签页控件
        tab_widget.addTab(image_tab, "预览图像")
        tab_widget.addTab(history_tab, "历史记录")
        
        right_layout.addWidget(tab_widget)
        
        # 添加面板到分割器
        splitter.addWidget(left_panel)
        splitter.addWidget(right_panel)
        
        # 设置拉伸因子使分割器比例在调整窗口大小时保持一致
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 2)
        
        main_layout.addWidget(splitter)
        
        # 设置主部件
        central_widget = QWidget()
        central_widget.setLayout(main_layout)
        self.setCentralWidget(central_widget)
        
        # 连接信号 - 使用防抖动机制优化输入体验
        self.prompt_input.textChanged.connect(self.auto_translate)
        
        # 优化文本编辑框性能
        self.prompt_input.setUpdatesEnabled(False)
        self.prompt_input.viewport().setUpdatesEnabled(False)
        QTimer.singleShot(0, lambda: self.prompt_input.setUpdatesEnabled(True))
        QTimer.singleShot(0, lambda: self.prompt_input.viewport().setUpdatesEnabled(True))
        
        # 禁用文本框的实时拼写检查和格式化，提高性能
        self.prompt_input.setAcceptRichText(False)
        
        # 为翻译结果文本框也优化性能
        self.translation_result.setUpdatesEnabled(False)
        self.translation_result.viewport().setUpdatesEnabled(False)
        QTimer.singleShot(0, lambda: self.translation_result.setUpdatesEnabled(True))
        QTimer.singleShot(0, lambda: self.translation_result.viewport().setUpdatesEnabled(True))
        self.translation_result.setAcceptRichText(False)
    
    def auto_translate(self):
        """当用户输入时，启动防抖动定时器"""
        text = self.prompt_input.toPlainText()
        if text and self.is_chinese(text):
            # 取消之前的定时器，重新开始计时
            self.debounce_timer.stop()
            # 设置500ms的延迟，避免频繁翻译
            self.debounce_timer.start(500)
    
    def delayed_translate(self):
        """延迟执行翻译，避免频繁调用翻译API"""
        self.translate_prompt()
    
    def is_chinese(self, text):
        """检测文本是否包含中文字符"""
        for char in text:
            if '\u4e00' <= char <= '\u9fff':
                return True
        return False
    
    def translate_prompt(self):
        """翻译提示词"""
        text = self.prompt_input.toPlainText().strip()
        if not text:
            return
            
        try:
            # 如果文本包含中文，则翻译成英文
            if self.is_chinese(text):
                translated = translate_text(text)
                self.translation_result.setPlainText(translated)
            else:
                # 如果是英文，直接使用
                self.translation_result.setPlainText(text)
        except Exception as e:
            QMessageBox.warning(self, "翻译失败", f"翻译失败: {str(e)}")
    
    def generate_image(self):
        """生成图像"""
        # 如果翻译结果为空，先尝试翻译
        if not self.translation_result.toPlainText() and self.prompt_input.toPlainText():
            self.translate_prompt()
            
        prompt = self.translation_result.toPlainText() or self.prompt_input.toPlainText()
        if not prompt:
            QMessageBox.warning(self, "警告", "请输入描述！")
            return
            
        # 准备参数
        selected_model_index = self.model_combo.currentIndex()
        model_id = FAL_AI_MODELS[selected_model_index]["id"]
        
        image_size = self.size_combo.currentText().split(" ")[0]  # 提取英文部分
        steps = self.steps_spin.value()
        guidance = self.guidance_spin.value()
        
        # 禁用UI
        self.prompt_input.setEnabled(False)
        self.generate_btn.setEnabled(False)
        self.translate_btn.setEnabled(False)
        self.save_btn.setEnabled(False)
        
        # 显示进度条
        self.progress_bar.setValue(0)
        self.progress_bar.setVisible(True)
        
        # 储存当前提示词
        self.current_prompt = self.prompt_input.toPlainText()
        
        # 显示加载提示
        model_name = self.model_combo.currentText().split(" ")[0]
        self.image_label.setText(f"正在使用{model_name}模型生成图像，请稍候...")
        self.image_label.setStyleSheet("color: #666; font-size: 16px; background-color: #1a1a1a; padding: 50px; border-radius: 8px;")
        
        # 创建并启动工作线程
        self.worker = ImageGeneratorThread(model_id, prompt, image_size, steps, guidance)
        self.worker.finished.connect(self.on_generation_finished)
        self.worker.error.connect(self.on_generation_error)
        self.worker.progress.connect(self.progress_bar.setValue)
        self.worker.start()
    
    def on_generation_finished(self, url, image_data):
        """图像生成完成的回调"""
        # 恢复UI
        self.prompt_input.setEnabled(True)
        self.generate_btn.setEnabled(True)
        self.translate_btn.setEnabled(True)
        self.save_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        
        # 存储当前图像URL和数据
        self.current_image_url = url
        self.current_image_data = image_data
        
        # 添加到历史记录
        history_item = HistoryItem(
            self.current_prompt,
            self.translation_result.toPlainText(),
            url,
            image_data
        )
        self.history.append(history_item)
        self.history_list.addItem(str(history_item))
        
        # 在图像标签中显示图像
        self.display_image(image_data)
    
    def display_image(self, image_data):
        """在界面上显示图像"""
        try:
            # 从字节数据创建QPixmap
            pixmap = QPixmap()
            pixmap.loadFromData(QByteArray(image_data))
            
            # 计算可用显示区域的大小
            available_width = self.image_scroll_area.width() - 60
            available_height = self.image_scroll_area.height() - 60
            
            # 确保至少有最小尺寸
            if available_width < 400:
                available_width = 400
            if available_height < 400:
                available_height = 400
            
            # 保持纵横比例缩放图像
            scaled_pixmap = pixmap.scaled(
                available_width, 
                available_height, 
                Qt.KeepAspectRatio, 
                Qt.SmoothTransformation
            )
            
            # 设置图像标签
            self.image_label.setPixmap(scaled_pixmap)
            self.image_label.setStyleSheet("background-color: #1a1a1a; padding: 10px; border-radius: 10px; border: 1px solid #444444;")
            self.image_label.setMinimumSize(scaled_pixmap.size() + QSize(20, 20))
            
        except Exception as e:
            self.image_label.setText(f"显示图像失败: {str(e)}")
            self.image_label.setStyleSheet("color: #ff6666; font-size: 16px; background-color: #331a1a; padding: 50px; border-radius: 8px;")
    
    def on_generation_error(self, error_msg):
        """图像生成错误的回调"""
        # 恢复UI
        self.prompt_input.setEnabled(True)
        self.generate_btn.setEnabled(True)
        self.translate_btn.setEnabled(True)
        self.progress_bar.setVisible(False)
        
        # 显示错误
        QMessageBox.critical(self, "错误", f"生成图像失败: {error_msg}")
        self.image_label.setText("生成图像失败!")
        self.image_label.setStyleSheet("color: #ff6666; font-size: 18px; font-weight: bold; background-color: #331a1a; padding: 50px; border-radius: 10px;")
    
    def save_image(self):
        """保存图像到本地"""
        if not self.current_image_data:
            QMessageBox.warning(self, "警告", "没有可保存的图像！")
            return
        
        # 准备默认文件名
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        default_name = f"AI_Image_{timestamp}.png"
        
        # 打开文件对话框
        file_path, _ = QFileDialog.getSaveFileName(
            self,
            "保存图像",
            default_name,
            "图像文件 (*.png *.jpg *.jpeg)"
        )
        
        if not file_path:
            return  # 用户取消
        
        try:
            # 直接保存图像数据
            with open(file_path, 'wb') as f:
                f.write(self.current_image_data)
            
            # 提示成功
            reply = QMessageBox.information(
                self,
                "保存成功",
                f"图像已保存到: {file_path}\n\n是否打开文件位置？",
                QMessageBox.Yes | QMessageBox.No
            )
            
            if reply == QMessageBox.Yes:
                # 打开文件所在目录
                QDesktopServices.openUrl(QUrl.fromLocalFile(os.path.dirname(file_path)))
                
        except Exception as e:
            QMessageBox.critical(self, "保存失败", f"保存图像时出错: {str(e)}")
    
    def on_history_item_clicked(self, item):
        """历史记录项目被点击"""
        index = self.history_list.row(item)
        if 0 <= index < len(self.history):
            history_item = self.history[index]
            
            # 填充表单
            self.prompt_input.setPlainText(history_item.prompt)
            self.translation_result.setPlainText(history_item.translated_prompt)
            
            # 更新当前URL和数据
            self.current_image_url = history_item.image_url
            self.current_image_data = history_item.image_data
            
            # 显示图像
            if history_item.image_data:
                self.display_image(history_item.image_data)
            
            # 启用保存按钮
            self.save_btn.setEnabled(True)


# 运行程序
if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # 设置应用程序全局样式
    app.setStyle("Fusion")
    
    # 创建暗色调色板
    dark_palette = QPalette()
    dark_palette.setColor(QPalette.Window, QColor(45, 45, 48))
    dark_palette.setColor(QPalette.WindowText, QColor(255, 255, 255))
    dark_palette.setColor(QPalette.Base, QColor(30, 30, 30))
    dark_palette.setColor(QPalette.AlternateBase, QColor(53, 53, 53))
    dark_palette.setColor(QPalette.ToolTipBase, QColor(255, 255, 255))
    dark_palette.setColor(QPalette.ToolTipText, QColor(255, 255, 255))
    dark_palette.setColor(QPalette.Text, QColor(255, 255, 255))
    dark_palette.setColor(QPalette.Button, QColor(53, 53, 53))
    dark_palette.setColor(QPalette.ButtonText, QColor(255, 255, 255))
    dark_palette.setColor(QPalette.BrightText, QColor(255, 0, 0))
    dark_palette.setColor(QPalette.Link, QColor(42, 130, 218))
    dark_palette.setColor(QPalette.Highlight, QColor(42, 130, 218))
    dark_palette.setColor(QPalette.HighlightedText, QColor(255, 255, 255))
    dark_palette.setColor(QPalette.Active, QPalette.Button, QColor(53, 53, 53))
    dark_palette.setColor(QPalette.Disabled, QPalette.ButtonText, QColor(120, 120, 120))
    dark_palette.setColor(QPalette.Disabled, QPalette.WindowText, QColor(120, 120, 120))
    dark_palette.setColor(QPalette.Disabled, QPalette.Text, QColor(120, 120, 120))
    dark_palette.setColor(QPalette.Disabled, QPalette.Light, QColor(53, 53, 53))
    
    # 应用暗色调色板
    app.setPalette(dark_palette)
    
    window = ImageGeneratorApp()
    window.show()
    sys.exit(app.exec())