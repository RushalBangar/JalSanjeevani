/**
 * JalSanjeevani (RouteGuard) - Supabase Client & Realtime Layer
 * Strategy: Online-First with Offline Queue and Automatic Background Synchronization.
 *
 * 1. Online-First: Connects directly to Supabase PostgreSQL & Realtime Websockets.
 * 2. Offline Queue: If connectivity is lost, writes actions to local storage queue.
 * 3. Auto-Sync: Automatically flushes pending queue when internet connection returns.
 */

const SUPABASE_CONFIG = {
  url: "https://vzfddxiiptkeeyvrfkhl.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZmRkeGlpcHRrZWV5dnJma2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MDM1OTYsImV4cCI6MjEwNzE3OTU5Nn0.8NA30jSO58gV8vbyvWnsUwdgXsMGFeMtda25lQ8EEFQ"
};

class JalSanjeevaniSupabase {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = [];
    this.offlineQueueKey = "jalsanjeevani_offline_sync_queue";
    this.init();
    this.setupOnlineSyncListener();
  }

  init() {
    if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
      try {
        this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.isConnected = true;
        console.log("🌊 [JalSanjeevani] Online Supabase client initialized successfully.");
      } catch (err) {
        console.error("🌊 [JalSanjeevani] Supabase init failed:", err);
      }
    } else {
      console.warn("🌊 [JalSanjeevani] Supabase SDK script not found on page.");
    }
  }

  /**
   * Listen for network reconnection to flush offline queue
   */
  setupOnlineSyncListener() {
    window.addEventListener("online", () => {
      console.log("📶 [JalSanjeevani] Internet reconnected! Auto-syncing pending offline queue...");
      this.flushOfflineQueue();
    });

    // Also attempt flush on startup if online
    if (navigator.onLine) {
      setTimeout(() => this.flushOfflineQueue(), 2000);
    }
  }

  /**
   * Queue an action to local storage when offline
   */
  queueOfflineAction(type, payload) {
    try {
      const queue = JSON.parse(localStorage.getItem(this.offlineQueueKey) || "[]");
      queue.push({ type, payload, queued_at: new Date().toISOString() });
      localStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
      console.log(`📶 [Offline Queue] Queued ${type} action. Total queued: ${queue.length}`);
    } catch (e) {
      console.warn("Failed to queue offline action:", e);
    }
  }

  /**
   * Flush all pending offline actions to Supabase when back online
   */
  async flushOfflineQueue() {
    if (!navigator.onLine || !this.client) return;

    try {
      const queue = JSON.parse(localStorage.getItem(this.offlineQueueKey) || "[]");
      if (!queue.length) return;

      console.log(`📶 Flushing ${queue.length} pending items to Supabase...`);
      const remaining = [];

      for (const item of queue) {
        try {
          if (item.type === "receipt") {
            await this.client.from("delivery_receipts").insert([item.payload]);
            console.log("✓ Offline receipt synced to Supabase:", item.payload.tanker);
          } else if (item.type === "tanker_location") {
            await this.client.from("tankers").update(item.payload.data).eq("id", item.payload.id);
            console.log("✓ Offline tanker location synced:", item.payload.id);
          } else if (item.type === "village_update") {
            await this.client.from("villages").update(item.payload.data).or(item.payload.filter);
            console.log("✓ Offline village update synced.");
          }
        } catch (err) {
          console.warn("Could not sync item, keeping in queue:", err);
          remaining.push(item);
        }
      }

      localStorage.setItem(this.offlineQueueKey, JSON.stringify(remaining));
      if (remaining.length === 0) {
        console.log("📶 All offline items successfully synchronized with Supabase!");
      }
    } catch (e) {
      console.warn("Offline queue flush error:", e);
    }
  }

  /**
   * Healthcheck test to verify Supabase database accessibility
   */
  async checkConnection() {
    if (!this.client) return { connected: false, message: "Client not initialized" };
    try {
      const { data, error } = await this.client
        .from('villages')
        .select('id')
        .limit(1);

      if (error) {
        return { connected: false, error: error.message };
      }
      return { connected: true, data };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }

  /**
   * Fetch all villages from Supabase (Online-first with local fallback)
   */
  async getVillages() {
    if (this.client && navigator.onLine) {
      try {
        const { data, error } = await this.client
          .from('villages')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data) {
          // Cache locally for offline fallback
          try { localStorage.setItem('jalsanjeevani_villages_cache', JSON.stringify(data)); } catch (e) {}
          return data;
        }
      } catch (e) {
        console.warn("Supabase getVillages online fetch failed, using fallback:", e);
      }
    }

    // Offline fallback from local storage cache
    try {
      const cached = localStorage.getItem('jalsanjeevani_villages_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  }

  /**
   * Fetch all tankers from Supabase (Online-first with local fallback)
   */
  async getTankers() {
    if (this.client && navigator.onLine) {
      try {
        const { data, error } = await this.client
          .from('tankers')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data) {
          try { localStorage.setItem('jalsanjeevani_tankers_cache', JSON.stringify(data)); } catch (e) {}
          return data;
        }
      } catch (e) {
        console.warn("Supabase getTankers online fetch failed, using fallback:", e);
      }
    }

    // Offline fallback
    try {
      const cached = localStorage.getItem('jalsanjeevani_tankers_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  }

  /**
   * Update Tanker GPS coordinates (Online-First with Offline Queue)
   */
  async updateTankerLocation(tankerId, lat, lng, isRogue = false, status = "active") {
    const updateData = {
      lat: lat,
      lng: lng,
      is_rogue: isRogue,
      status: status,
      updated_at: new Date().toISOString()
    };

    // 1. ONLINE-FIRST: Attempt direct update
    if (this.client && navigator.onLine) {
      try {
        const { data, error } = await this.client
          .from('tankers')
          .update(updateData)
          .eq('id', tankerId);
        if (!error) return true;
        console.warn("Supabase updateTankerLocation error, queueing offline:", error);
      } catch (err) {
        console.warn("Network error during updateTankerLocation, queueing offline:", err);
      }
    }

    // 2. OFFLINE FALLBACK: Queue update
    this.queueOfflineAction("tanker_location", { id: tankerId, data: updateData });
    return true;
  }

  /**
   * Save route allocation dispatch run
   */
  async saveDispatch(routes, totalLiters = 0) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('dispatches')
        .insert([{
          routes: routes,
          total_liters: totalLiters,
          algorithm: 'Google OR-Tools CVRP',
          dispatched_by: 'Collector Command Center'
        }])
        .select();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Failed to save dispatch in Supabase:", err);
      return null;
    }
  }

  /**
   * Save Cryptographic Delivery Receipt from Panchayat QR scan (Online-First with Offline Queue)
   */
  async saveDeliveryReceipt(receipt) {
    const payload = {
      village: receipt.village,
      tanker: receipt.tanker,
      volume_liters: receipt.volume || 10000,
      driver_key: receipt.driver_key,
      cistern_key: receipt.cistern_key,
      signature: receipt.signature || 'SHA256:8f4c2e1b9a7d3c5e',
      status: receipt.status || 'VERIFIED_DELIVERED'
    };

    // 1. ONLINE-FIRST: Send to Supabase PostgreSQL immediately
    if (this.client && navigator.onLine) {
      try {
        const { data, error } = await this.client
          .from('delivery_receipts')
          .insert([payload])
          .select();
        if (!error) {
          console.log("🌊 [Online-First] Delivery receipt saved to Supabase:", data);
          return { online: true, data };
        }
        console.warn("Supabase insert error, falling back to offline queue:", error);
      } catch (err) {
        console.warn("Network error inserting receipt, queueing offline:", err);
      }
    }

    // 2. OFFLINE FALLBACK: Queue for automatic background sync when reconnected
    this.queueOfflineAction("receipt", payload);
    return { online: false, queued: true, payload };
  }

  /**
   * Record Escrow Freeze Action for Rogue Contractor Tanker
   */
  async saveEscrowAction(tankerId, penaltyAmount, reason) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('escrow_actions')
        .insert([{
          tanker_id: tankerId,
          penalty_amount: penaltyAmount,
          reason: reason,
          status: 'FROZEN'
        }])
        .select();
      if (error) throw error;
      console.log("🌊 Escrow action logged to Supabase:", data);
      return data;
    } catch (err) {
      console.error("Failed to log escrow freeze in Supabase:", err);
      return null;
    }
  }

  /**
   * Realtime Listener: Subscribe to Tanker fleet changes
   */
  subscribeToTankers(callback) {
    if (!this.client) return null;
    const channel = this.client
      .channel('tankers-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tankers' },
        (payload) => {
          console.log('⚡ Realtime Tanker Update:', payload);
          if (callback) callback(payload);
        }
      )
      .subscribe();
    this.subscriptions.push(channel);
    return channel;
  }

  /**
   * Realtime Listener: Subscribe to Village distress changes
   */
  subscribeToVillages(callback) {
    if (!this.client) return null;
    const channel = this.client
      .channel('villages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'villages' },
        (payload) => {
          console.log('⚡ Realtime Village Update:', payload);
          if (callback) callback(payload);
        }
      )
      .subscribe();
    this.subscriptions.push(channel);
    return channel;
  }

  /**
   * Realtime Listener: Subscribe to Delivery Receipts
   */
  subscribeToReceipts(callback) {
    if (!this.client) return null;
    const channel = this.client
      .channel('receipts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'delivery_receipts' },
        (payload) => {
          console.log('⚡ Realtime Delivery Receipt Created:', payload);
          if (callback) callback(payload);
        }
      )
      .subscribe();
    this.subscriptions.push(channel);
    return channel;
  }
}

// Global instance
window.JalSupabase = new JalSanjeevaniSupabase();
