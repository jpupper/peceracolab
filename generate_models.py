"""
Script para Blender: Genera modelos 3D detallados para la pecera gigante
(Peces de distintas especies y decoraciones de fondo marino).
Ejecutar con: blender --background --python generate_models.py
"""

import bpy
import math
import os

# Directorio de salida
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "models")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_material(name, color, roughness=0.3, metallic=0.0, emission=(0, 0, 0), emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (*color, 1.0)
        bsdf.inputs['Roughness'].default_value = roughness
        bsdf.inputs['Metallic'].default_value = metallic
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (*emission, 1.0)
            bsdf.inputs['Emission Strength'].default_value = emission_strength
    return mat

def export_active_to_glb(filepath):
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True
    )
    print(f"Exportado exitosamente: {filepath}")

# ==========================================================
# 1. PEZ PAYASO (CLOWNFISH - ESTILO NEMO)
# ==========================================================
def build_clownfish():
    reset_scene()
    
    # Materiales
    mat_orange = create_material("Clown_Orange", (0.95, 0.42, 0.05), roughness=0.35)
    mat_white = create_material("Clown_White", (0.95, 0.95, 0.98), roughness=0.3)
    mat_black = create_material("Clown_Black", (0.05, 0.05, 0.05), roughness=0.4)
    mat_eye = create_material("Clown_Eye", (0.02, 0.02, 0.02), roughness=0.1)
    
    # Cuerpo principal (Orientado con la cabeza apuntando a +Y o +Z; usaremos -Z o +Y estandarizado)
    # Estandar: Cabeza en +Z, Cola en -Z, Arriba en +Y, Lados en +/- X
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1.0, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "Clownfish_Body"
    body.scale = (0.42, 0.7, 1.25)
    body.data.materials.append(mat_orange)
    
    # Franja Blanca 1 (Cerca de cabeza)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.72, minor_radius=0.09, location=(0, 0, 0.4))
    stripe1 = bpy.context.active_object
    stripe1.scale = (0.55, 0.9, 0.8)
    stripe1.data.materials.append(mat_white)
    
    # Franja Blanca 2 (Medio)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.73, minor_radius=0.08, location=(0, 0.05, -0.15))
    stripe2 = bpy.context.active_object
    stripe2.scale = (0.52, 0.85, 0.8)
    stripe2.data.materials.append(mat_white)
    
    # Franja Blanca 3 (Cerca de la aleta trasera)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.38, minor_radius=0.06, location=(0, 0, -0.9))
    stripe3 = bpy.context.active_object
    stripe3.scale = (0.45, 0.7, 0.8)
    stripe3.data.materials.append(mat_white)
    
    # Ojos (Izquierdo y Derecho)
    for side in [-1, 1]:
        # Esclera blanca
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.14, location=(side * 0.36, 0.22, 0.75))
        eye_white = bpy.context.active_object
        eye_white.data.materials.append(mat_white)
        # Pupila negra
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.08, location=(side * 0.44, 0.24, 0.78))
        eye_pupil = bpy.context.active_object
        eye_pupil.data.materials.append(mat_eye)
    
    # Aleta Dorsal (Arriba)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.45, depth=0.05, location=(0, 0.65, -0.1))
    dorsal = bpy.context.active_object
    dorsal.rotation_euler = (0, math.radians(90), 0)
    dorsal.scale = (1.2, 0.4, 0.08)
    dorsal.data.materials.append(mat_orange)
    
    # Borde negro de aleta dorsal
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.47, depth=0.04, location=(0, 0.78, -0.1))
    dorsal_trim = bpy.context.active_object
    dorsal_trim.rotation_euler = (0, math.radians(90), 0)
    dorsal_trim.scale = (1.0, 0.08, 0.09)
    dorsal_trim.data.materials.append(mat_black)
    
    # Aleta Caudal (Cola)
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.6, depth=0.04, location=(0, 0, -1.45))
    tail = bpy.context.active_object
    tail.rotation_euler = (0, math.radians(90), 0)
    tail.scale = (0.7, 0.8, 0.08)
    tail.data.materials.append(mat_orange)
    
    # Borde de cola
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.62, depth=0.03, location=(0, 0, -1.65))
    tail_trim = bpy.context.active_object
    tail_trim.rotation_euler = (0, math.radians(90), 0)
    tail_trim.scale = (0.68, 0.15, 0.09)
    tail_trim.data.materials.append(mat_black)
    
    # Aletas Pectorales (Costados)
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.25, depth=0.5, location=(side * 0.42, -0.1, 0.2))
        fin = bpy.context.active_object
        fin.rotation_euler = (math.radians(-25), math.radians(side * 45), math.radians(side * 20))
        fin.scale = (0.1, 0.8, 0.6)
        fin.data.materials.append(mat_orange)
    
    # Boca
    bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.04, location=(0, -0.05, 1.22))
    mouth = bpy.context.active_object
    mouth.rotation_euler = (math.radians(90), 0, 0)
    mouth.data.materials.append(mat_orange)
    
    out_file = os.path.join(OUTPUT_DIR, "clownfish.glb")
    export_active_to_glb(out_file)

