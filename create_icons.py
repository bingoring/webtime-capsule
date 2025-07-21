#!/usr/bin/env python3
"""
WebTime Capsule 아이콘 생성 스크립트
SVG 파일을 다양한 크기의 PNG 파일로 변환합니다.
"""

from PIL import Image, ImageDraw
import os

def create_icon(size):
    """지정된 크기의 아이콘을 생성합니다."""
    # 새 이미지 생성 (RGBA 모드로 투명 배경)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 중심점
    center = size // 2

    # 배경 원 그리기 (그라데이션 대신 단색 사용)
    radius = int(size * 0.45)
    draw.ellipse([center - radius, center - radius, center + radius, center + radius],
                 fill=(102, 126, 234, 255), outline=(255, 255, 255, 255), width=max(1, size // 32))

    # 캡슐 모양 그리기
    capsule_radius_x = int(size * 0.25)
    capsule_radius_y = int(size * 0.15)

    # 위쪽 타원
    draw.ellipse([center - capsule_radius_x, center - int(size * 0.25) - capsule_radius_y,
                  center + capsule_radius_x, center - int(size * 0.25) + capsule_radius_y],
                 fill=(255, 255, 255, 50), outline=(255, 255, 255, 100), width=max(1, size // 64))

    # 아래쪽 타원
    draw.ellipse([center - capsule_radius_x, center + int(size * 0.25) - capsule_radius_y,
                  center + capsule_radius_x, center + int(size * 0.25) + capsule_radius_y],
                 fill=(255, 255, 255, 30), outline=(255, 255, 255, 80), width=max(1, size // 64))

    # 중앙 시계 외곽
    clock_radius = int(size * 0.2)
    draw.ellipse([center - clock_radius, center - clock_radius, center + clock_radius, center + clock_radius],
                 fill=(240, 147, 251, 255), outline=(255, 255, 255, 255), width=max(1, size // 42))

    # 시계 내부
    inner_radius = int(size * 0.15)
    draw.ellipse([center - inner_radius, center - inner_radius, center + inner_radius, center + inner_radius],
                 fill=(255, 255, 255, 230), outline=(221, 221, 221, 255), width=max(1, size // 128))

    # 시계 바늘
    # 짧은 바늘 (시침)
    needle_length = int(size * 0.08)
    draw.line([center, center, center, center - needle_length],
              fill=(51, 51, 51, 255), width=max(1, size // 42))

    # 긴 바늘 (분침)
    needle_length = int(size * 0.11)
    draw.line([center, center, center + needle_length, center],
              fill=(51, 51, 51, 255), width=max(1, size // 64))

    # 중심점
    center_dot_radius = max(1, size // 42)
    draw.ellipse([center - center_dot_radius, center - center_dot_radius,
                  center + center_dot_radius, center + center_dot_radius],
                 fill=(51, 51, 51, 255))

    # 시계 눈금 (12, 3, 6, 9시 방향)
    tick_radius = max(1, size // 85)
    positions = [
        (center, center - inner_radius + tick_radius * 2),  # 12시
        (center + inner_radius - tick_radius * 2, center),  # 3시
        (center, center + inner_radius - tick_radius * 2),  # 6시
        (center - inner_radius + tick_radius * 2, center)   # 9시
    ]

    for x, y in positions:
        draw.ellipse([x - tick_radius, y - tick_radius, x + tick_radius, y + tick_radius],
                     fill=(102, 102, 102, 255))

    # 타임라인 점들 (모서리에)
    timeline_radius = max(1, size // 42)
    timeline_positions = [
        (int(size * 0.23), int(size * 0.23)),   # 좌상
        (int(size * 0.77), int(size * 0.23)),   # 우상
        (int(size * 0.23), int(size * 0.77)),   # 좌하
        (int(size * 0.77), int(size * 0.77))    # 우하
    ]

    opacities = [200, 150, 100, 180]
    for i, (x, y) in enumerate(timeline_positions):
        draw.ellipse([x - timeline_radius, y - timeline_radius,
                      x + timeline_radius, y + timeline_radius],
                     fill=(255, 255, 255, opacities[i]))

    return img

def main():
    """메인 함수: 각 크기별 아이콘을 생성합니다."""
    sizes = [16, 32, 64, 128]

    # icons 디렉터리가 없으면 생성
    if not os.path.exists('icons'):
        os.makedirs('icons')

    for size in sizes:
        print(f"Creating {size}x{size} icon...")
        icon = create_icon(size)
        icon.save(f'icons/icon-{size}.png')
        print(f"✓ Saved icons/icon-{size}.png")

    print("\n🎉 All icons created successfully!")
    print("Generated files:")
    for size in sizes:
        print(f"  - icons/icon-{size}.png")

if __name__ == "__main__":
    main()
