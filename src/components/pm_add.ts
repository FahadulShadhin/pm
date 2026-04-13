import { Vault } from './vault';

export class PMAdd {
  private vault: Vault;

  constructor(vault = new Vault()) {
    this.vault = vault;
  }

  public addAccount() {
    this.vault.loadVault(''); // TODO: pass master password
  }
}
