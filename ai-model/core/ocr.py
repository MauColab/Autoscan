import os
import cv2
from ultralytics import YOLO
import easyocr
from core.utils.preprocessing import preprocess_plate

MODEL_PATH = os.path.join("models", "best.pt")
TEST_IMAGE = os.path.join("examples", "testimage.jpg")

def main():
    model = YOLO(MODEL_PATH)
    reader = easyocr.Reader(["en"], gpu=False)

    img = cv2.imread(TEST_IMAGE)
    results = model(img)

    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].int().tolist()
            conf = box.conf[0]

            if conf < 0.5:
                continue

            crop = img[y1:y2, x1:x2]
            processed = preprocess_plate(crop)

            ocr = reader.readtext(
                processed,
                allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            )

            for (_, text, prob) in ocr:
                print(f"Placa detectada: {text} ({prob:.2f})")
                cv2.putText(
                    img, text,
                    (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8, (0,255,0), 2
                )

            cv2.rectangle(img, (x1,y1), (x2,y2), (0,255,0), 2)

    cv2.imshow("Deteccion + OCR", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()