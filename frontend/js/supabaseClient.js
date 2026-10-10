/**
 * JalSanjeevani (RouteGuard) - Supabase Client & Realtime Layer
 * Connects the frontend to Supabase PostgreSQL & Realtime Websockets.
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
    this.init();
  }

  init() {
    if (typeof window.supabase !== "undefined" && window.supabase.createClient) {
      try {
        this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        this.isConnected = true;
        console.log("🌊 [JalSanjeevani] Supabase client initialized successfully.");
      } catch (err) {
        console.error("🌊 [JalSanjeevani] Supabase init failed:", err);
      }
    } else {
      console.warn("🌊 [JalSanjeevani] Supabase SDK script not found on page.");
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
   * Fetch all villages from Supabase
   */
  async getVillages() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('villages')
        .select('*')
        .order('id', { ascending: true });
      if (error) {
        console.warn("Supabase fetch villages error:", error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Supabase getVillages failed:", e);
      return null;
    }
  }

  /**
   * Fetch all tankers from Supabase
   */
  async getTankers() {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('tankers')
        .select('*')
        .order('id', { ascending: true });
      if (error) {
        console.warn("Supabase fetch tankers error:", error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.warn("Supabase getTankers failed:", e);
      return null;
    }
  }

  /**
   * Update Tanker GPS coordinates and telemetry status
   */
  async updateTankerLocation(tankerId, lat, lng, isRogue = false, status = "active") {
    if (!this.client) return false;
    try {
      const { data, error } = await this.client
        .from('tankers')
        .update({
          lat: lat,
          lng: lng,
          is_rogue: isRogue,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', tankerId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error(`Failed to update tanker ${tankerId}:`, err);
      return false;
    }
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
   * Save Cryptographic Delivery Receipt from Panchayat QR scan
   */
  async saveDeliveryReceipt(receipt) {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('delivery_receipts')
        .insert([{
          village: receipt.village,
          tanker: receipt.tanker,
          volume_liters: receipt.volume || 10000,
          driver_key: receipt.driver_key,
          cistern_key: receipt.cistern_key,
          signature: receipt.signature || 'SHA256:8f4c2e1b9a7d3c5e',
          status: receipt.status || 'VERIFIED_DELIVERED'
        }])
        .select();
      if (error) throw error;
      console.log("🌊 Delivery receipt saved to Supabase:", data);
      return data;
    } catch (err) {
      console.error("Failed to save delivery receipt in Supabase:", err);
      return null;
    }
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
