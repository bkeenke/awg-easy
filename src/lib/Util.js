'use strict';

const childProcess = require('child_process');

module.exports = class Util {

  static isValidIPv4(str) {
    const blocks = str.split('.');
    if (blocks.length !== 4) return false;

    for (let value of blocks) {
      value = parseInt(value, 10);
      if (Number.isNaN(value)) return false;
      if (value < 0 || value > 255) return false;
    }

    return true;
  }

  static isValidIPv6(str) {
    // Simple IPv6 validation
    const blocks = str.split(':');
    if (blocks.length < 3 || blocks.length > 8) return false;
    
    for (const block of blocks) {
      if (block === '') continue; // Allow :: notation
      if (!/^[0-9a-fA-F]{0,4}$/.test(block)) return false;
    }
    
    return true;
  }

  static cleanFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9_=+.-]/g, '-')
      .replace(/(-{2,}|-$)/g, '-')
      .replace(/-$/, '')
      .substring(0, 32);
  }

  static promisify(fn) {
    // eslint-disable-next-line func-names
    return function(req, res) {
      Promise.resolve().then(async () => fn(req, res))
        .then((result) => {
          if (res.headersSent) return;

          if (typeof result === 'undefined') {
            return res
              .status(204)
              .end();
          }

          return res
            .status(200)
            .json(result);
        })
        .catch((error) => {
          if (typeof error === 'string') {
            error = new Error(error);
          }

          // eslint-disable-next-line no-console
          console.error(error);

          return res
            .status(error.statusCode || 500)
            .json({
              error: error.message || error.toString(),
              stack: error.stack,
            });
        });
    };
  }

  static async exec(cmd, {
    log = true,
  } = {}) {
    if (typeof log === 'string') {
      // eslint-disable-next-line no-console
      console.log(`$ ${log}`);
    } else if (log === true) {
      // eslint-disable-next-line no-console
      console.log(`$ ${cmd}`);
    }

    if (process.platform !== 'linux') {
      return '';
    }

    return new Promise((resolve, reject) => {
      childProcess.exec(cmd, {
        shell: 'bash',
      }, (err, stdout) => {
        if (err) return reject(err);
        return resolve(String(stdout).trim());
      });
    });
  }

};
