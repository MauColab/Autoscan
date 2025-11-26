import logging
import os
import cv2
import numpy as np
import matplotlib.pyplot as plt
import math
from paddleocr import PaddleOCR
from ultralytics import YOLO

# ==========================================
# 1. FUNCIÓN DE EXTRACCIÓN DE TEXTO (OCR)
# ==========================================
def extraerTexto(imagen, modelo_paddle):
    """
    Recibe una imagen (recorte de placa) y aplica OCR.
    Retorna dos listas: textos detectados y sus confianzas.
    """
    # Ejecutar predicción
    result = modelo_paddle.predict(imagen)
    
    textos_res = []
    scores_res = []
    
    # Iteramos sobre los resultados
    for res in result:
        # Usamos .get() para evitar errores si el diccionario no trae las llaves
        txts = res.get('rec_texts', [])
        scrs = res.get('rec_scores', [])
        
        if txts and scrs:
            for t, s in zip(txts, scrs):
                textos_res.append(t)
                scores_res.append(s)
                
    return textos_res, scores_res

# ==========================================
# 2. FUNCIÓN DE RECORTE (YOLO)
# ==========================================
def extraerRecortes(imagen, modelo_yolo):
    """
    Detecta objetos con YOLO y retorna un diccionario con:
    - 'placas': Lista de imágenes recortadas (numpy arrays).
    - 'coordenadas': Lista de coordenadas [[x1,y1], [x2,y1]...] de cada caja.
    """
    # Predicción (verbose=False para no llenar la consola de logs)
    results = modelo_yolo.predict(imagen, verbose=False)
    result = results[0]
    
    arreglo_placas = {
        "placas": [],
        "coordenadas": []
    }
    
    h_img, w_img, _ = imagen.shape

    for box in result.boxes:
        # 1. Obtener coordenadas
        coords = box.xyxy[0].tolist()
        x1, y1, x2, y2 = map(int, coords)
        
        # 2. Validar bordes (Sanity Check)
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w_img, x2), min(h_img, y2)

        # 3. Recortar
        recorte = imagen[y1:y2, x1:x2]
        
        # 4. Guardar si el recorte es válido
        if recorte.size > 0:            
            # Guardamos los 4 puntos para dibujar polígonos después
            puntos_caja = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
            
            arreglo_placas["coordenadas"].append(puntos_caja)
            arreglo_placas["placas"].append(recorte)

    return arreglo_placas

# ==========================================
# 3. FUNCIÓN DE PREPROCESAMIENTO
# ==========================================
def PreprocesarPlaca(plate_crop):
    """
    Prepara la imagen para el OCR:
    Grayscale -> Binarización (Otsu) -> Re-conversión a 3 canales (BGR).
    """
    # 1. Escala de grises
    #gray_plate = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)

    # 2. Binarizar (Blanco y Negro puro)
    #_, binary_plate = cv2.threshold(gray_plate, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 3. Convertir de nuevo a BGR (PaddleOCR requiere entrada de 3 canales)
    # Visualmente sigue siendo B/N, pero la estructura de datos es (H, W, 3)
    #binary_plate_3ch = cv2.cvtColor(binary_plate, cv2.COLOR_GRAY2BGR)
    
    #return binary_plate_3ch 


    return plate_crop

# ==========================================
# 4. FUNCIÓN ORQUESTADORA (POR IMAGEN)
# ==========================================
def extraerPlaca(imagen_path, modelo_yolo, ocr):
    """
    Coordina todo el proceso para una sola imagen:
    Carga -> YOLO -> Preprocesamiento -> OCR.
    """
    # 1. Cargar imagen
    img = cv2.imread(imagen_path)
    if img is None:
        return {}, None

    # 2. Detectar y Recortar
    placas_data = extraerRecortes(img, modelo_yolo)

    # 3. Preprocesar Recortes
    placas_data["placas_procesadas"] = []
    for placa in placas_data["placas"]:
        placa_procesada = PreprocesarPlaca(placa)
        placas_data["placas_procesadas"].append(placa_procesada)
    
    # 4. Leer Texto (OCR)
    placas_data["texto_predicho"] = []
    placas_data["confianza_predicho"] = []
    
    for placa_binaria in placas_data["placas_procesadas"]:     
        textos, scores = extraerTexto(placa_binaria, ocr)
        placas_data["texto_predicho"].append(textos)
        placas_data["confianza_predicho"].append(scores)
    
    return placas_data, img

