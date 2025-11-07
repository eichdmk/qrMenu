import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ordersAPI } from '../api/orders';
import { toast } from 'react-toastify';

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    
    if (!window.notificationAudioContext) {
      window.notificationAudioContext = new AudioContext();
    }

    const audioContext = window.notificationAudioContext;

    audioContext.resume().then(() => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 600;
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

     
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 800;
        oscillator2.type = 'square';

        gainNode2.gain.setValueAtTime(0.6, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.25);
      }, 80);
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const useOrdersSSE = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const latestOrderIdsRef = useRef(new Set());

  const LIMIT = 12;

  const fetchOrders = useCallback(async (reset = false, currentOffset = 0) => {
    try {
      if (reset) {
        currentOffset = 0;
      }
      
      setLoading(true);
      const response = await ordersAPI.getAll(LIMIT, currentOffset);
      
      const fetchedOrders = response.data.orders || response.data;
      
      if (reset) {
        setOrders(fetchedOrders);
        latestOrderIdsRef.current = new Set(fetchedOrders.map(o => o.id));
      } else {
        setOrders(prev => [...prev, ...fetchedOrders]);
      }
      
      setOffset(currentOffset + LIMIT);
      setHasMore(response.data.pagination?.hasMore || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchOrders(false, offset);
  }, [hasMore, loading, fetchOrders, offset]);

  const connectToSSE = () => {
    try {
      const apiUrl =
        (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
        (typeof process !== "undefined" && process.env && process.env.VITE_API_URL) ||
        "http://localhost:3000";
      const eventSource = new EventSource(`${apiUrl}/api/orders/stream`);
      
      eventSource.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('Connected to orders stream:', data.clientId);
          } else if (data.type === 'new_order' && data.orders) {
            const newOrders = data.orders.filter(order => 
              !latestOrderIdsRef.current.has(order.id)
            );

            if (newOrders.length > 0) {
              console.log('New orders received:', newOrders.length);
              
              playNotificationSound();
              
              newOrders.forEach(order => latestOrderIdsRef.current.add(order.id));
              
              setOrders(prevOrders => {
                const newOrderIds = new Set(newOrders.map(o => o.id));
                const filteredPrev = prevOrders.filter(o => !newOrderIds.has(o.id));
                return [...newOrders, ...filteredPrev];
              });

              if (newOrders.length === 1) {
                toast.success(`Новый заказ #${newOrders[0].id}!`, {
                  position: 'top-right',
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                });
              } else if (newOrders.length > 1) {
                toast.success(`${newOrders.length} новых заказов!`, {
                  position: 'top-right',
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                });
              }
            }
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        // Переподключаемся через 3 секунды
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!eventSourceRef.current) {
            connectToSSE();
          }
        }, 3000);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error connecting to SSE:', error);
      setIsConnected(false);
    }
  };

  const updateOrderStatus = useCallback(async (id, status) => {
    try {
      const response = await ordersAPI.updateStatus(id, { status });
      setOrders(prev => prev.map(order => order.id === id ? response.data : order));
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchOrders(true);
    connectToSSE();

    // Очистка при размонтировании
    return () => {
      // Закрываем SSE соединение
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      // Очищаем таймер переподключения
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    orders,
    loading,
    error,
    isConnected,
    hasMore,
    loadMore,
    refetch: () => {
      setOffset(0);
      fetchOrders(true);
    },
    updateOrderStatus,
  };
};
