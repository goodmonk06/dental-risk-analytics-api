/**
 * Metrics collection and reporting
 *
 * Provides a lightweight abstraction for collecting application metrics.
 * In production, this can be connected to Prometheus, DataDog, etc.
 */

export interface MetricLabels {
  [key: string]: string | number;
}

export interface Counter {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

export interface Gauge {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

export interface Histogram {
  name: string;
  value: number;
  labels?: MetricLabels;
  timestamp: Date;
}

class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram[]> = new Map();

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: MetricLabels, value: number = 1): void {
    const key = this.getKey(name, labels);
    const existing = this.counters.get(key);

    if (existing) {
      existing.value += value;
      existing.timestamp = new Date();
    } else {
      this.counters.set(key, {
        name,
        value,
        labels,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Set a gauge metric (current value)
   */
  setGauge(name: string, value: number, labels?: MetricLabels): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, {
      name,
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Record a histogram value (for latencies, sizes, etc.)
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    const key = this.getKey(name, labels);
    const entries = this.histograms.get(key) || [];
    entries.push({
      name,
      value,
      labels,
      timestamp: new Date(),
    });
    this.histograms.set(key, entries);
  }

  /**
   * Measure duration of an async operation
   */
  async measureDuration<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: MetricLabels
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordHistogram(name, duration, labels);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordHistogram(name, duration, { ...labels, error: 'true' });
      throw error;
    }
  }

  /**
   * Get all current metrics
   */
  getMetrics(): {
    counters: Counter[];
    gauges: Gauge[];
    histograms: { name: string; values: Histogram[] }[];
  } {
    const histogramGroups: { name: string; values: Histogram[] }[] = [];
    this.histograms.forEach((values, key) => {
      histogramGroups.push({
        name: values[0]?.name || key,
        values,
      });
    });

    return {
      counters: Array.from(this.counters.values()),
      gauges: Array.from(this.gauges.values()),
      histograms: histogramGroups,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * Get summary statistics for a histogram
   */
  getHistogramStats(name: string, labels?: MetricLabels): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getKey(name, labels);
    const entries = this.histograms.get(key);

    if (!entries || entries.length === 0) {
      return null;
    }

    const values = entries.map((e) => e.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: this.percentile(values, 0.5),
      p95: this.percentile(values, 0.95),
      p99: this.percentile(values, 0.99),
    };
  }

  private percentile(sortedValues: number[], p: number): number {
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private getKey(name: string, labels?: MetricLabels): string {
    if (!labels) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();

// Business metrics helpers
export const businessMetrics = {
  patientCreated: (clinicId?: number) =>
    metrics.incrementCounter('patients_created', clinicId ? { clinicId } : undefined),

  analysisPerformed: (type: string, clinicId?: number) =>
    metrics.incrementCounter('analyses_performed', { type, ...(clinicId && { clinicId }) }),

  appointmentScheduled: (type: string, clinicId?: number) =>
    metrics.incrementCounter('appointments_scheduled', { type, ...(clinicId && { clinicId }) }),

  appointmentCompleted: (type: string, clinicId?: number) =>
    metrics.incrementCounter('appointments_completed', { type, ...(clinicId && { clinicId }) }),

  treatmentPlanCreated: (clinicId?: number) =>
    metrics.incrementCounter('treatment_plans_created', clinicId ? { clinicId } : undefined),

  treatmentPlanCompleted: (clinicId?: number) =>
    metrics.incrementCounter('treatment_plans_completed', clinicId ? { clinicId } : undefined),
};