# ==========================================
# 5. FUNCIÓN DE ANOTACIÓN VISUAL
# ==========================================
def anotar_imagen(img, datos_placas):
    """
    Dibuja los recuadros verdes y el texto detectado sobre la imagen original.
    """
    img_copia = img.copy()
    
    if "coordenadas" not in datos_placas or not datos_placas["coordenadas"]:
        return img_copia

    num_placas = len(datos_placas["coordenadas"])
    
    for i in range(num_placas):
        puntos = datos_placas["coordenadas"][i]
        lista_textos = datos_placas["texto_predicho"][i]
        
        # Unir textos si hay varios fragmentos (ej: "PERU" "ABC-123")
        texto_etiqueta = " ".join(lista_textos) if lista_textos else ""

        # Dibujar Polígono (Caja)
        pts = np.array(puntos, np.int32).reshape((-1, 1, 2))
        cv2.polylines(img_copia, [pts], isClosed=True, color=(0, 255, 0), thickness=3)

        # Dibujar Etiqueta con fondo
        x, y = puntos[0]
        # Calcular tamaño del texto
        (w_text, h_text), _ = cv2.getTextSize(texto_etiqueta, cv2.FONT_HERSHEY_SIMPLEX, 1, 2)
        
        # Fondo verde para el texto
        cv2.rectangle(img_copia, (x, y - 40), (x + w_text + 10, y), (0, 255, 0), -1)
        # Texto negro
        cv2.putText(img_copia, texto_etiqueta, (x + 5, y - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    return img_copia

# ==========================================
# 6. FUNCIÓN PRINCIPAL DE COLLAGE
# ==========================================
def generarCollageResultados(carpeta_imagenes):
    """
    Procesa toda una carpeta y muestra los resultados en una cuadrícula usando Matplotlib.
    """
    # 1. Cargar Modelos (UNA SOLA VEZ)
    print("--- Cargando modelos (esto puede tardar un poco) ---")
    try:
        modelo_yolo = YOLO('modeloentrenado.pt') # Tu modelo custom
    except:
        print("Aviso: 'modeloentrenado.pt' no encontrado. Usando 'yolov8n.pt' para demostración.")
        modelo_yolo = YOLO('yolov8n.pt')

    # Silenciar logs de Paddle
    logging.getLogger("ppocr").setLevel(logging.WARNING)
    ocr = PaddleOCR(use_textline_orientation=True, lang='en')

    # 2. Buscar imágenes
    valid_ext = ('.png', '.jpg', '.jpeg', '.bmp')
    archivos = [os.path.join(carpeta_imagenes, f) for f in os.listdir(carpeta_imagenes) 
                if f.lower().endswith(valid_ext)]
    
    if not archivos:
        print(f"No se encontraron imágenes en: {carpeta_imagenes}")
        return

    print(f"Procesando {len(archivos)} imágenes...")

    imagenes_para_mostrar = []
    nombres_archivos = []

    # 3. Loop de procesamiento
    for ruta in archivos:
        try:
            resultados, img_original = extraerPlaca(ruta, modelo_yolo, ocr)
            
            if img_original is None: continue

            # Anotar imagen con los resultados
            img_anotada = anotar_imagen(img_original, resultados)
            
            # IMPORTANTE: Convertir BGR a RGB para Matplotlib
            img_rgb = cv2.cvtColor(img_anotada, cv2.COLOR_BGR2RGB)
            
            imagenes_para_mostrar.append(img_rgb)
            nombres_archivos.append(os.path.basename(ruta))
            print(f" [OK] {os.path.basename(ruta)}")
            
        except Exception as e:
            print(f" [ERROR] {os.path.basename(ruta)}: {e}")

    # 4. Generar Grid con Matplotlib
    num_imgs = len(imagenes_para_mostrar)
    if num_imgs == 0: return

    # Configuración de columnas y filas dinámicas
    cols = 3 
    rows = math.ceil(num_imgs / cols)

    plt.figure(figsize=(5 * cols, 5 * rows)) # Tamaño de la figura
    
    for i in range(num_imgs):
        plt.subplot(rows, cols, i + 1)
        plt.imshow(imagenes_para_mostrar[i])
        plt.title(nombres_archivos[i], fontsize=10)
        plt.axis('off') # Ocultar ejes

    plt.tight_layout()
    print("Mostrando collage final...")
    plt.show()

# ==========================================
# PUNTO DE ENTRADA
# ==========================================
if __name__ == "__main__":
    # 1. Obtener la ruta absoluta de la carpeta donde está ESTE script (src)
    directorio_actual = os.path.dirname(os.path.abspath(__file__))
    
    # 2. Construir la ruta a 'imagenes_test'
    # Asumimos que la carpeta está al lado del script .py
    carpeta_test = os.path.join(directorio_actual, 'imagenes_test')
    
    # (OPCIONAL) Si tu carpeta de imágenes está FUERA de 'src' (en la raíz del proyecto)
    # usa esta línea en su lugar:
    # carpeta_test = os.path.join(directorio_actual, '..', 'imagenes_test')

    # 3. Verificar si existe antes de ejecutar
    if os.path.exists(carpeta_test):
        print(f"Carpeta de imágenes encontrada en: {carpeta_test}")
        generarCollageResultados(carpeta_test)
    else:
        print(f"ERROR: No se encuentra la carpeta en: {carpeta_test}")
        print("Asegúrate de crear una carpeta llamada 'imagenes_test' en la misma ubicación que este archivo .py")
        # Crea la carpeta automáticamente si no existe para ayudar
        try:
            os.makedirs(carpeta_test)
            print(f"Se ha creado la carpeta vacía en {carpeta_test}. Por favor, pon tus imágenes ahí y vuelve a ejecutar.")
        except:
            pass