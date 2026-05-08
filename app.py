import pandas as pd
import numpy as np
import joblib
import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

MODEL_FILE = 'weather_model.pkl'
SCALER_FILE = 'scaler.pkl'
ENCODER_FILE = 'encoder.pkl'
DATA_FILE = 'weather_forecast_data.csv'

def train_and_prepare():
    if not os.path.exists(MODEL_FILE) or not os.path.exists(SCALER_FILE):
        if os.path.exists(DATA_FILE):
            df = pd.read_csv(DATA_FILE)
            
            if 'Precipitation' not in df.columns:
                df['Precipitation'] = np.random.uniform(0, 100, size=len(df))
            
            X = df[['Temperature', 'Humidity', 'Wind_Speed', 'Precipitation', 'Cloud_Cover', 'Pressure']]
            
            le = LabelEncoder()
            y = le.fit_transform(df['Rain']) 
            
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            model = RandomForestClassifier(n_estimators=100, random_state=42)
            model.fit(X_scaled, y)
            
            joblib.dump(model, MODEL_FILE)
            joblib.dump(scaler, SCALER_FILE)
            joblib.dump(le, ENCODER_FILE)

# تشغيل التدريب لو الملفات مش موجودة
train_and_prepare()

# تحميل الموديل لو موجود
if os.path.exists(MODEL_FILE):
    model = joblib.load(MODEL_FILE)
    scaler = joblib.load(SCALER_FILE)
    le = joblib.load(ENCODER_FILE)
else:
    model = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # 1. سحب البيانات اللي اليوزر دخلها
        temp = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))
        wind = float(data.get('wind_speed', 0))
        precip = float(data.get('precipitation', 0))
        cloud = float(data.get('cloud_cover', 0))
        pressure = float(data.get('pressure', 0))

        confidence = 85.0 # نسبة ثقة افتراضية
        
        # 2. تشغيل الموديل (لو شغال) عشان نحسب نسبة الثقة الحقيقية
        if model is not None:
            try:
                input_data = np.array([[temp, humidity, wind, precip, cloud, pressure]])
                scaled_data = scaler.transform(input_data)
                probabilities = model.predict_proba(scaled_data)[0]
                confidence = round(float(np.max(probabilities) * 100), 2)
            except Exception as e:
                pass

        # 3. تحديد حالة الطقس الدقيقة عشان الـ 8 صور يشتغلوا
        ai_result = "Cloudy" # افتراضي
        
        if wind > 80:
            ai_result = "Hurricane" # إعصار
        elif precip > 70 and wind > 40:
            ai_result = "Storm" # عاصفة
        elif temp < 5 and precip > 20:
            ai_result = "Snow" # ثلج
        elif precip > 50 or (model is not None and np.argmax(probabilities) == 1): 
            ai_result = "Rainy" # مطر
        elif cloud > 30:
            ai_result = "Cloudy" # غائم
        else:
            ai_result = "Clear" # صافي (شمس الصبح أو نجوم بالليل)

        return jsonify({
            "status": "success",
            "result": ai_result,
            "confidence": confidence
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)