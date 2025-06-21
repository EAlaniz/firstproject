import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface WhoopWebhookData {
  recovery?: any;
  workouts?: any[];
  sleep?: any;
  lastUpdate?: Date;
}

export function useWhoopWebhooks(userId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [webhookData, setWebhookData] = useState<WhoopWebhookData>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    const socketInstance = io(import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001');
    
    socketInstance.on('connect', () => {
      console.log('Connected to webhook server');
      setIsConnected(true);
      socketInstance.emit('join_user', userId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from webhook server');
      setIsConnected(false);
    });

    // Listen for WHOOP data updates
    socketInstance.on('recovery_update', (data) => {
      console.log('Recovery update received:', data);
      setWebhookData(prev => ({
        ...prev,
        recovery: data,
        lastUpdate: new Date()
      }));
    });

    socketInstance.on('workout_update', (data) => {
      console.log('Workout update received:', data);
      setWebhookData(prev => ({
        ...prev,
        workouts: [...(prev.workouts || []), data.workout],
        lastUpdate: new Date()
      }));
    });

    socketInstance.on('sleep_update', (data) => {
      console.log('Sleep update received:', data);
      setWebhookData(prev => ({
        ...prev,
        sleep: data,
        lastUpdate: new Date()
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  // Register webhook with WHOOP
  const registerWebhook = async (accessToken: string) => {
    if (!userId) {
      throw new Error('User ID required');
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_WEBHOOK_SERVER_URL || 'http://localhost:3001'}/api/register-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Webhook registration failed');
      }

      const result = await response.json();
      setIsRegistered(true);
      console.log('Webhook registered successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Webhook registration error:', error);
      throw error;
    }
  };

  // Get current webhook data
  const getWebhookData = () => {
    return webhookData;
  };

  // Convert webhook data to standardized format
  const getStandardizedData = () => {
    if (!webhookData.recovery && (!webhookData.workouts || webhookData.workouts.length === 0)) {
      return null;
    }

    // Calculate steps from workouts
    const totalSteps = (webhookData.workouts || []).reduce((sum, workout) => {
      const distanceMeters = workout.score?.distance_meter || 0;
      return sum + Math.round(distanceMeters * 1.3); // Rough conversion
    }, 0);

    return {
      steps: totalSteps,
      heartRate: webhookData.recovery?.score?.resting_heart_rate,
      distance: (webhookData.workouts || []).reduce((sum, workout) => {
        return sum + (workout.score?.distance_meter || 0);
      }, 0) / 1000, // Convert to km
      calories: (webhookData.workouts || []).reduce((sum, workout) => {
        return sum + (workout.score?.kilojoule || 0) * 0.239; // Convert kJ to calories
      }, 0),
      lastSync: webhookData.lastUpdate || new Date(),
      source: 'whoop' as const,
      // WHOOP-specific data
      recoveryScore: webhookData.recovery?.score?.recovery_score,
      hrv: webhookData.recovery?.score?.hrv_rmssd_milli,
      strain: (webhookData.workouts || []).reduce((max, workout) => {
        return Math.max(max, workout.score?.strain || 0);
      }, 0),
      sleepHours: webhookData.sleep?.score?.stage_summary?.total_in_bed_time_milli ? 
        webhookData.sleep.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60) : undefined
    };
  };

  return {
    isConnected,
    isRegistered,
    webhookData,
    registerWebhook,
    getWebhookData,
    getStandardizedData
  };
}