from PIL import Image
import os

# 配置颜色和尺寸
ICON_COLOR = (66, 133, 244)  # 谷歌蓝色，可随意修改，如 (255, 100, 100) 是红色
SIZE_LIST = [16, 24, 32, 48, 128]  # 所有必需尺寸
OUTPUT_FOLDER = "images"  # 输出文件夹

# 创建文件夹（如果不存在）
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

# 生成每个尺寸的图标
for size in SIZE_LIST:
    img = Image.new('RGBA', (size, size), ICON_COLOR + (255,))
    img.save(os.path.join(OUTPUT_FOLDER, f'icon{size}.png'))

print(f"✅ 5个占位图标已生成在 '{OUTPUT_FOLDER}' 文件夹中！")