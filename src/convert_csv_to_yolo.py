import pandas as pd
import os

# --- CONFIGURACIÓN ---
BASE_DIR = 'Dataset_TP'
FOLDERS = ['train', 'valid', 'test']
CLASS_MAP = {'placa': 0} # Asegúrate que el nombre de la clase en el CSV sea 'placa'
# ---------------------

def convert_csv_to_txt(folder_name):
    csv_path = os.path.join(BASE_DIR, folder_name, '_annotations.csv')
    img_path = os.path.join(BASE_DIR, folder_name)
    
    if not os.path.exists(csv_path):
        print(f"[SKIP] No se encontró CSV en: {folder_name}")
        return

    print(f"Procesando {folder_name}...")
    df = pd.read_csv(csv_path)
    
    # Iterar sobre cada fila del CSV
    for index, row in df.iterrows():
        filename = row['filename']
        # Verificar si la imagen existe para evitar archivos huérfanos
        if not os.path.exists(os.path.join(img_path, filename)):
            continue

        img_width = row['width']
        img_height = row['height']
        class_name = row['class'] # O el nombre de la columna que tenga la clase
        
        # Coordenadas del CSV
        xmin = row['xmin']
        ymin = row['ymin']
        xmax = row['xmax']
        ymax = row['ymax']
        
        # --- CONVERSIÓN MATEMÁTICA A YOLO (Normalización) ---
        # YOLO necesita: centro_x, centro_y, ancho, alto (todo entre 0 y 1)
        x_center = ((xmin + xmax) / 2) / img_width
        y_center = ((ymin + ymax) / 2) / img_height
        width = (xmax - xmin) / img_width
        height = (ymax - ymin) / img_height
        
        class_id = CLASS_MAP.get(class_name, 0) # Usa 0 si no encuentra la clase
        
        # Crear el contenido de la línea
        yolo_line = f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n"
        
        # Guardar en archivo .txt (mismo nombre que la imagen)
        txt_filename = os.path.splitext(filename)[0] + '.txt'
        txt_path = os.path.join(img_path, txt_filename)
        
        # Escribir (modo 'a' para append por si hay varios objetos en una foto)
        # Primero verificamos si es la primera vez que escribimos en este archivo para limpiarlo
        if not os.path.isfile(txt_path) or index == 0: 
             # Nota: Esto es simple. En pandas iterrows es mejor borrar si existe antes del loop
             # pero para simplificar, asumiremos append y luego limpiar duplicados si es necesario.
             # Una forma más segura es agrupar por filename primero.
             pass

    # Método optimizado: Agrupar por imagen para escribir de una sola vez
    files_created = 0
    for filename, group in df.groupby('filename'):
        txt_filename = os.path.splitext(filename)[0] + '.txt'
        txt_path = os.path.join(img_path, txt_filename)
        
        with open(txt_path, 'w') as f:
            for _, row in group.iterrows():
                img_width = row['width']
                img_height = row['height']
                xmin, ymin, xmax, ymax = row['xmin'], row['ymin'], row['xmax'], row['ymax']
                
                x_center = ((xmin + xmax) / 2) / img_width
                y_center = ((ymin + ymax) / 2) / img_height
                width_norm = (xmax - xmin) / img_width
                height_norm = (ymax - ymin) / img_height
                
                class_id = CLASS_MAP.get(row['class'], 0)
                f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {width_norm:.6f} {height_norm:.6f}\n")
        files_created += 1
        
    print(f"  -> ¡Listo! Se crearon {files_created} archivos .txt en {folder_name}")

if __name__ == '__main__':
    for folder in FOLDERS:
        convert_csv_to_txt(folder)