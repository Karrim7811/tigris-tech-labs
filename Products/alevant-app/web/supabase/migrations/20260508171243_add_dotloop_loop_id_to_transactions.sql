-- Reconciled from prod 2026-05-23 (originally applied 2026-05-08).
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS dotloop_loop_id text;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS signing_provider text;
COMMENT ON COLUMN transactions.dotloop_loop_id IS 'Dotloop loop ID — sibling to docusign_envelope_id. Set when a transaction is wired to a Dotloop loop.';
COMMENT ON COLUMN transactions.signing_provider IS 'Which e-signing provider this transaction uses: ''docusign'' | ''dotloop'' | NULL. Lets the brain dispatch nudges and webhook handling correctly.';
CREATE INDEX IF NOT EXISTS transactions_dotloop_loop_id_idx ON transactions (dotloop_loop_id) WHERE dotloop_loop_id IS NOT NULL;
