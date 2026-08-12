#!/usr/bin/env python3
"""
KronTech Icon & Wallpaper Generator
Gera ícones em preto, branco e cinza em todos os tamanhos,
mais wallpapers para área de trabalho.
"""

import cairosvg
import os
from PIL import Image, ImageDraw, ImageFilter
import io
import math

OUT = '/home/claude/krontech-icons'

# ─────────────────────────────────────────────────────────────
# SVG BASE DO ÍCONE
# ─────────────────────────────────────────────────────────────

def icon_svg(scheme, size=512):
    cfg = {
        'black': {
            'r1': '#1A1A1A', 'r1o': '0.7',
            'r2': '#111111', 'r2o': '0.45',
            'r3': '#0A0A0A', 'r3o': '0.3',
            'cf': '#F0F0F0', 'cb': '#0A0A0A', 'cbw': '1.4',
            'k':  '#0A0A0A', 'kw': '3',
            't':  '#1A1A1A', 'tw': '3',
            'sp': '#C8C8C8', 'so': '0.6',
        },
        'white': {
            'r1': '#E8E8E8', 'r1o': '0.7',
            'r2': '#D0D0D0', 'r2o': '0.45',
            'r3': '#F0F0F0', 'r3o': '0.3',
            'cf': '#181818', 'cb': '#F5F5F5', 'cbw': '1.4',
            'k':  '#FFFFFF', 'kw': '3',
            't':  '#E0E0E0', 'tw': '3',
            'sp': '#555555', 'so': '0.7',
        },
        'gray': {
            'r1': '#888888', 'r1o': '0.65',
            'r2': '#999999', 'r2o': '0.4',
            'r3': '#AAAAAA', 'r3o': '0.28',
            'cf': '#C8C8C8', 'cb': '#444444', 'cbw': '1.4',
            'k':  '#2A2A2A', 'kw': '3',
            't':  '#333333', 'tw': '3',
            'sp': '#999999', 'so': '0.6',
        },
    }
    c = cfg[scheme]

    return f'''<svg width="{size}" height="{size}" viewBox="0 0 190 190" xmlns="http://www.w3.org/2000/svg">

  <!-- Anéis orbitais externos -->
  <circle cx="95" cy="95" r="89"
    fill="none" stroke="{c['r1']}" stroke-width="0.9"
    stroke-dasharray="6 9" opacity="{c['r1o']}"/>

  <circle cx="95" cy="95" r="74"
    fill="none" stroke="{c['r2']}" stroke-width="0.75"
    stroke-dasharray="3 11" opacity="{c['r2o']}"/>

  <circle cx="95" cy="95" r="60"
    fill="none" stroke="{c['r3']}" stroke-width="0.6"
    stroke-dasharray="2 9" opacity="{c['r3o']}"/>

  <!-- Círculo principal -->
  <circle cx="95" cy="95" r="44"
    fill="{c['cf']}" stroke="{c['cb']}" stroke-width="{c['cbw']}"/>

  <!-- KT monograma -->
  <g stroke-linecap="round" stroke-linejoin="round" fill="none">

    <!-- K: vertical -->
    <line x1="76" y1="72" x2="76" y2="118"
      stroke="{c['k']}" stroke-width="{c['kw']}"/>
    <!-- K: braço superior -->
    <line x1="76" y1="95" x2="93" y2="72"
      stroke="{c['k']}" stroke-width="{c['kw']}"/>
    <!-- K: braço inferior -->
    <line x1="76" y1="95" x2="95" y2="118"
      stroke="{c['k']}" stroke-width="{c['kw']}"/>

    <!-- T: barra horizontal -->
    <line x1="103" y1="72" x2="122" y2="72"
      stroke="{c['t']}" stroke-width="{c['tw']}"/>
    <!-- T: vertical -->
    <line x1="112.5" y1="72" x2="112.5" y2="118"
      stroke="{c['t']}" stroke-width="{c['tw']}"/>

    <!-- Separador -->
    <line x1="98" y1="78" x2="98" y2="112"
      stroke="{c['sp']}" stroke-width="0.9" opacity="{c['so']}"/>

  </g>
</svg>'''


# ─────────────────────────────────────────────────────────────
# SVG SIMPLES (sem anéis — para tamanhos pequenos)
# ─────────────────────────────────────────────────────────────

