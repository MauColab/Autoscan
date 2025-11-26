import cv2
import numpy as np  # Necesario para manipular matrices de imágenes
from ultralytics import YOLO
import easyocr
import os

def procesar_lote_imagenes(ruta_carpeta, modelo_yolo, lector_ocr, extensiones_validas=['.jpg', '.jpeg', '.png']):
    # ... (Docstring igual) ...
    
    archivos = [f for f in os.listdir(ruta_carpeta) if os.path.splitext(f)[1].lower() in extensiones_validas]
    archivos.sort()
    
    if not archivos:
        print(f"No se encontraron imágenes en {ruta_carpeta}")
        return []

    resultados_totales = []
    print(f"--- Iniciando procesamiento de {len(archivos)} imágenes ---\n")

    for archivo in archivos:
        ruta_img = os.path.join(ruta_carpeta, archivo)
        print(f"Procesando: {archivo}...")
        
        img = cv2.imread(ruta_img)
        if img is None: continue

        # Redimensionar imagen base si es muy grande (para que quepa en pantalla)
        # Hacemos esto AL INICIO para trabajar con dimensiones manejables
        max_height = 800
        h_orig, w_orig = img.shape[:2]
        if h_orig > max_height:
            factor = max_height / h_orig
            img = cv2.resize(img, (int(w_orig * factor), int(h_orig * factor)))

        results = modelo_yolo(img, verbose=False)

        placa_detectada = False
        datos_imagen = {'archivo': archivo, 'detecciones': []}
        
        # Lista para guardar los recortes procesados y mostrarlos luego
        recortes_visuales = [] 

        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].int().tolist()
                conf = box.conf[0]

                if conf >= 0.5: 
                    placa_detectada = True
                    
                    # 1. Recortar
                    # Asegurar coordenadas dentro de la imagen
                    y1, y2 = max(0, y1), min(img.shape[0], y2)
                    x1, x2 = max(0, x1), min(img.shape[1], x2)
                    
                    plate_crop = img[y1:y2, x1:x2]
                    if plate_crop.size == 0: continue

                    # 2. Pre-procesar (Escala de grises + Binarización)
                    gray_plate = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)

                    # Otsu ayuda a separar letras negras/blancas del fondo
                    _, binary_plate = cv2.threshold(gray_plate, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                    
                    # Guardamos este recorte binario para la visualización final
                    recortes_visuales.append(binary_plate)

                    # 3. EasyOCR
                    ocr_result = lector_ocr.readtext(binary_plate, allowlist='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-')

                    for (bbox, text, prob) in ocr_result:
                        print(f"  -> Placa: {text} (Conf: {prob:.2f})")

                        # Dibujar en la imagen original
                        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(img, f"{text} ({prob:.2f})", (x1, y1 - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                        
                        datos_imagen['detecciones'].append({
                            'texto': text,
                            'confianza': float(prob),
                            'bbox': [x1, y1, x2, y2]
                        })

        resultados_totales.append(datos_imagen)
        
        if not placa_detectada:
            print("  -> No se detectaron placas.")

        # =======================================================
        # --- CONSTRUCCIÓN DEL PANEL DE VISUALIZACIÓN (DASHBOARD) ---
        # =======================================================
        
        # 1. Definir ancho del panel lateral
        ancho_panel = 300 
        alto_imagen, ancho_imagen = img.shape[:2]
        
        # 2. Crear lienzo negro: Ancho = img + panel
        lienzo = np.zeros((alto_imagen, ancho_imagen + ancho_panel, 3), dtype=np.uint8)
        
        # 3. Pegar la imagen original a la izquierda
        lienzo[0:alto_imagen, 0:ancho_imagen] = img
        
        # 4. Pegar los recortes a la derecha
        y_offset = 20 # Margen superior
        
        # Título del panel
        cv2.putText(lienzo, "Pre-procesamiento:", (ancho_imagen + 10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        y_offset += 40

        for recorte in recortes_visuales:
            # El recorte es Grayscale (1 canal), convertir a BGR (3 canales) para pegar
            recorte_bgr = cv2.cvtColor(recorte, cv2.COLOR_GRAY2BGR)
            
            # Redimensionar para que encaje bien en el panel (ancho fijo de 250px)
            h_rec, w_rec = recorte_bgr.shape[:2]
            aspect_ratio = w_rec / h_rec
            nuevo_ancho = 250
            nuevo_alto = int(nuevo_ancho / aspect_ratio)
            
            # Verificar que no nos salgamos del alto del lienzo
            if y_offset + nuevo_alto > alto_imagen:
                break 

            recorte_resized = cv2.resize(recorte_bgr, (nuevo_ancho, nuevo_alto))
            
            # Pegar en el lienzo
            x_pos = ancho_imagen + 25 # Margen izquierdo del panel
            lienzo[y_offset:y_offset+nuevo_alto, x_pos:x_pos+nuevo_ancho] = recorte_resized
            
            # Actualizar posición Y para el siguiente recorte
            y_offset += nuevo_alto + 20

        # Mostrar el lienzo completo
        cv2.imshow('Deteccion + Preprocesamiento (Q: Salir, Espacio: Siguiente)', lienzo)
        
        key = cv2.waitKey(0) & 0xFF
        if key == ord('q'):
            print("Detenido por usuario.")
            break

    cv2.destroyAllWindows()
    return resultados_totales

# ==========================================
# BLOQUE PRINCIPAL
# ==========================================
if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    carpeta_imagenes = os.path.join(current_dir, 'imagenes_test') 
    
    if not os.path.exists(carpeta_imagenes):
        os.makedirs(carpeta_imagenes)
        print("Crea la carpeta 'imagenes_test' y pon fotos.")
        exit()

    print("Cargando modelos...")
    # Asegurate de tener tu modelo .pt correcto aquí
    try:
        model = YOLO('modeloentrenado.pt') 
    except:
        model = YOLO('yolov8n.pt') # Fallback

    reader = easyocr.Reader(['en'], gpu=False) # Cambia a gpu=False si falla

    procesar_lote_imagenes(carpeta_imagenes, model, reader)