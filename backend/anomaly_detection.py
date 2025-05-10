import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NetworkAnomalyDetector:
    """
    Class for detecting anomalies in network traffic data using Isolation Forest
    """
    
    def __init__(self, contamination=0.05):
        """
        Initialize the anomaly detector
        
        Args:
            contamination: The expected proportion of anomalies in the data
        """
        self.model = IsolationForest(
            n_estimators=100,
            max_samples='auto',
            contamination=contamination,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        logger.info("NetworkAnomalyDetector initialized")
    
    def extract_features(self, traffic_data):
        """
        Extract features from raw traffic data
        
        Args:
            traffic_data: List of dictionaries with 'timestamp' and 'value' keys
            
        Returns:
            DataFrame with extracted features
        """
        # Convert to DataFrame
        df = pd.DataFrame(traffic_data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Extract time-based features
        df['hour'] = df['timestamp'].dt.hour
        df['minute'] = df['timestamp'].dt.minute
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        
        # Calculate statistical features
        df['rolling_mean_5m'] = df['value'].rolling(window=5, min_periods=1).mean()
        df['rolling_std_5m'] = df['value'].rolling(window=5, min_periods=1).std()
        df['rolling_mean_15m'] = df['value'].rolling(window=15, min_periods=1).mean()
        df['rolling_std_15m'] = df['value'].rolling(window=15, min_periods=1).std()
        
        # Calculate rate of change
        df['diff'] = df['value'].diff()
        df['diff_percentage'] = df['diff'] / df['value'].shift(1) * 100
        
        # Calculate z-scores
        df['z_score_5m'] = (df['value'] - df['rolling_mean_5m']) / df['rolling_std_5m'].replace(0, 1)
        df['z_score_15m'] = (df['value'] - df['rolling_mean_15m']) / df['rolling_std_15m'].replace(0, 1)
        
        # Fill NaN values
        df = df.fillna(0)
        
        return df
    
    def train(self, traffic_data):
        """
        Train the anomaly detection model
        
        Args:
            traffic_data: List of dictionaries with 'timestamp' and 'value' keys
            
        Returns:
            True if training was successful, False otherwise
        """
        if len(traffic_data) < 30:
            logger.warning("Not enough data for training (minimum 30 data points required)")
            return False
        
        try:
            # Extract features
            df = self.extract_features(traffic_data)
            
            # Select features for training
            features = df[[
                'value', 'hour', 'is_weekend',
                'rolling_mean_5m', 'rolling_std_5m',
                'rolling_mean_15m', 'rolling_std_15m',
                'diff', 'diff_percentage',
                'z_score_5m', 'z_score_15m'
            ]].values
            
            # Scale features
            self.scaler = StandardScaler()
            scaled_features = self.scaler.fit_transform(features)
            
            # Train model
            self.model.fit(scaled_features)
            self.is_trained = True
            
            logger.info(f"Model trained successfully on {len(traffic_data)} data points")
            return True
            
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return False
    
    def detect_anomalies(self, traffic_data):
        """
        Detect anomalies in traffic data
        
        Args:
            traffic_data: List of dictionaries with 'timestamp' and 'value' keys
            
        Returns:
            List of dictionaries with anomaly information
        """
        if not self.is_trained:
            logger.warning("Model not trained yet")
            return []
        
        try:
            # Extract features
            df = self.extract_features(traffic_data)
            
            # Select features for prediction
            features = df[[
                'value', 'hour', 'is_weekend',
                'rolling_mean_5m', 'rolling_std_5m',
                'rolling_mean_15m', 'rolling_std_15m',
                'diff', 'diff_percentage',
                'z_score_5m', 'z_score_15m'
            ]].values
            
            # Scale features
            scaled_features = self.scaler.transform(features)
            
            # Predict anomalies
            predictions = self.model.predict(scaled_features)
            anomaly_scores = self.model.decision_function(scaled_features)
            
            # Normalize scores to 0-100 range (lower score = more anomalous)
            min_score = min(anomaly_scores)
            max_score = max(anomaly_scores)
            range_score = max_score - min_score if max_score > min_score else 1
            normalized_scores = [100 - int(((score - min_score) / range_score) * 100) for score in anomaly_scores]
            
            # Find anomalies (where prediction is -1)
            anomalies = []
            for i, (pred, score) in enumerate(zip(predictions, normalized_scores)):
                if pred == -1 and score > 70:  # Only consider significant anomalies
                    # Determine severity based on score
                    if score > 90:
                        severity = 'high'
                    elif score > 80:
                        severity = 'medium'
                    else:
                        severity = 'low'
                    
                    # Determine type of anomaly based on features
                    if df['z_score_5m'].iloc[i] > 3:
                        anomaly_type = 'Traffic Spike'
                        description = 'Unusual increase in network traffic volume detected.'
                    elif df['z_score_5m'].iloc[i] < -3:
                        anomaly_type = 'Traffic Drop'
                        description = 'Unexpected decrease in network traffic volume detected.'
                    elif abs(df['diff_percentage'].iloc[i]) > 50:
                        anomaly_type = 'Sudden Change'
                        description = 'Sudden change in traffic pattern detected.'
                    else:
                        anomaly_type = 'Pattern Anomaly'
                        description = 'Unusual traffic pattern detected that deviates from normal behavior.'
                    
                    anomalies.append({
                        'timestamp': df['timestamp'].iloc[i].isoformat(),
                        'value': float(df['value'].iloc[i]),
                        'severity': severity,
                        'type': anomaly_type,
                        'score': score,
                        'description': description,
                        'features': {
                            'z_score_5m': float(df['z_score_5m'].iloc[i]),
                            'z_score_15m': float(df['z_score_15m'].iloc[i]),
                            'diff_percentage': float(df['diff_percentage'].iloc[i])
                        }
                    })
            
            logger.info(f"Detected {len(anomalies)} anomalies in {len(traffic_data)} data points")
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
