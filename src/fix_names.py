import os

# CONFIGURA ESTAS RUTAS
LABELS_TRAIN_PATH = 'yolo_dataset/labels/train'
LABELS_VAL_PATH = 'yolo_dataset/labels/val'

def fix_filenames(folder_path):
    print(f"Revisando carpeta: {folder_path}")
    renamed_count = 0
    for filename in os.listdir(folder_path):
        if filename.endswith('.txt') and '-' in filename:
            # Divide el nombre en el primer guion
            parts = filename.split('-', 1)
            if len(parts) == 2:
                new_filename = parts[1] # Se queda con la segunda parte
                
                # Renombrar el archivo
                old_file = os.path.join(folder_path, filename)
                new_file = os.path.join(folder_path, new_filename)
                
                os.rename(old_file, new_file)
                renamed_count += 1

    print(f"Se renombraron {renamed_count} archivos.")

if __name__ == '__main__':
    fix_filenames(LABELS_TRAIN_PATH)
    fix_filenames(LABELS_VAL_PATH)
    print("¡Nombres de etiquetas corregidos!")