# ==========================================================
# 2. PEZ ÁNGEL (ANGELFISH)
# ==========================================================
def build_angelfish():
    reset_scene()
    
    mat_silver = create_material("Angel_Silver", (0.85, 0.90, 0.95), roughness=0.25, metallic=0.4)
    mat_stripe = create_material("Angel_Stripe", (0.12, 0.15, 0.2), roughness=0.3)
    mat_yellow = create_material("Angel_Yellow", (0.95, 0.85, 0.15), roughness=0.3)
    mat_eye = create_material("Angel_Eye", (0.05, 0.05, 0.05), roughness=0.1)
    
    # Cuerpo en forma de disco romboidal alto y delgado
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1.0, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "Angelfish_Body"
    body.scale = (0.2, 1.3, 1.1)
    body.data.materials.append(mat_silver)
    
    # Rayas oscuras verticales
    for z_pos in [0.3, -0.1, -0.5]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.85, minor_radius=0.06, location=(0, 0, z_pos))
        stripe = bpy.context.active_object
        stripe.scale = (0.23, 1.25, 0.7)
        stripe.data.materials.append(mat_stripe)
    
    # Aleta Dorsal Alta y esbelta
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.6, depth=1.8, location=(0, 1.3, -0.2))
    dorsal = bpy.context.active_object
    dorsal.rotation_euler = (math.radians(-35), 0, 0)
    dorsal.scale = (0.06, 0.5, 1.2)
    dorsal.data.materials.append(mat_yellow)
    
    # Aleta Ventral Larga (hacia abajo)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.55, depth=1.9, location=(0, -1.3, -0.1))
    ventral = bpy.context.active_object
    ventral.rotation_euler = (math.radians(35), 0, 0)
    ventral.scale = (0.06, 0.45, 1.2)
    ventral.data.materials.append(mat_yellow)
    
    # Bigotes / aletas pélvicas filamentosas
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.03, depth=1.6, location=(side * 0.1, -1.0, 0.3))
        whisker = bpy.context.active_object
        whisker.rotation_euler = (math.radians(20), math.radians(side * 8), 0)
        whisker.data.materials.append(mat_yellow)
    
    # Aleta Caudal (Cola en abanico)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.8, depth=0.8, location=(0, 0, -1.4))
    tail = bpy.context.active_object
    tail.rotation_euler = (math.radians(90), 0, 0)
    tail.scale = (0.05, 1.0, 0.9)
    tail.data.materials.append(mat_silver)
    
    # Ojos
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.15, location=(side * 0.18, 0.3, 0.65))
        eye = bpy.context.active_object
        eye.data.materials.append(mat_yellow)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(side * 0.22, 0.32, 0.68))
        pupil = bpy.context.active_object
        pupil.data.materials.append(mat_eye)
    
    out_file = os.path.join(OUTPUT_DIR, "angelfish.glb")
    export_active_to_glb(out_file)

