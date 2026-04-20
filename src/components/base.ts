import fs from 'fs';
import crypto from 'crypto';
import readline from 'readline';

export class Base {
  public async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(question, (answer: string) => {
        rl.close();

        // Ensure stdin is in a clean state for subsequent raw-mode prompts
        try {
          if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false);
          }
        } catch (e) {
          // ignore
        }

        try {
          process.stdin.resume();
        } catch (e) {
          // ignore
        }

        // Consume any leftover pending data (e.g. newline) so next raw-mode listener doesn't immediately receive it
        const onData = (_chunk: Buffer | string) => {
          try {
            process.stdin.removeListener('data', onData as any);
          } catch (e) {
            // ignore
          }
        };

        process.stdin.on('data', onData as any);
        resolve(answer.trim());
      });
    });
  }

  public async promptHidden(question: string): Promise<string> {
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
      stdin.on('data', onData);
    });
  }

  public deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.scryptSync(password, salt, 32);
  }

  public encrypt(data: string, key: Buffer) {
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

  public decrypt(
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
}
