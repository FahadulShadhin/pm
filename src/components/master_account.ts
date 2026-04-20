import fs from 'fs';
import crypto from 'crypto';
import { DEFAULT_VAULT_DIR, DEFAULT_VAULT_FILE } from '../utils/constants';
import { Base } from './base';

export class MasterAccount {
  private vaultDir: string;
  private vaultFile: string;
  private Base: Base;

  constructor(
    vaultDir = DEFAULT_VAULT_DIR,
    vaultFile = DEFAULT_VAULT_FILE,
    base = new Base()
  ) {
    this.vaultDir = vaultDir;
    this.vaultFile = vaultFile;
    this.Base = base;
  }

  public async init(): Promise<void> {
    if (!fs.existsSync(this.vaultDir)) {
      fs.mkdirSync(this.vaultDir);
    }

    // login if vault exists
    if (fs.existsSync(this.vaultFile)) {
      const password = await this.Base.promptHidden('Enter master password: ');

      const file = JSON.parse(fs.readFileSync(this.vaultFile, 'utf8')) as any;
      const salt = Buffer.from(file.salt, 'base64');

      const key = this.Base.deriveKey(password, salt);

      try {
        this.Base.decrypt(file, key);
        console.log('Vault unlocked successfully!');
      } catch (err) {
        console.error('Invalid master password.');
      }

      return;
    }

    // create vault
    const password = await this.Base.promptHidden('Create master password: ');
    const confirmPassword = await this.Base.promptHidden(
      'Confirm master password: '
    );

    if (password !== confirmPassword) {
      console.error('Passwords do not match. Aborting...');
      return;
    }

    const salt = crypto.randomBytes(16);
    const key = this.Base.deriveKey(password, salt);

    const emptyVault = JSON.stringify({ accounts: [] });
    const encryptedVault = this.Base.encrypt(emptyVault, key);

    const payload = {
      salt: salt.toString('base64'),
      ...encryptedVault,
    };

    fs.writeFileSync(this.vaultFile, JSON.stringify(payload, null, 2));

    console.log('Vault initialized successfully');
  }
}
