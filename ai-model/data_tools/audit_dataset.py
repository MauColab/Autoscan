import os

# --- Configuración ---
# Adjusted to point to ../datasets/yolo/...
current_dir = os.path.dirname(os.path.abspath(__file__))
IMG_FOLDER = os.path.join(current_dir, '..', 'datasets', 'yolo', 'images', 'val')
LBL_FOLDER = os.path.join(current_dir, '..', 'datasets', 'yolo', 'labels', 'val')
# ---------------------

def audit_labels():
    print(f"Auditando carpetas:\n  IMG: {IMG_FOLDER}\n  LBL: {LBL_FOLDER}\n")
    
    if not os.path.exists(IMG_FOLDER):
        print(f"Error: Image folder not found at {IMG_FOLDER}")
        return
    if not os.path.exists(LBL_FOLDER):
        print(f"Error: Label folder not found at {LBL_FOLDER}")
        return

    missing_label_files = 0
    empty_label_files = 0
    total_images = 0
    
    image_files = os.listdir(IMG_FOLDER)
    total_images = len(image_files)
    
    for img_filename in image_files:
        # 1. Construir el nombre del label esperado
        name_part = os.path.splitext(img_filename)[0]
        lbl_filename = f"{name_part}.txt"
        lbl_filepath = os.path.join(LBL_FOLDER, lbl_filename)
        
        # 2. Revisar si el archivo .txt existe
        if not os.path.exists(lbl_filepath):
            print(f"[ERROR] Falta archivo de label para: {img_filename}")
            missing_label_files += 1
        else:
            # 3. Si existe, revisar si está vacío (0 bytes)
            if os.path.getsize(lbl_filepath) == 0:
                print(f"[ERROR] Archivo de label está VACÍO: {lbl_filename}")
                empty_label_files += 1
                
    print("\n--- Auditoría Completa ---")
    print(f"Total de Imágenes en 'val': {total_images}")
    print(f"Archivos .txt Faltantes:   {missing_label_files}")
    print(f"Archivos .txt Vacíos:      {empty_label_files}")
    print(f"\nTotal de archivos problemáticos: {missing_label_files + empty_label_files}")

if __name__ == '__main__':
    audit_labels()