# ==========================================================
# 3. CIRUJANO AZUL (BLUE TANG / DORY)
# ==========================================================
def build_bluetang():
    reset_scene()
    
    mat_blue = create_material("Tang_Blue", (0.05, 0.25, 0.92), roughness=0.3, metallic=0.1)
    mat_yellow = create_material("Tang_Yellow", (0.98, 0.88, 0.05), roughness=0.25)
    mat_black = create_material("Tang_Black", (0.04, 0.04, 0.06), roughness=0.3)
    mat_white = create_material("Tang_White", (0.95, 0.95, 0.95), roughness=0.2)
    mat_eye = create_material("Tang_Eye", (0.02, 0.02, 0.02), roughness=0.1)
    
    # Cuerpo azul ovalado
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1.0, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "BlueTang_Body"
    body.scale = (0.35, 0.85, 1.25)
    body.data.materials.append(mat_blue)
    
    # Patrón oscuro en el lateral
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_torus_add(major_radius=0.55, minor_radius=0.07, location=(side * 0.3, 0.1, -0.15))
        curve = bpy.context.active_object
        curve.rotation_euler = (0, math.radians(90), 0)
        curve.scale = (0.4, 0.9, 0.9)
        curve.data.materials.append(mat_black)
    
    # Aleta Caudal Amarilla Triangular
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.7, depth=0.8, location=(0, 0, -1.45))
    tail = bpy.context.active_object
    tail.rotation_euler = (math.radians(90), 0, 0)
    tail.scale = (0.08, 0.8, 0.9)
    tail.data.materials.append(mat_yellow)
    
    # Bordes negros de la cola
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.06, depth=1.1, location=(0, 0.45, -1.45))
    tail_top = bpy.context.active_object
    tail_top.rotation_euler = (math.radians(-30), 0, 0)
    tail_top.data.materials.append(mat_black)
    
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.06, depth=1.1, location=(0, -0.45, -1.45))
    tail_bot = bpy.context.active_object
    tail_bot.rotation_euler = (math.radians(30), 0, 0)
    tail_bot.data.materials.append(mat_black)
    
    # Aleta Dorsal continua
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.75, -0.2))
    dorsal = bpy.context.active_object
    dorsal.scale = (0.05, 0.25, 0.95)
    dorsal.data.materials.append(mat_blue)
    
    # Aletas pectorales amarillas
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.25, depth=0.5, location=(side * 0.35, -0.05, 0.3))
        pectoral = bpy.context.active_object
        pectoral.rotation_euler = (0, math.radians(side * 50), math.radians(side * 15))
        pectoral.scale = (0.1, 0.6, 0.8)
        pectoral.data.materials.append(mat_yellow)
    
    # Ojos alegres y expresivos
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(side * 0.3, 0.3, 0.75))
        eye_w = bpy.context.active_object
        eye_w.data.materials.append(mat_white)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(side * 0.38, 0.33, 0.8))
        eye_p = bpy.context.active_object
        eye_p.data.materials.append(mat_eye)
    
    out_file = os.path.join(OUTPUT_DIR, "bluetang.glb")
    export_active_to_glb(out_file)

# ==========================================================
# 4. PEZ GLOBO (PUFFERFISH)
# ==========================================================
def build_pufferfish():
    reset_scene()
    
    mat_green = create_material("Puffer_Green", (0.55, 0.75, 0.2), roughness=0.45)
    mat_belly = create_material("Puffer_Belly", (0.95, 0.92, 0.82), roughness=0.4)
    mat_spine = create_material("Puffer_Spine", (0.85, 0.75, 0.35), roughness=0.3)
    mat_eye = create_material("Puffer_Eye", (0.1, 0.1, 0.12), roughness=0.1)
    mat_white = create_material("Puffer_White", (0.95, 0.95, 0.95), roughness=0.2)
    mat_mouth = create_material("Puffer_Mouth", (0.9, 0.45, 0.4), roughness=0.3)
    
    # Cuerpo casi esférico y gordito
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1.0, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "Pufferfish_Body"
    body.scale = (0.9, 0.95, 1.05)
    body.data.materials.append(mat_green)
    
    # Panza blanca / crema
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=0.9, location=(0, -0.35, -0.05))
    belly = bpy.context.active_object
    belly.scale = (0.85, 0.6, 0.9)
    belly.data.materials.append(mat_belly)
    
    # Pequeñas espinas cómicas alrededor del cuerpo
    spines_coords = [
        (0, 0.9, 0.2), (0.45, 0.75, 0.1), (-0.45, 0.75, 0.1),
        (0.7, 0.4, 0.2), (-0.7, 0.4, 0.2), (0.7, 0.4, -0.4), (-0.7, 0.4, -0.4),
        (0.5, 0.7, -0.4), (-0.5, 0.7, -0.4), (0, 0.85, -0.3),
        (0.65, -0.3, 0.1), (-0.65, -0.3, 0.1), (0.6, -0.3, -0.4), (-0.6, -0.3, -0.4),
    ]
    for x, y, z in spines_coords:
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.12, depth=0.28, location=(x, y, z))
        spine = bpy.context.active_object
        # orientar hacia afuera
        spine.rotation_euler = (math.atan2(y, z), 0, math.atan2(x, y))
        spine.data.materials.append(mat_spine)
    
    # Ojos saltones
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(side * 0.6, 0.45, 0.65))
        eye_w = bpy.context.active_object
        eye_w.data.materials.append(mat_white)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(side * 0.72, 0.5, 0.73))
        eye_p = bpy.context.active_object
        eye_p.data.materials.append(mat_eye)
    
    # Bocita fruncida de pez globo
    bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.06, location=(0, 0.05, 1.05))
    mouth = bpy.context.active_object
    mouth.rotation_euler = (math.radians(90), 0, 0)
    mouth.data.materials.append(mat_mouth)
    
    # Aleta caudal pequeña
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.35, depth=0.4, location=(0, 0, -1.25))
    tail = bpy.context.active_object
    tail.rotation_euler = (math.radians(90), 0, 0)
    tail.scale = (0.08, 0.6, 0.8)
    tail.data.materials.append(mat_belly)
    
    # Aletas pectorales que aletean rápido
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.2, depth=0.35, location=(side * 0.85, 0, 0.2))
        fin = bpy.context.active_object
        fin.rotation_euler = (0, math.radians(side * 60), 0)
        fin.scale = (0.1, 0.7, 0.7)
        fin.data.materials.append(mat_belly)
    
    out_file = os.path.join(OUTPUT_DIR, "pufferfish.glb")
    export_active_to_glb(out_file)

