import os
import cv2
from ultralytics import YOLO

MODEL_PATH = os.path.join("models", "best.pt")
TEST_IMAGE = os.path.join("examples", "testimage.jpg")

def detect():
    model = YOLO(MODEL_PATH)

    img = cv2.imread(TEST_IMAGE)
    if img is None:
        raise FileNotFoundError(f"No se encontró la imagen: {TEST_IMAGE}")

    results = model(img)

    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].int().tolist()
            conf = float(box.conf[0])

            if conf < 0.5:
                continue

            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                img,
                f"{conf:.2f}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2,
            )

    cv2.imshow("Detección YOLO", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    detect()