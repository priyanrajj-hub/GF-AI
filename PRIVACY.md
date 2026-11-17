# Privacy Policy — GF-AI & Jarvis Trade AI

## Last Updated: November 2026

We believe personal privacy, data sovereignty, and security are fundamental rights. This document outlines how **GF-AI** and **Jarvis Trade AI** process, store, and protect user data.

---

## 1. Core Principles

1. **Zero Unsolicited Telemetry:** We do not track, profile, or sell user browsing habits, search queries, or portfolio positions.
2. **User Data Sovereignty:** You have complete ownership of your notes, memories, portfolio holdings, and conversation history.
3. **No Third-Party Advertising:** The application contains zero ad network trackers, tracking pixels, or monetization beacons.
4. **Local / Tenant Isolation:** Database records are cryptographically partitioned by user ID.

---

## 2. Information We Process

### 2.1. Information You Provide
- **Account Credentials:** Username and password (hashed with standard cryptographic salt via bcrypt).
- **Settings & Preferences:** Selected avatar skin, companion mode (`mentor`, `companion`, `jarvis`), language, and voice styles.
- **Portfolio Data (Optional):** Stock holdings or transaction records uploaded to Jarvis Trade AI for XIRR, VaR, and rebalance calculations.
- **Consented Memories:** Life facts or study goals you explicitly ask the companion to remember.

### 2.2. Ephemeral Data
- **Scraped URL Content:** When using `/api/web/scrape`, web page HTML is fetched ephemerally in server memory, summarized for the prompt, and not persisted to disk.
- **Audio Streams:** Voice input and speech synthesis audio are streamed through memory and discarded after playback.

---

## 3. Third-Party AI & Market Providers

When querying external LLMs or market feeds:
- External LLM requests (Google Gemini, Groq, OpenRouter) transmit only the sanitized conversation context and user prompt.
- Server-side provider keys are strictly maintained on the backend and are never shared with client-side code.
- Market feeds (Yahoo Finance / Alpha Vantage / Finnhub) query public ticker symbols (e.g. `RELIANCE.NS`, `NVDA`) with zero associated user identity.

---

## 4. GDPR & CCPA Compliance: Your Rights

GF-AI provides native programmatic endpoints for compliance with international data privacy laws (GDPR, CCPA, California SB 243):

### 4.1. Right to Access & Data Portability
You can export all stored memories, chat messages, and settings at any time:
```http
GET /api/user/data/export
Authorization: Bearer <your_jwt_token>
```
Returns a complete, structured JSON export of all records associated with your account.

### 4.2. Right to Erasure (Right to be Forgotten)
You can permanently purge all data associated with your account from the system:
```http
DELETE /api/user/data
Authorization: Bearer <your_jwt_token>
```
This operation immediately deletes all messages, memories, settings, and life facts from the database.

---

## 5. Contact Information

For any privacy-related questions, audits, or data requests:
- **Email:** [priyanrajj.hub@gmail.com](mailto:priyanrajj.hub@gmail.com)
- **Repository:** [https://github.com/priyanrajj-hub/GF-AI](https://github.com/priyanrajj-hub/GF-AI)
