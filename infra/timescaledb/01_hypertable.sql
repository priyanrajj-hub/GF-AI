-- ====================================================================
-- TimescaleDB Timeseries & Hypertable Definition for Ada/Jarvis Trade
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 1. Base 1-Minute OHLCV Hypertable
CREATE TABLE IF NOT EXISTS market_ohlcv_1m (
  time TIMESTAMPTZ NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  open DOUBLE PRECISION NOT NULL,
  high DOUBLE PRECISION NOT NULL,
  low DOUBLE PRECISION NOT NULL,
  close DOUBLE PRECISION NOT NULL,
  volume BIGINT NOT NULL DEFAULT 0,
  vwap DOUBLE PRECISION,
  source VARCHAR(64) DEFAULT 'NSE',
  CONSTRAINT pk_market_ohlcv_1m PRIMARY KEY (time, symbol)
);

-- Convert to Hypertable partitioned by time (7-day chunk intervals)
SELECT create_hypertable(
  'market_ohlcv_1m',
  'time',
  chunk_time_interval => INTERVAL '7 days',
  if_not_exists => TRUE
);

-- Create secondary index on symbol and time
CREATE INDEX IF NOT EXISTS idx_market_ohlcv_1m_symbol_time 
ON market_ohlcv_1m (symbol, time DESC);

-- 2. Continuous Aggregate: 5-Minute Candles
CREATE MATERIALIZED VIEW IF NOT EXISTS market_ohlcv_5m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('5 minutes', time) AS bucket,
  symbol,
  first(open, time) AS open,
  max(high) AS high,
  min(low) AS low,
  last(close, time) AS close,
  sum(volume) AS volume,
  sum(close * volume) / NULLIF(sum(volume), 0) AS vwap
FROM market_ohlcv_1m
GROUP BY bucket, symbol
WITH NO DATA;

-- 3. Continuous Aggregate: 1-Hour Candles
CREATE MATERIALIZED VIEW IF NOT EXISTS market_ohlcv_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  symbol,
  first(open, time) AS open,
  max(high) AS high,
  min(low) AS low,
  last(close, time) AS close,
  sum(volume) AS volume,
  sum(close * volume) / NULLIF(sum(volume), 0) AS vwap
FROM market_ohlcv_1m
GROUP BY bucket, symbol
WITH NO DATA;

-- 4. Continuous Aggregate: 1-Day Candles
CREATE MATERIALIZED VIEW IF NOT EXISTS market_ohlcv_1d
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  symbol,
  first(open, time) AS open,
  max(high) AS high,
  min(low) AS low,
  last(close, time) AS close,
  sum(volume) AS volume,
  sum(close * volume) / NULLIF(sum(volume), 0) AS vwap
FROM market_ohlcv_1m
GROUP BY bucket, symbol
WITH NO DATA;

-- 5. Refresh Policies for Continuous Aggregates
SELECT add_continuous_aggregate_policy('market_ohlcv_5m',
  start_offset => INTERVAL '1 hour',
  end_offset => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute',
  if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('market_ohlcv_1h',
  start_offset => INTERVAL '1 day',
  end_offset => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes',
  if_not_exists => TRUE);

SELECT add_continuous_aggregate_policy('market_ohlcv_1d',
  start_offset => INTERVAL '7 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE);

-- 6. Retention Policy: Compress raw chunks after 14 days, drop raw chunks after 90 days
ALTER TABLE market_ohlcv_1m SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('market_ohlcv_1m', INTERVAL '14 days', if_not_exists => TRUE);
SELECT add_retention_policy('market_ohlcv_1m', INTERVAL '90 days', if_not_exists => TRUE);
