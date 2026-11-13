-- Retire the contact-memory feature (NFC card → WhatsApp capture, Apify
-- enrichment, MCP recall). Drops its tables; the vector extension stays
-- installed since it's harmless and other features may want it later.

DROP TABLE IF EXISTS contact_embeddings CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
