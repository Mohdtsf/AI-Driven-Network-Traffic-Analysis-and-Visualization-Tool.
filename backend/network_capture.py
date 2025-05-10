# backend/network_capture.py
import pyshark
import logging
from datetime import datetime
import time
import threading
from collections import defaultdict, Counter
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import socket

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NetworkCapture:
    def __init__(self, interface=None, capture_file=None, update_interval=0.1):
        self.interface = interface or r'\Device\NPF_{45692769-9AC4-42E2-8BCB-29B6877DBABA}'  # Wi-Fi
        self.capture_file = capture_file
        self.update_interval = update_interval  # 100ms updates
        self.running = False
        self.traffic_data = []
        self.protocol_counts = Counter()
        self.device_traffic = defaultdict(lambda: {'inbound': 0, 'outbound': 0, 'packets': 0})
        self.devices = {}  # ip -> {name, type, connections, anomalous}
        self.anomalies = []
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.scaler = StandardScaler()
        self.model_trained = False
        self.name_cache = {}  # Cache for resolved device names

    def _resolve_device_name(self, ip):
        """Resolve device name via reverse DNS or static mapping, with caching."""
        if ip in self.name_cache:
            return self.name_cache[ip]

        # Static mapping for known devices
        static_mapping = {
            '192.168.1.1': 'Gateway Router',
            '192.168.1.2': 'Main Switch',
        }
        if ip in static_mapping:
            self.name_cache[ip] = static_mapping[ip]
            return static_mapping[ip]

        try:
            hostname, _, _ = socket.gethostbyaddr(ip)
            name = hostname.split('.')[0]  # Use short name
        except (socket.herror, socket.gaierror):
            name = ip  # Fallback to IP if DNS fails
        self.name_cache[ip] = name
        return name

    def start_capture(self, callback):
        self.running = True
        threading.Thread(target=self._capture_loop, args=(callback,), daemon=True).start()

    def stop_capture(self):
        self.running = False

    def _capture_loop(self, callback):
        try:
            capture = pyshark.LiveCapture(interface=self.interface, use_json=True, include_raw=False)
            start_time = time.time()
            packet_buffer = []
            last_update = start_time

            for packet in capture.sniff_continuously():
                if not self.running:
                    break

                packet_buffer.append(packet)
                current_time = time.time()

                if current_time - last_update >= self.update_interval:
                    self._process_packets(packet_buffer, current_time - start_time)
                    self._detect_anomalies()
                    callback(self._get_metrics())
                    packet_buffer = []
                    last_update = current_time

        except Exception as e:
            logger.error(f"Live capture failed: {e}")
            self.running = False

    def _process_packets(self, packets, elapsed_time):
        bytes_total = 0
        for packet in packets:
            try:
                bytes_total += int(packet.length)
                protocol = packet.highest_layer.lower()
                self.protocol_counts[protocol] += 1

                src_ip = packet.ip.src if 'ip' in packet else None
                dst_ip = packet.ip.dst if 'ip' in packet else None
                if src_ip and dst_ip:
                    # Initialize device if new
                    if src_ip not in self.devices:
                        self.devices[src_ip] = {
                            'name': self._resolve_device_name(src_ip),
                            'type': 'client',  # Could infer type
                            'connections': set(),
                            'anomalous': False
                        }
                    if dst_ip not in self.devices:
                        self.devices[dst_ip] = {
                            'name': self._resolve_device_name(dst_ip),
                            'type': 'client',
                            'connections': set(),
                            'anomalous': False
                        }

                    # Track connections
                    self.devices[src_ip]['connections'].add(dst_ip)
                    self.devices[dst_ip]['connections'].add(src_ip)

                    # Update traffic stats
                    self.device_traffic[src_ip]['outbound'] += int(packet.length)
                    self.device_traffic[src_ip]['packets'] += 1
                    self.device_traffic[dst_ip]['inbound'] += int(packet.length)
                    self.device_traffic[dst_ip]['packets'] += 1

                    # Mark as anomalous if packet count is high
                    if self.device_traffic[src_ip]['packets'] > 1000:
                        self.devices[src_ip]['anomalous'] = True
                    if self.device_traffic[dst_ip]['packets'] > 1000:
                        self.devices[dst_ip]['anomalous'] = True

            except AttributeError:
                continue

        traffic_rate = (bytes_total * 8 / 1_000_000) / self.update_interval  # Mbps
        self.traffic_data.append({
            'timestamp': datetime.now().isoformat(),
            'value': traffic_rate
        })
        if len(self.traffic_data) > 1000:
            self.traffic_data = self.traffic_data[-1000:]

    def _detect_anomalies(self):
        if len(self.traffic_data) < 60:
            return

        df = pd.DataFrame(self.traffic_data[-60:])
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['value'] = df['value'].astype(float)
        df['rolling_mean'] = df['value'].rolling(window=5, min_periods=1).mean()
        df['rolling_std'] = df['value'].rolling(window=5, min_periods=1).std()
        df['z_score'] = (df['value'] - df['rolling_mean']) / df['rolling_std'].replace(0, 1)
        df = df.fillna(0)

        features = df[['value', 'rolling_mean', 'rolling_std', 'z_score']].values

        if not self.model_trained:
            self.scaler = StandardScaler()
            scaled_features = self.scaler.fit_transform(features)
            self.model.fit(scaled_features)
            self.model_trained = True
        else:
            scaled_features = self.scaler.transform(features)

        predictions = self.model.predict(scaled_features)
        anomaly_scores = self.model.decision_function(scaled_features)

        current_anomalies = []
        for i, (pred, score) in enumerate(zip(predictions, anomaly_scores)):
            if pred == -1 and abs(score) > 0.1:
                timestamp = df['timestamp'].iloc[i]
                severity = 'high' if abs(score) > 0.5 else 'medium' if abs(score) > 0.3 else 'low'
                anomaly_type = 'Traffic Spike' if df['z_score'].iloc[i] > 2 else 'Traffic Drop' if df['z_score'].iloc[i] < -2 else 'Pattern Anomaly'
                description = f"{anomaly_type} detected with score {abs(score):.2f}"
                source = max(self.device_traffic.items(), key=lambda x: x[1]['packets'], default=('unknown', {}))[0]

                anomaly = {
                    'id': len(self.anomalies) + len(current_anomalies) + 1,
                    'timestamp': timestamp.isoformat(),
                    'severity': severity,
                    'type': anomaly_type,
                    'source': source,
                    'score': abs(score) * 100,
                    'description': description
                }
                current_anomalies.append(anomaly)

        if current_anomalies:
            self.anomalies.extend(current_anomalies)
            self.anomalies = self.anomalies[-100:]

    def _get_metrics(self):
        total_packets = sum(self.protocol_counts.values())
        protocol_distribution = {
            proto: (count / total_packets * 100) if total_packets > 0 else 0
            for proto, count in self.protocol_counts.items()
        }

        top_talkers = [
            {
                'ip': ip,
                'name': self.devices.get(ip, {'name': self._resolve_device_name(ip)})['name'],
                'inbound': stats['inbound'] * 8 / 1_000_000 / self.update_interval,  # Mbps
                'outbound': stats['outbound'] * 8 / 1_000_000 / self.update_interval,  # Mbps
                'total': (stats['inbound'] + stats['outbound']) * 8 / 1_000_000 / self.update_interval,
                'is_anomalous': stats['packets'] > 1000
            }
            for ip, stats in sorted(
                self.device_traffic.items(),
                key=lambda x: x[1]['inbound'] + x[1]['outbound'],
                reverse=True
            )[:10]
        ]

        devices = [
            {
                'id': ip,
                'name': info['name'],
                'type': info['type'],
                'ip': ip,
                'connections': list(info['connections']),
                'anomalous': info['anomalous'],
                'inbound': stats['inbound'] * 8 / 1_000_000 / self.update_interval,  # Mbps
                'outbound': stats['outbound'] * 8 / 1_000_000 / self.update_interval,  # Mbps
                'total': (stats['inbound'] + stats['outbound']) * 8 / 1_000_000 / self.update_interval
            }
            for ip, (info, stats) in [
                (ip, (self.devices.get(ip, {'name': self._resolve_device_name(ip), 'type': 'client', 'connections': set(), 'anomalous': False}), self.device_traffic.get(ip, {'inbound': 0, 'outbound': 0, 'packets': 0})))
                for ip in set(self.devices.keys()) | set(self.device_traffic.keys())
            ]
        ]

        return {
            'traffic_data': self.traffic_data[-1:] if self.traffic_data else [],
            'protocol_distribution': protocol_distribution,
            'top_talkers': top_talkers,
            'anomalies': self.anomalies[-10:],
            'devices': devices
        }