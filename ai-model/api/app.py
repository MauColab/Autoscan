from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import sys
import os
import datetime
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add core to path to import plate_detector
current_dir = os.path.dirname(os.path.abspath(__file__))
core_dir = os.path.join(current_dir, '..', 'core')
sys.path.append(core_dir)

from plate_detector import process_image, load_models

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Load models at startup
print("Loading AI Models...")
load_models()
print("Models Loaded!")

# --- SUPABASE CONFIG ---
# If env vars are not set, it will fallback to in-memory (for testing without DB)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Connected to Supabase!")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")

# --- IN-MEMORY FALLBACK ---
evaluations_fallback = []
reports_fallback = [
    {'id': '1', 'plate': 'ABC-123', 'model': 'Toyota Corolla', 'location': 'Av. Javier Prado', 'owner': 'Juan Perez', 'status': 'Limpio', 'time': '10:42 AM'},
    {'id': '2', 'plate': 'XYZ-987', 'model': 'Nissan Sentra', 'location': 'Calle Los Pinos', 'owner': 'Maria Lopez', 'status': 'Robado', 'time': '11:15 AM'},
]

@app.route('/health', methods=['GET'])
def health():
    db_status = "connected" if supabase else "disconnected (using fallback)"
    return jsonify({"status": "ok", "service": "Autoscan AI", "database": db_status})

# --- AI PREDICTION ---
@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read file to numpy array
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Invalid image format"}), 400

        # Process
        results = process_image(img)
        
        # Extract all plate texts
        all_plates = []
        if results:
             for r in results:
                 all_plates.extend(r.get('texto_predicho', []))

        return jsonify({
            "status": "success",
            "filename": file.filename,
            "detections": results,
            "plates_found": all_plates # List of all plates found
        })

    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"error": str(e)}), 500

# --- EVALUATIONS (MOBILE -> PC) ---
@app.route('/evaluations', methods=['GET'])
def get_evaluations():
    if supabase:
        try:
            response = supabase.table('evaluations').select("*").order('created_at', desc=True).execute()
            return jsonify(response.data)
        except Exception as e:
            print(f"Supabase Error: {e}")
            return jsonify(evaluations_fallback)
    return jsonify(evaluations_fallback)

@app.route('/evaluations', methods=['POST'])
def create_evaluation():
    data = request.json
    new_eval = {
        'plate': data.get('plate', 'Desconocido'),
        'model': data.get('model', ''),
        'location': data.get('location', ''),
        'owner': data.get('owner', ''),
        'status': 'pending',
        'sender': data.get('sender', 'Oficial Móvil'),
        'dni': data.get('dni', ''),
        'summary': data.get('summary', 'Reporte desde App Móvil'),
        'img_url': data.get('img', 'https://via.placeholder.com/150')
    }
    
    if supabase:
        try:
            response = supabase.table('evaluations').insert(new_eval).execute()
            return jsonify({"status": "success", "evaluation": response.data[0]})
        except Exception as e:
            print(f"Supabase Error: {e}")
            return jsonify({"error": str(e)}), 500
    else:
        new_eval['id'] = str(uuid.uuid4())
        new_eval['time'] = datetime.datetime.now().strftime("%I:%M %p")
        new_eval['img'] = new_eval['img_url'] # Fallback uses 'img'
        evaluations_fallback.insert(0, new_eval)
        return jsonify({"status": "success", "evaluation": new_eval})

@app.route('/evaluations/<eval_id>/status', methods=['PUT'])
def update_evaluation_status(eval_id):
    data = request.json
    new_status = data.get('status')
    
    if supabase:
        try:
            response = supabase.table('evaluations').update({'status': new_status}).eq('id', eval_id).execute()
            return jsonify({"status": "success", "evaluation": response.data})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        for ev in evaluations_fallback:
            if ev['id'] == eval_id:
                ev['status'] = new_status
                return jsonify({"status": "success", "evaluation": ev})
        return jsonify({"error": "Evaluation not found"}), 404

# --- REPORTS (PC MANAGEMENT) ---
@app.route('/reports', methods=['GET'])
def get_reports():
    if supabase:
        try:
            response = supabase.table('reports').select("*").order('created_at', desc=True).execute()
            return jsonify(response.data)
        except Exception as e:
            return jsonify(reports_fallback)
    return jsonify(reports_fallback)

@app.route('/reports', methods=['POST'])
def create_report():
    data = request.json
    new_report = {
        'plate': data.get('plate'),
        'model': data.get('model'),
        'location': data.get('location'),
        'owner': data.get('owner'),
        'status': data.get('status', 'Sospechoso'),
        'time': datetime.datetime.now().strftime("%I:%M %p") # Store time string for display
    }
    
    if supabase:
        try:
            response = supabase.table('reports').insert(new_report).execute()
            return jsonify({"status": "success", "report": response.data[0]})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        new_report['id'] = str(uuid.uuid4())
        reports_fallback.insert(0, new_report)
        return jsonify({"status": "success", "report": new_report})

@app.route('/reports/<report_id>/status', methods=['PUT'])
def update_report_status(report_id):
    data = request.json
    new_status = data.get('status')
    
    if supabase:
        try:
            response = supabase.table('reports').update({'status': new_status}).eq('id', report_id).execute()
            return jsonify({"status": "success", "report": response.data})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        for r in reports_fallback:
            if r['id'] == report_id:
                r['status'] = new_status
                return jsonify({"status": "success", "report": r})
        return jsonify({"error": "Report not found"}), 404

if __name__ == '__main__':
    # Run on 0.0.0.0 to be accessible from mobile app
    app.run(host='0.0.0.0', port=5000, debug=True)
