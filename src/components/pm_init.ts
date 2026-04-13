import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import readline from 'readline';

const DEFAULT_VAULT_DIR = path.join(os.homedir(), '.pm');
const DEFAULT_VAULT_FILE = path.join(DEFAULT_VAULT_DIR, 'vault.json.enc');

export class PMInit {
  private vaultDir: string;
  private vaultFile: string;

  constructor(vaultDir = DEFAULT_VAULT_DIR, vaultFile = DEFAULT_VAULT_FILE) {
    this.vaultDir = vaultDir;
    this.vaultFile = vaultFile;
  }

  private async promptHidden(question: string): Promise<string> {
    return new Promise((resolve) => {
      readline.emitKeypressEvents(process.stdin);

      const stdin = process.stdin as NodeJS.ReadStream & {
        on(
          event: 'keypress',
          listener: (str: string, key: readline.Key) => void
        ): NodeJS.ReadStream;
        removeListener(
          event: 'keypress',
          listener: (str: string, key: readline.Key) => void
        ): NodeJS.ReadStream;
        setRawMode?(mode: boolean): void;
      };

      const onData = (_chunk: Buffer) => {
        // noop fallback for some terminals
      };

      process.stdout.write(question);
      const chars: string[] = [];

      const onKeypress = (str: string, key: readline.Key) => {
        if (key.sequence === '\u0003') {
          stdin.setRawMode?.(false);
          stdin.removeListener('keypress', onKeypress);
          stdin.removeListener('data', onData as any);
          process.exit();
          return;
        }

        if (key.name === 'return' || key.name === 'enter') {
          process.stdout.write('\n');
          stdin.setRawMode?.(false);
          stdin.removeListener('keypress', onKeypress);
          stdin.removeListener('data', onData as any);
          resolve(chars.join(''));
          return;
        }

        if (key.name === 'backspace' || key.sequence === '\u007f') {
          if (chars.length > 0) {
            chars.pop();
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(question + '*'.repeat(chars.length));
          }
          return;
        }

        // printable character
        if (key.name && key.name.length === 1 && !key.ctrl && !key.meta) {
          chars.push(str);
          process.stdout.write('*');
        }
      };

      stdin.setRawMode?.(true);
      stdin.on('keypress', onKeypress);
      stdin.on('data', onData as any);
    });
  }

  private deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.scryptSync(password, salt, 32);
  }

  private encrypt(data: string, key: Buffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      data: encrypted.toString('base64'),
    };
  }

  private decrypt(
    payload: { iv: string; tag: string; data: string },
    key: Buffer
  ): string {
    const iv = Buffer.from(payload.iv, 'base64');
    const tag = Buffer.from(payload.tag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.data, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  public async init(): Promise<void> {
    if (!fs.existsSync(this.vaultDir)) {
      fs.mkdirSync(this.vaultDir);
    }

    // login if vault exists
    if (fs.existsSync(this.vaultFile)) {
      const password = await this.promptHidden('Enter master password: ');

      const file = JSON.parse(fs.readFileSync(this.vaultFile, 'utf8')) as any;
      const salt = Buffer.from(file.salt, 'base64');

      const key = this.deriveKey(password, salt);

      try {
        this.decrypt(file, key);
        console.log('Vault unlocked successfully!');
      } catch (err) {
        console.error('Invalid master password.');
      }

      return;
    }

    // create vault
    const password = await this.promptHidden('Create master password: ');
    const confirmPassword = await this.promptHidden(
      'Confirm master password: '
    );

    if (password !== confirmPassword) {
      console.error('Passwords do not match. Aborting...');
      return;
    }

    const salt = crypto.randomBytes(16);
    const key = this.deriveKey(password, salt);

    const emptyVault = JSON.stringify({ accounts: [] });
    const encryptedVault = this.encrypt(emptyVault, key);

    const payload = {
      salt: salt.toString('base64'),
      ...encryptedVault,
    };

    fs.writeFileSync(this.vaultFile, JSON.stringify(payload, null, 2));

    console.log('Vault initialized successfully');
  }
}

export const handleInit = async () => {
  const mgr = new PMInit();
  await mgr.init();
};
