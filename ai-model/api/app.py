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
reports_fallback = []
mobile_users_fallback = []

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

# --- STATION AUTH (PC) ---
@app.route('/station/register', methods=['POST'])
def station_register():
    data = request.json
    station_id = data.get('station_id')
    name = data.get('name')
    password = data.get('password')
    
    if not all([station_id, name, password]):
        return jsonify({"error": "Faltan datos"}), 400
        
    if supabase:
        try:
            # Check if exists
            existing = supabase.table('stations').select("*").eq('station_id', station_id).execute()
            if existing.data:
                return jsonify({"error": "ID de comisaría ya registrado"}), 400
                
            new_station = {
                'station_id': station_id,
                'name': name,
                'password': password
            }
            response = supabase.table('stations').insert(new_station).execute()
            return jsonify({"status": "success", "station": response.data[0]})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"status": "success", "station": {"station_id": station_id, "name": name}}) # Mock success

@app.route('/station/login', methods=['POST'])
def station_login():
    data = request.json
    station_id = data.get('station_id')
    password = data.get('password')
    
    if supabase:
        try:
            response = supabase.table('stations').select("*").eq('station_id', station_id).eq('password', password).execute()
            if response.data:
                return jsonify({"status": "success", "station": response.data[0]})
            else:
                return jsonify({"error": "Credenciales inválidas"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # Mock login for testing without DB
        if station_id == "CMS-001" and password == "admin":
             return jsonify({"status": "success", "station": {"station_id": "CMS-001", "name": "Comisaría Central (Mock)"}})
        return jsonify({"error": "Credenciales inválidas (Mock: Use CMS-001/admin)"}), 401

# --- MOBILE AUTH ---
@app.route('/mobile/register', methods=['POST'])
def mobile_register():
    data = request.json
    full_name = data.get('full_name')
    dni = data.get('dni')
    email = data.get('email')
    password = data.get('password')
    
    if not all([full_name, dni, email, password]):
        return jsonify({"error": "Faltan datos"}), 400
        
    if supabase:
        try:
            # Check if exists
            existing = supabase.table('mobile_users').select("*").or_(f"email.eq.{email},dni.eq.{dni}").execute()
            if existing.data:
                return jsonify({"error": "Usuario ya registrado (Email o DNI en uso)"}), 400
                
            new_user = {
                'full_name': full_name,
                'dni': dni,
                'email': email,
                'password': password # In production, hash this!
            }
            response = supabase.table('mobile_users').insert(new_user).execute()
            return jsonify({"status": "success", "user": response.data[0]})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        # Fallback
        for u in mobile_users_fallback:
            if u['email'] == email or u['dni'] == dni:
                return jsonify({"error": "Usuario ya registrado"}), 400
        
        new_user = {
            'id': str(uuid.uuid4()),
            'full_name': full_name,
            'dni': dni,
            'email': email,
            'password': password
        }
        mobile_users_fallback.append(new_user)
        return jsonify({"status": "success", "user": new_user})

@app.route('/mobile/login', methods=['POST'])
def mobile_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if supabase:
        try:
            response = supabase.table('mobile_users').select("*").eq('email', email).eq('password', password).execute()
            if response.data:
                return jsonify({"status": "success", "user": response.data[0]})
            else:
                return jsonify({"error": "Credenciales inválidas"}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        for u in mobile_users_fallback:
            if u['email'] == email and u['password'] == password:
                return jsonify({"status": "success", "user": u})
        return jsonify({"error": "Credenciales inválidas"}), 401

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
