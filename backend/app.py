# backend/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
import logging
from datetime import datetime, timedelta
from network_capture import NetworkCapture

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

capture = NetworkCapture(update_interval=0.1)  # 100ms updates

def emit_network_data(metrics):
    socketio.emit('network_update', metrics)
    if metrics['anomalies']:
        socketio.emit('new_anomalies', metrics['anomalies'])

@app.route('/api/network/overview', methods=['GET'])
def get_network_overview():
    metrics = capture._get_metrics()
    stats = {
        'devices': len(metrics['devices']),
        'traffic_rate': f"{metrics['traffic_data'][-1]['value']:.2f} Mbps" if metrics['traffic_data'] else "0 Mbps",
        'alert_count': len([a for a in metrics['anomalies'] if a['severity'] in ['high', 'medium']]),
        'anomaly_count': len(metrics['anomalies'])
    }
    return jsonify({
        'stats': stats,
        'traffic_data': metrics['traffic_data'],
        'protocol_distribution': metrics['protocol_distribution'],
        'top_talkers': metrics['top_talkers'],
        'recent_anomalies': metrics['anomalies'],
        'devices': metrics['devices']
    })

@app.route('/api/network/traffic', methods=['GET'])
def get_traffic_data():
    hours = request.args.get('hours', default=24, type=int)
    start_time = (datetime.now() - timedelta(hours=hours)).isoformat()
    metrics = capture._get_metrics()
    filtered_data = [
        data for data in metrics['traffic_data']
        if data['timestamp'] >= start_time
    ]
    return jsonify(filtered_data)

@app.route('/api/network/anomalies', methods=['GET'])
def get_anomalies():
    severity = request.args.get('severity', default=None)
    hours = request.args.get('hours', default=24, type=int)
    start_time = (datetime.now() - timedelta(hours=hours)).isoformat()
    metrics = capture._get_metrics()
    filtered_anomalies = metrics['anomalies']
    if severity:
        filtered_anomalies = [
            a for a in filtered_anomalies if a['severity'] == severity
        ]
    filtered_anomalies = [
        a for a in filtered_anomalies if a['timestamp'] >= start_time
    ]
    return jsonify(filtered_anomalies)

@app.route('/api/network/devices', methods=['GET'])
def get_devices():
    metrics = capture._get_metrics()
    return jsonify(metrics['devices'])

@app.route('/api/network/top-talkers', methods=['GET'])
def get_top_talkers():
    metrics = capture._get_metrics()
    return jsonify(metrics['top_talkers'])

@socketio.on('connect')
def handle_connect():
    logger.info("Client connected to Socket.IO")
    capture.start_capture(emit_network_data)

@socketio.on('disconnect')
def handle_disconnect():
    logger.info("Client disconnected from Socket.IO")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)