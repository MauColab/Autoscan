import pandas as pd
import os
import shutil

# --- CONFIGURACIÓN ---
BASE_DIR = 'Dataset_TP'
FOLDERS = ['train', 'valid', 'test']
CLASS_MAP = {'placa': 0} 
# ---------------------

def sanitize_dataset(folder_name):
    csv_path = os.path.join(BASE_DIR, folder_name, '_annotations.csv')
    img_dir = os.path.join(BASE_DIR, folder_name)
    
    if not os.path.exists(csv_path):
        print(f"[SKIP] No se encontró CSV en: {folder_name}")
        return

    print(f"--- Procesando y Renombrando: {folder_name} ---")
    df = pd.read_csv(csv_path)
    
    # 1. Crear un mapa de renombramiento para las imágenes
    # Esto asegura que si una imagen tiene 2 placas, usemos el mismo nombre nuevo
    unique_files = df['filename'].unique()
    rename_map = {}
    
    print("Renombrando imágenes a formato corto...")
    for idx, old_filename in enumerate(unique_files):
        # Extensión del archivo (jpg, png, etc)
        ext = os.path.splitext(old_filename)[1]
        
        # NUEVO NOMBRE CORTO: ej. train_00001.jpg
        new_filename = f"{folder_name}_{idx:05d}{ext}"
        rename_map[old_filename] = new_filename
        
        # Renombrar el archivo FÍSICO en el disco
        old_path = os.path.join(img_dir, old_filename)
        new_path = os.path.join(img_dir, new_filename)
        
        if os.path.exists(old_path):
            try:
                os.rename(old_path, new_path)
            except OSError as e:
                print(f"[ERROR] No se pudo renombrar {old_filename}. Razón: {e}")
        elif os.path.exists(new_path):
            # Si ya existe el nuevo nombre, asumimos que ya se corrió el script antes
            pass
        else:
            # Si no encuentra ni el viejo ni el nuevo, se salta
            print(f"[AVISO] Imagen no encontrada: {old_filename}")

    # 2. Generar los TXT con los nuevos nombres
    print("Generando archivos .txt...")
    files_created = 0
    
    # Agrupar por el nombre ORIGINAL del archivo para procesar las coordenadas
    for old_filename, group in df.groupby('filename'):
        # Obtener el nombre NUEVO que asignamos arriba
        if old_filename not in rename_map:
            continue
            
        new_filename = rename_map[old_filename]
        txt_filename = os.path.splitext(new_filename)[0] + '.txt'
        txt_path = os.path.join(img_dir, txt_filename)
        
        # Escribir el archivo txt
        with open(txt_path, 'w') as f:
            for _, row in group.iterrows():
                img_width = row['width']
                img_height = row['height']
                xmin, ymin, xmax, ymax = row['xmin'], row['ymin'], row['xmax'], row['ymax']
                
                # Normalización YOLO
                x_center = ((xmin + xmax) / 2) / img_width
                y_center = ((ymin + ymax) / 2) / img_height
                width_norm = (xmax - xmin) / img_width
                height_norm = (ymax - ymin) / img_height
                
                # Asegurar límites entre 0 y 1
                x_center = max(0, min(1, x_center))
                y_center = max(0, min(1, y_center))
                width_norm = max(0, min(1, width_norm))
                height_norm = max(0, min(1, height_norm))
                
                class_id = CLASS_MAP.get(row['class'], 0)
                
                f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {width_norm:.6f} {height_norm:.6f}\n")
        
        files_created += 1
        
    print(f"  -> ¡Éxito! {files_created} imágenes procesadas y etiquetas creadas en '{folder_name}'.")

if __name__ == '__main__':
    for folder in FOLDERS:
        sanitize_dataset(folder)