# ==========================================================
# 5. PEZ DORADO (GOLDFISH)
# ==========================================================
def build_goldfish():
    reset_scene()
    
    mat_gold = create_material("Gold_Orange", (0.98, 0.52, 0.08), roughness=0.2, metallic=0.6)
    mat_shimmer = create_material("Gold_Fins", (1.0, 0.72, 0.25), roughness=0.25, metallic=0.3)
    mat_eye = create_material("Gold_Eye", (0.05, 0.05, 0.05), roughness=0.1)
    mat_white = create_material("Gold_White", (0.95, 0.95, 0.95), roughness=0.2)
    
    # Cuerpo rechoncho de carpa dorada
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1.0, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "Goldfish_Body"
    body.scale = (0.5, 0.8, 1.1)
    body.data.materials.append(mat_gold)
    
    # Aleta Caudal doble ondulante y majestuosa
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.7, depth=1.2, location=(side * 0.15, -0.1, -1.6))
        tail = bpy.context.active_object
        tail.rotation_euler = (math.radians(95), math.radians(side * 18), 0)
        tail.scale = (0.06, 0.9, 1.2)
        tail.data.materials.append(mat_shimmer)
    
    # Gran aleta dorsal ondulada
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.5, depth=1.4, location=(0, 0.85, -0.2))
    dorsal = bpy.context.active_object
    dorsal.rotation_euler = (math.radians(-40), 0, 0)
    dorsal.scale = (0.06, 0.5, 1.3)
    dorsal.data.materials.append(mat_shimmer)
    
    # Aletas pectorales elegantes
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.3, depth=0.6, location=(side * 0.45, -0.2, 0.3))
        pec = bpy.context.active_object
        pec.rotation_euler = (math.radians(-20), math.radians(side * 40), math.radians(side * 20))
        pec.scale = (0.08, 0.7, 0.8)
        pec.data.materials.append(mat_shimmer)
    
    # Ojos saltones
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(side * 0.4, 0.3, 0.65))
        eye_w = bpy.context.active_object
        eye_w.data.materials.append(mat_white)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, location=(side * 0.48, 0.34, 0.7))
        eye_p = bpy.context.active_object
        eye_p.data.materials.append(mat_eye)
    
    out_file = os.path.join(OUTPUT_DIR, "goldfish.glb")
    export_active_to_glb(out_file)

