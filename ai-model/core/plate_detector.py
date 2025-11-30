import logging
import os
import cv2
from paddleocr import PaddleOCR
import numpy as np
from ultralytics import YOLO

# Global models cache to avoid reloading
_YOLO_MODEL = None
_OCR_MODEL = None

def load_models():
    global _YOLO_MODEL, _OCR_MODEL
    
    if _YOLO_MODEL is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, '..', 'modeloentrenado.pt')
        if not os.path.exists(model_path):
             print(f"Warning: Model not found at {model_path}, using fallback.")
             _YOLO_MODEL = YOLO('yolov8n.pt')
        else:
             _YOLO_MODEL = YOLO(model_path)

    if _OCR_MODEL is None:
        logging.getLogger("ppocr").setLevel(logging.WARNING)
        _OCR_MODEL = PaddleOCR(
             text_detection_model_name="PP-OCRv5_server_det",
             text_recognition_model_name="en_PP-OCRv5_mobile_rec",
             use_doc_orientation_classify=False,
             use_doc_unwarping=True,
             use_textline_orientation=True,
             lang='en'
        )
    
    return _YOLO_MODEL, _OCR_MODEL

def extraerTexto(imagen, modelo_paddle):
    result = modelo_paddle.predict(imagen)
    textos = []
    scores = []
    
    for res in result:
        texto = res.get('rec_texts', [])
        score = res.get('rec_scores', [])
        
        if texto and score:
            for t, s in zip(texto, score):
                if s >= 0.5 and t != "PERU":
                    textos.append(t)
                    scores.append(s)

    return textos, scores

def extraerRecortes(imagen, modelo_yolo):
    results = modelo_yolo.predict(imagen, verbose=False)
    result = results[0]
    recortes = []
    h_img, w_img, _ = imagen.shape

    for box in result.boxes:
        coords = box.xyxy[0].tolist()
        x1, y1, x2, y2 = map(int, coords)
        
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w_img, x2)
        y2 = min(h_img, y2)

        recorte = imagen[y1:y2, x1:x2]
        if recorte.size > 0:
            recortes.append(recorte)

    return recortes

def process_image(img_numpy, yolo_model=None, ocr_model=None):
    """
    Main processing function that accepts a numpy image.
    """
    # Load models if not passed
    if yolo_model is None or ocr_model is None:
        yolo_model, ocr_model = load_models()

    placas = extraerRecortes(img_numpy, yolo_model)
    
    resultados = []
    for placa in placas:     
        textos, scores = extraerTexto(placa, ocr_model)
        resultados.append({
            "texto_predicho": textos,
            "confianza_predicho": scores
        })

    return resultados

def extraerPlaca(imagen_path):
    """
    Legacy wrapper for file paths.
    """
    if not os.path.isabs(imagen_path):
        imagen_path = os.path.abspath(imagen_path)

    img = cv2.imread(imagen_path)
    if img is None:
        print(f"Error: No se pudo cargar la imagen en {imagen_path}")
        return []

    return process_image(img)

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    ruta = os.path.join(current_dir, "..", "examples", "imagenes_test", "testimage.jpg")
    
    if os.path.exists(ruta):
        # Pre-load models to test
        load_models()
        resultado_final = extraerPlaca(ruta)
        print("Resultado Final:", resultado_final)
    else:
        print(f"Test image not found at {ruta}")
