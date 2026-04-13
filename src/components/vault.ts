import { DEFAULT_VAULT_DIR, DEFAULT_VAULT_FILE } from '../utils/constants';
import { VaultData } from '../utils/types';

export class Vault {
  private vaultDir: string;
  private vaultFile: string;

  constructor(vaultDir = DEFAULT_VAULT_DIR, vaultFile = DEFAULT_VAULT_FILE) {
    this.vaultDir = vaultDir;
    this.vaultFile = vaultFile;
  }

  public loadVault(password: string) {
    console.log('Loading vault...');
  }

  public saveVault(vault: VaultData, password: string) {
    console.log('Saving vault...');
  }
}
