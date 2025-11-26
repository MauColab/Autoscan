import logging
import os
import re
from paddleocr import PaddleOCR
import cv2

def extraerTexto(imagen, modelo_paddle):
    # Ejecutar lectura (cls=True activa la corrección de ángulo)
    result = modelo_paddle.predict(imagen)
    for res in result:
        res.save_to_json("output")
    return result



def extraerPlaca(imagen_path):
    # 2. Cargar imagen
    # Obtiene la ruta de la carpeta donde está tu script 'ocr.py'
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Une esa ruta con el nombre de tu imagen
    img_path = os.path.join(current_dir, imagen_path)

    img = cv2.imread(img_path)




    # Silenciar mensajes de depuración (Reemplaza a show_log=False)
    logging.getLogger("ppocr").setLevel(logging.WARNING)
    
    # Inicializar el modelo
    # IMPORTANTE: Usamos 'use_textline_orientation' en lugar de 'use_angle_cls'
    ocr = PaddleOCR(
        use_textline_orientation=True, 
        lang='en' # Inglés cubre todos los caracteres alfanuméricos de placas
    )

    return extraerTexto(img, ocr)

    
if __name__ == "__main__":

    ruta = './imagenes_test/511651_142422_jpg.rf.cd28c55b922adc3841c885540c8108ee.jpg'
    extraerPlaca(ruta)