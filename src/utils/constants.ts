import path from 'path';
import os from 'os';

export const DEFAULT_VAULT_DIR = path.join(os.homedir(), '.pm');
export const DEFAULT_VAULT_FILE = path.join(
  DEFAULT_VAULT_DIR,
  'vault.json.enc'
);
