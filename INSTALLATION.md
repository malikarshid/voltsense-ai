# VoltSense AI — Local Installation Guide

## System Requirements
- **OS:** Windows 10/11, Ubuntu 20.04+, or macOS
- **Node.js:** v18.17+ or v20+
- **Python:** 3.10 to 3.14
- **RAM:** Minimum 4GB (8GB recommended for 3D WebGL rendering)

---

## 1. Clone Repository & Directory Structure
```bash
git clone https://github.com/your-username/voltsense-ai.git
cd voltsense-ai
```

---

## 2. Backend Setup
1. Open a terminal in `./backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   
   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Train the ML models:
   ```bash
   python ml/train_model.py
   ```
5. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

---

## 3. Frontend Setup
1. In a separate terminal, navigate to `./frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Hardware Simulation Test (Optional)
To test MQTT ingestion:
```bash
python hardware/mqtt_publisher_example.py
```