def icon_svg_simple(scheme, size=32):
    cfg = {
        'black': {'cf': '#F0F0F0', 'cb': '#0A0A0A', 'k': '#0A0A0A', 't': '#1A1A1A', 'sp': '#C0C0C0'},
        'white': {'cf': '#181818', 'cb': '#F5F5F5', 'k': '#FFFFFF',  't': '#E0E0E0', 'sp': '#555555'},
        'gray':  {'cf': '#C8C8C8', 'cb': '#444444', 'k': '#2A2A2A', 't': '#333333', 'sp': '#999999'},
    }
    c = cfg[scheme]
    sw = 3.5  # stroke-width

    return f'''<svg width="{size}" height="{size}" viewBox="0 0 190 190" xmlns="http://www.w3.org/2000/svg">
  <circle cx="95" cy="95" r="86"
    fill="none" stroke="{c['cb']}" stroke-width="2" opacity="0.2"/>
  <circle cx="95" cy="95" r="44"
    fill="{c['cf']}" stroke="{c['cb']}" stroke-width="2"/>
  <g stroke-linecap="round" stroke-linejoin="round" fill="none">
    <line x1="76" y1="72" x2="76" y2="118" stroke="{c['k']}" stroke-width="{sw}"/>
    <line x1="76" y1="95" x2="93" y2="72"  stroke="{c['k']}" stroke-width="{sw}"/>
    <line x1="76" y1="95" x2="95" y2="118" stroke="{c['k']}" stroke-width="{sw}"/>
    <line x1="103" y1="72" x2="122" y2="72"    stroke="{c['t']}" stroke-width="{sw}"/>
    <line x1="112.5" y1="72" x2="112.5" y2="118" stroke="{c['t']}" stroke-width="{sw}"/>
  </g>
</svg>'''


# ─────────────────────────────────────────────────────────────
# GERAR ÍCONES PNG
# ─────────────────────────────────────────────────────────────

ICON_SIZES = [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024]

print('\n── ÍCONES ─────────────────────────────────')
for scheme in ['black', 'white', 'gray']:
    for size in ICON_SIZES:
        use_simple = size <= 32
        svg_str = icon_svg_simple(scheme, size) if use_simple else icon_svg(scheme, size)
        
        png_data = cairosvg.svg2png(
            bytestring=svg_str.encode(),
            output_width=size,
            output_height=size,
            background_color='transparent'
        )
        
        path = f'{OUT}/icons/{scheme}/krontech_icon_{size}x{size}.png'
        with open(path, 'wb') as f:
            f.write(png_data)
        
        print(f'  ✓ [{scheme:5}] {size}x{size}')

print(f'\n  Total: {len(ICON_SIZES) * 3} ícones gerados')


# ─────────────────────────────────────────────────────────────
# SVG WALLPAPER
# ─────────────────────────────────────────────────────────────

def wallpaper_svg(scheme, w, h):
    cfgs = {
        'black': {
            'bg': '#0E0E0E', 'bg2': '#141414',
            'icon': 'white',
            'name_col': '#F2F2F2', 'name_em': '#F2F2F2',
            'tag_col': '#444444',
            'ver_col': '#2A2A2A',
            'line': '#2A2A2A',
            'dot': '#FF6B2B',  # pequeno acento laranja nos orbs
            'grid': '#1A1A1A',
        },
        'white': {
            'bg': '#F0F0F0', 'bg2': '#E8E8E8',
            'icon': 'black',
            'name_col': '#111111', 'name_em': '#111111',
            'tag_col': '#AAAAAA',
            'ver_col': '#D0D0D0',
            'line': '#D5D5D5',
            'dot': '#E85A1A',
            'grid': '#E4E4E4',
        },
        'gray': {
            'bg': '#1C1C1C', 'bg2': '#222222',
            'icon': 'white',
            'name_col': '#C8C8C8', 'name_em': '#C8C8C8',
            'tag_col': '#555555',
            'ver_col': '#333333',
            'line': '#2E2E2E',
            'dot': '#888888',
            'grid': '#242424',
        },
    }
    c = cfgs[scheme]

    # Ícone centralizado
    icon_size = int(h * 0.22)
    ix = w // 2
    iy = int(h * 0.38)

    # Tamanhos de fonte escalados
    fs_name = int(h * 0.062)
    fs_tag  = int(h * 0.018)
    fs_ver  = int(h * 0.013)

    # Inline do ícone SVG (sem tamanho fixo, usando viewBox)
    icon_content = icon_svg(c['icon'], icon_size)
    # Extrair só o conteúdo interno do SVG (sem a tag svg externa)
    import re
    inner = re.sub(r'<svg[^>]*>', '', icon_content)
    inner = re.sub(r'</svg>', '', inner)

    # Padrão de fundo (grade sutil)
    grid_step = max(40, int(h * 0.04))

    # Linhas verticais da grade
    vlines = ''
    for x in range(0, w + grid_step, grid_step):
        vlines += f'<line x1="{x}" y1="0" x2="{x}" y2="{h}" stroke="{c["grid"]}" stroke-width="0.5"/>'

    # Linhas horizontais da grade
    hlines = ''
    for y in range(0, h + grid_step, grid_step):
        hlines += f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="{c["grid"]}" stroke-width="0.5"/>'

    # Glow radial centralizado
    glow_r = int(h * 0.55)
    glow_opacity = '0.04' if scheme == 'white' else '0.06'

    return f'''<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg_grad" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="{c['bg2']}"/>
      <stop offset="100%" stop-color="{c['bg']}"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FF6B2B" stop-opacity="{glow_opacity}"/>
      <stop offset="100%" stop-color="#FF6B2B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Fundo -->
  <rect width="{w}" height="{h}" fill="url(#bg_grad)"/>

  <!-- Grade sutil -->
  <g opacity="1">{vlines}{hlines}</g>

  <!-- Glow laranja suave centralizado -->
  <ellipse cx="{w//2}" cy="{iy}" rx="{glow_r}" ry="{int(glow_r*0.7)}" fill="url(#glow)"/>

  <!-- Ícone centralizado -->
  <g transform="translate({ix - icon_size//2},{iy - icon_size//2})">
    <svg width="{icon_size}" height="{icon_size}" viewBox="0 0 190 190">
      {inner}
    </svg>
  </g>

  <!-- Nome KronTech -->
  <text x="{w//2}" y="{iy + icon_size//2 + int(h*0.08)}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="{fs_name}"
    font-weight="bold"
    letter-spacing="-{int(fs_name*0.04)}"
    fill="{c['name_col']}">KronTech</text>

  <!-- Linha decorativa -->
  <line x1="{w//2 - int(w*0.08)}" y1="{iy + icon_size//2 + int(h*0.115)}"
        x2="{w//2 + int(w*0.08)}" y2="{iy + icon_size//2 + int(h*0.115)}"
        stroke="{c['line']}" stroke-width="1"/>

  <!-- Tagline -->
  <text x="{w//2}" y="{iy + icon_size//2 + int(h*0.148)}"
    text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="{fs_tag}"
    font-weight="normal"
    letter-spacing="{int(fs_tag*0.25)}"
    fill="{c['tag_col']}">ORDEM NO CAOS DO DIA A DIA</text>

  <!-- Versão -->
  <text x="{w//2}" y="{h - int(h*0.04)}"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="{fs_ver}"
    letter-spacing="{int(fs_ver*0.3)}"
    fill="{c['ver_col']}">v1.0  ·  2026</text>

</svg>'''


