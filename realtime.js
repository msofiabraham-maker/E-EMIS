/**
 * realtime.js - Supabase Realtime Synchronization Engine
 * Enables multi-device synchronization with automatic updates
 * Subscribes to database changes and notifies UI components
 */

class RealtimeSync {
  constructor() {
    this.subscriptions = {};
    this.listeners = {};
    this.isConnected = false;
  }

  /**
   * Initialize realtime subscriptions for all critical tables
   * Call this after Supabase client is ready
   */
  async initialize(supabaseClient) {
    if (!supabaseClient) {
      console.error('RealtimeSync: Supabase client not provided');
      return;
    }

    if (!Config.get('enableRealtime')) {
      console.log('RealtimeSync: Realtime synchronization disabled via config');
      return;
    }

    this.supabaseClient = supabaseClient;

    try {
      // Subscribe to learners table changes
      this.subscribeToTable('learners', () => {
        this.notifyListeners('learners_changed');
      });

      // Subscribe to results table changes
      this.subscribeToTable('results', () => {
        this.notifyListeners('results_changed');
      });

      // Subscribe to schools table changes
      this.subscribeToTable('schools', () => {
        this.notifyListeners('schools_changed');
      });

      // Subscribe to result_subjects table changes
      this.subscribeToTable('result_subjects', () => {
        this.notifyListeners('result_subjects_changed');
      });

      this.isConnected = true;
      console.log('✓ Realtime synchronization initialized successfully');
    } catch (error) {
      console.error('Failed to initialize realtime subscriptions:', error);
    }
  }

  /**
   * Subscribe to a specific table for all changes
   */
  subscribeToTable(tableName, onChangeCallback) {
    if (!this.supabaseClient) {
      console.warn(`RealtimeSync: Cannot subscribe to ${tableName}, Supabase client not available`);
      return;
    }

    const channelName = `${tableName}-all-changes`;
    const channel = this.supabaseClient.channel(channelName);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => {
        const eventId = payload?.eventType || payload?.type || 'unknown';
        const recordId = payload?.new?.id || payload?.old?.id || 'unknown';

        console.log(`Realtime payload received: table=${tableName}, event=${eventId}, record=${recordId}`, payload);
        Config.debug(`Realtime update on ${tableName}:`, payload);

        if (payload.eventType === 'INSERT') {
          this.notifyListeners(`${tableName}_inserted`, payload.new);
        } else if (payload.eventType === 'UPDATE') {
          this.notifyListeners(`${tableName}_updated`, payload.new);
        } else if (payload.eventType === 'DELETE') {
          this.notifyListeners(`${tableName}_deleted`, payload.old);
        }

        if (onChangeCallback) onChangeCallback(payload);
      }
    );

    channel.on('subscription_succeeded', () => {
      console.log(`✓ Realtime channel joined successfully: ${channelName} (state=${channel.state || 'unknown'})`);
    });

    channel.on('subscription_error', (error) => {
      console.error(`Realtime channel failed to join: ${channelName}`, error, { state: channel.state });
    });

    channel.on('open', () => {
      console.log(`Realtime transport open for channel: ${channelName}`);
    });

    channel.on('close', () => {
      console.warn(`Realtime transport closed for channel: ${channelName}`);
    });

    channel.on('error', (error) => {
      console.error(`Realtime channel error for ${channelName}:`, error, { state: channel.state });
    });

    channel.subscribe();
    this.subscriptions[tableName] = channel;
    console.log(`✓ Subscribed to realtime changes on table: ${tableName} (channel=${channelName}, state=${channel.state || 'unknown'})`);

    setTimeout(() => {
      console.log(`Realtime channel state check: ${channelName} => ${channel.state || 'unknown'}`);
    }, 2500);
  }

  /**
   * Subscribe to specific filtered records (e.g., learners in a specific zone)
   */
  subscribeToRecords(tableName, filter, onChangeCallback) {
    if (!this.supabaseClient) {
      console.warn(`RealtimeSync: Cannot subscribe to ${tableName}, Supabase client not available`);
      return;
    }

    const channelName = `${tableName}-filtered-${Math.random().toString(36).substr(2, 9)}`;
    const channel = this.supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter, // e.g., "school_id=eq.uuid-value"
        },
        (payload) => {
          Config.debug(`Realtime filtered update on ${tableName}:`, payload);
          if (onChangeCallback) onChangeCallback(payload);
        }
      )
      .subscribe();

    return { channel, name: channelName };
  }

  /**
   * Register a listener for realtime events
   */
  addEventListener(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  /**
   * Remove a listener
   */
  removeEventListener(eventName, callback) {
    if (!this.listeners[eventName]) return;
    const index = this.listeners[eventName].indexOf(callback);
    if (index > -1) {
      this.listeners[eventName].splice(index, 1);
    }
  }

  /**
   * Notify all listeners of an event
   */
  notifyListeners(eventName, data = null) {
    if (!this.listeners[eventName]) return;
    this.listeners[eventName].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${eventName}:`, error);
      }
    });
  }

  /**
   * Unsubscribe from a table
   */
  unsubscribeFromTable(tableName) {
    if (this.subscriptions[tableName]) {
      this.supabaseClient.removeChannel(this.subscriptions[tableName]);
      delete this.subscriptions[tableName];
      console.log(`✓ Unsubscribed from table: ${tableName}`);
    }
  }

  /**
   * Clean up all subscriptions
   */
  async cleanup() {
    try {
      for (const tableName of Object.keys(this.subscriptions)) {
        this.unsubscribeFromTable(tableName);
      }
      this.listeners = {};
      this.isConnected = false;
      console.log('✓ Realtime synchronization cleaned up');
    } catch (error) {
      console.error('Error during realtime cleanup:', error);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      enabledTables: Object.keys(this.subscriptions),
      registeredListeners: Object.keys(this.listeners),
    };
  }
}

// Create and export singleton instance
const Realtime = new RealtimeSync();
window.Realtime = Realtime;