# ==========================================================
# 6. DECORACIÓN DE ACUARIO GIGANTE (ARRECIFES, CORALES, COFRE)
# ==========================================================
def build_aquarium_decor():
    reset_scene()
    
    mat_sand = create_material("Dec_Sand", (0.82, 0.75, 0.6), roughness=0.85)
    mat_rock = create_material("Dec_Rock", (0.35, 0.38, 0.42), roughness=0.8)
    mat_coral_pink = create_material("Dec_CoralPink", (0.95, 0.35, 0.55), roughness=0.5, emission=(0.3, 0.05, 0.1), emission_strength=0.2)
    mat_coral_cyan = create_material("Dec_CoralCyan", (0.15, 0.85, 0.85), roughness=0.4, emission=(0.05, 0.3, 0.3), emission_strength=0.25)
    mat_kelp = create_material("Dec_Kelp", (0.1, 0.6, 0.25), roughness=0.6)
    mat_wood = create_material("Dec_Wood", (0.42, 0.26, 0.15), roughness=0.7)
    mat_gold_coin = create_material("Dec_Gold", (0.95, 0.8, 0.15), roughness=0.2, metallic=0.9, emission=(0.2, 0.15, 0.0), emission_strength=0.3)
    
    # Base de suelo de arena ondulada con piedras
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, -8, 0))
    floor = bpy.context.active_object
    floor.name = "Aquarium_Floor"
    floor.data.materials.append(mat_sand)
    
    # Gran formación rocosa con túnel / arco para que pasen los peces
    # Pilar izquierdo del arco
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=2.2, depth=7.0, location=(-6, -4.5, -4))
    pillar_left = bpy.context.active_object
    pillar_left.scale = (1.0, 1.2, 1.0)
    pillar_left.data.materials.append(mat_rock)
    
    # Pilar derecho del arco
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=2.0, depth=6.5, location=(6, -4.75, -4))
    pillar_right = bpy.context.active_object
    pillar_right.scale = (1.1, 0.9, 1.0)
    pillar_right.data.materials.append(mat_rock)
    
    # Arco superior
    bpy.ops.mesh.primitive_torus_add(major_radius=6.0, minor_radius=1.8, location=(0, -1.5, -4))
    arch = bpy.context.active_object
    arch.rotation_euler = (math.radians(90), 0, 0)
    arch.scale = (1.0, 0.5, 0.6)
    arch.data.materials.append(mat_rock)
    
    # Rocas adicionales dispersas
    rock_positions = [
        (-10, -7.0, 5, 2.5),
        (11, -7.2, 4, 2.0),
        (-4, -7.5, 8, 1.8),
        (8, -7.3, -9, 2.2),
        (-8, -7.1, -8, 2.8)
    ]
    for x, y, z, s in rock_positions:
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=s, location=(x, y, z))
        r = bpy.context.active_object
        r.scale = (1.0, 0.6, 1.2)
        r.data.materials.append(mat_rock)
    
    # Corales de tubos / esponjas marinas
    coral_centers = [(-7, -4.5, 3), (7, -4.8, 2), (-3, -6.5, -3), (4, -6.8, -5)]
    for cx, cy, cz in coral_centers:
        for i in range(5):
            angle = i * (2 * math.pi / 5)
            h = 1.2 + (i % 3) * 0.5
            tx = cx + math.cos(angle) * 0.7
            tz = cz + math.sin(angle) * 0.7
            bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.25, depth=h, location=(tx, cy + h/2, tz))
            sponge = bpy.context.active_object
            sponge.rotation_euler = (math.sin(angle)*0.2, 0, math.cos(angle)*0.2)
            mat = mat_coral_pink if (i % 2 == 0) else mat_coral_cyan
            sponge.data.materials.append(mat)
    
    # Algas marinas / Kelp (plantas ondulantes)
    kelp_roots = [(-11, -7.5, -2), (-12, -7.5, -5), (10, -7.5, -2), (12, -7.5, 3), (-2, -7.5, 10), (3, -7.5, 9)]
    for kx, ky, kz in kelp_roots:
        # Columna de hojas de algas
        for leaf in range(6):
            ly = ky + leaf * 1.5 + 0.8
            lx = kx + math.sin(leaf * 0.8) * 0.4
            lz = kz + math.cos(leaf * 0.8) * 0.4
            bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.35, depth=1.6, location=(lx, ly, lz))
            leaf_obj = bpy.context.active_object
            leaf_obj.scale = (0.1, 1.2, 0.7)
            leaf_obj.rotation_euler = (math.sin(leaf)*0.3, math.cos(leaf)*0.4, math.sin(leaf*0.5)*0.2)
            leaf_obj.data.materials.append(mat_kelp)
    
    # Cofre del Tesoro Hundido
    # Base del cofre
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -7.1, 4))
    chest_base = bpy.context.active_object
    chest_base.scale = (1.8, 1.0, 1.2)
    chest_base.data.materials.append(mat_wood)
    
    # Tapa abierta del cofre
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.6, depth=1.8, location=(0, -6.0, 3.4))
    chest_lid = bpy.context.active_object
    chest_lid.rotation_euler = (math.radians(-40), 0, math.radians(90))
    chest_lid.data.materials.append(mat_wood)
    
    # Monedas de oro brillantes dentro del cofre
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, location=(0, -6.4, 4))
    coins = bpy.context.active_object
    coins.scale = (1.4, 0.4, 0.8)
    coins.data.materials.append(mat_gold_coin)
    
    out_file = os.path.join(OUTPUT_DIR, "aquarium_decor.glb")
    export_active_to_glb(out_file)

if __name__ == "__main__":
    print("Iniciando generación de modelos 3D con Blender...")
    build_clownfish()
    build_angelfish()
    build_bluetang()
    build_pufferfish()
    build_goldfish()
    build_aquarium_decor()
    print("¡Todos los modelos 3D se generaron exitosamente en:", OUTPUT_DIR)