# ─────────────────────────────────────────────────────────────
# GERAR WALLPAPERS PNG
# ─────────────────────────────────────────────────────────────

WALLPAPER_SIZES = [
    (1280,  720,  'HD'),
    (1920, 1080, 'FullHD'),
    (2560, 1440, '2K'),
    (3840, 2160, '4K'),
]

print('\n── WALLPAPERS ──────────────────────────────')
for scheme in ['black', 'white', 'gray']:
    for (ww, hh, label) in WALLPAPER_SIZES:
        svg_str = wallpaper_svg(scheme, ww, hh)
        
        png_data = cairosvg.svg2png(
            bytestring=svg_str.encode(),
            output_width=ww,
            output_height=hh,
        )
        
        path = f'{OUT}/wallpapers/krontech_wallpaper_{scheme}_{label}_{ww}x{hh}.png'
        with open(path, 'wb') as f:
            f.write(png_data)
        
        size_mb = len(png_data) / 1024 / 1024
        print(f'  ✓ [{scheme:5}] {label:7} {ww}x{hh}  ({size_mb:.1f} MB)')


# ─────────────────────────────────────────────────────────────
# TAMBÉM SALVAR OS SVGs VETORIAIS
# ─────────────────────────────────────────────────────────────

print('\n── SVGs VETORIAIS ──────────────────────────')
os.makedirs(f'{OUT}/svg', exist_ok=True)

for scheme in ['black', 'white', 'gray']:
    # Ícone SVG
    svg_path = f'{OUT}/svg/krontech_icon_{scheme}.svg'
    with open(svg_path, 'w') as f:
        f.write(icon_svg(scheme, 512))
    print(f'  ✓ {scheme} icon SVG')
    
    # Wallpaper SVG (1920x1080)
    svg_path = f'{OUT}/svg/krontech_wallpaper_{scheme}_1920x1080.svg'
    with open(svg_path, 'w') as f:
        f.write(wallpaper_svg(scheme, 1920, 1080))
    print(f'  ✓ {scheme} wallpaper SVG')


# ─────────────────────────────────────────────────────────────
# SUMÁRIO FINAL
# ─────────────────────────────────────────────────────────────

total_files = 0
total_size = 0

for root, dirs, files in os.walk(OUT):
    for fn in files:
        fp = os.path.join(root, fn)
        s = os.path.getsize(fp)
        total_files += 1
        total_size += s

print(f'\n{"─"*44}')
print(f'  Total de arquivos: {total_files}')
print(f'  Tamanho total:     {total_size/1024/1024:.1f} MB')
print(f'  Localização:       {OUT}')
print('  CONCLUÍDO ✓')
