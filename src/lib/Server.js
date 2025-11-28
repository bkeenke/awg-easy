'use strict';

const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');

const express = require('express');
const expressSession = require('express-session');
const debug = require('debug')('Server');

const Util = require('./Util');
const ServerError = require('./ServerError');
const WireGuard = require('../services/WireGuard');

const {
  CHECK_UPDATE,
  PORT,
  WEBUI_HOST,
  RELEASE,
  PASSWORD,
  LANG,
} = require('../config');

module.exports = class Server {

  constructor() {
    // Express
    this.app = express()
      .disable('etag')
      .use('/', express.static(path.join(__dirname, '..', 'www')))
      .use(express.json())
      .use(expressSession({
        secret: crypto.randomBytes(256).toString('hex'),
        resave: true,
        saveUninitialized: true,
        cookie: {
          httpOnly: true,
        },
      }))

      .get('/api/check-update', (Util.promisify(async () => {
        return CHECK_UPDATE;
      })))

      .get('/api/release', (Util.promisify(async () => {
        return RELEASE;
      })))

      .get('/api/information', (Util.promisify(async () => {
        const semver = require('semver');
        
        // Fetch latest release info
        let latestRelease = { version: RELEASE, changelog: '' };
        let updateAvailable = false;
        
        if (CHECK_UPDATE) {
          try {
            const response = await fetch('https://raw.githubusercontent.com/spcfox/amnezia-wg-easy/production/docs/changelog.json');
            const changelog = await response.json();
            const versions = Object.keys(changelog).map((v) => parseInt(v, 10)).sort((a, b) => b - a);
            if (versions.length > 0) {
              latestRelease = {
                version: versions[0],
                changelog: changelog[versions[0]],
              };
              updateAvailable = parseInt(RELEASE, 10) < versions[0];
            }
          } catch (err) {
            // Ignore errors
          }
        }

        return {
          currentRelease: RELEASE,
          latestRelease,
          updateAvailable,
          isAwg: true,
        };
      })))

      .get('/api/lang', (Util.promisify(async () => {
        return LANG;
      })))

    // Authentication
      .get('/api/session', Util.promisify(async (req) => {
        const requiresPassword = !!process.env.PASSWORD;
        const authenticated = requiresPassword
          ? !!(req.session && req.session.authenticated)
          : true;

        return {
          requiresPassword,
          authenticated,
        };
      }))
      .post('/api/session', Util.promisify(async (req) => {
        const {
          password,
        } = req.body;

        if (typeof password !== 'string') {
          throw new ServerError('Missing: Password', 401);
        }

        if (password !== PASSWORD) {
          throw new ServerError('Incorrect Password', 401);
        }

        req.session.authenticated = true;
        req.session.save();

        debug(`New Session: ${req.session.id}`);
      }))

    // WireGuard
      .use((req, res, next) => {
        if (!PASSWORD) {
          return next();
        }

        if (req.session && req.session.authenticated) {
          return next();
        }

        if (req.path.startsWith('/api/') && req.headers['authorization']) {
          if (bcrypt.compareSync(req.headers['authorization'], bcrypt.hashSync(PASSWORD, 10))) {
            return next();
          }
          return res.status(401).json({
            error: 'Incorrect Password',
          });
        }

        return res.status(401).json({
          error: 'Not Logged In',
        });
      })
      .delete('/api/session', Util.promisify(async (req) => {
        const sessionId = req.session.id;

        req.session.destroy();

        debug(`Deleted Session: ${sessionId}`);
      }))
      .get('/api/wireguard/client', Util.promisify(async (req) => {
        const { filter } = req.query;
        if (filter) {
          return WireGuard.searchClients(filter);
        }
        return WireGuard.getClients();
      }))
      .get('/api/wireguard/client/:clientId', Util.promisify(async (req) => {
        const { clientId } = req.params;
        const clients = await WireGuard.getClients();
        const client = clients.find((c) => c.id === clientId);
        if (!client) {
          throw new ServerError(`Client Not Found: ${clientId}`, 404);
        }
        return client;
      }))
      .get('/api/wireguard/statistics', Util.promisify(async (req) => {
        const clients = await WireGuard.getClients();
        const totalClients = clients.length;
        const enabledClients = clients.filter((c) => c.enabled).length;
        const activeClients = clients.filter(
          (c) => c.latestHandshakeAt && (new Date() - new Date(c.latestHandshakeAt) < 1000 * 60 * 10)
        ).length;
        const totalTransferRx = clients.reduce((sum, c) => sum + (c.transferRx || 0), 0);
        const totalTransferTx = clients.reduce((sum, c) => sum + (c.transferTx || 0), 0);

        return {
          totalClients,
          enabledClients,
          activeClients,
          totalTransferRx,
          totalTransferTx,
        };
      }))
      .get('/api/wireguard/export', Util.promisify(async (req, res) => {
        const configurations = await WireGuard.exportAllConfigurations();
        res.header('Content-Disposition', 'attachment; filename="wireguard-configs.json"');
        res.header('Content-Type', 'application/json');
        return configurations;
      }))
      .get('/api/wireguard/server-info', Util.promisify(async (req) => {
        return WireGuard.getServerInfo();
      }))
      .get('/api/wireguard/client/:clientId/qrcode.svg', Util.promisify(async (req, res) => {
        const { clientId } = req.params;
        const svg = await WireGuard.getClientQRCodeSVG({ clientId });
        res.header('Content-Type', 'image/svg+xml');
        res.send(svg);
      }))
      .get('/api/wireguard/client/:clientId/qrcode.png', Util.promisify(async (req, res) => {
        const { clientId } = req.params;
        const dataUrl = await WireGuard.getClientQRCodeDataURL({ clientId });
        // Convert data URL to buffer
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        res.header('Content-Type', 'image/png');
        res.send(buffer);
      }))
      .get('/api/wireguard/client/:clientId/configuration', Util.promisify(async (req, res) => {
        const { clientId } = req.params;
        const client = await WireGuard.getClient({ clientId });
        const config = await WireGuard.getClientConfiguration({ clientId });
        const configName = Util.cleanFilename(client.name) || clientId;
        res.header('Content-Disposition', `attachment; filename="${configName}.conf"`);
        res.header('Content-Type', 'text/plain');
        res.send(config);
      }))
      .post('/api/wireguard/client', Util.promisify(async (req) => {
        const { name } = req.body;
        return WireGuard.createClient({ name });
      }))
      .delete('/api/wireguard/client/:clientId', Util.promisify(async (req) => {
        const { clientId } = req.params;
        return WireGuard.deleteClient({ clientId });
      }))
      .post('/api/wireguard/client/:clientId/enable', Util.promisify(async (req, res) => {
        const { clientId } = req.params;
        if (clientId === '__proto__' || clientId === 'constructor' || clientId === 'prototype') {
          res.end(403);
        }
        return WireGuard.enableClient({ clientId });
      }))
      .post('/api/wireguard/client/:clientId/disable', Util.promisify(async (req, res) => {
        const { clientId } = req.params;
        if (clientId === '__proto__' || clientId === 'constructor' || clientId === 'prototype') {
          res.end(403);
        }
        return WireGuard.disableClient({ clientId });
      }))
      .post('/api/wireguard/client/enable-all', Util.promisify(async (req) => {
        return WireGuard.enableAllClients();
      }))
      .post('/api/wireguard/client/disable-all', Util.promisify(async (req) => {
        return WireGuard.disableAllClients();
      }))
      .put('/api/wireguard/client/:clientId/name', Util.promisify(async (req, res) => {
        const { clientId } = req.params;
        if (clientId === '__proto__' || clientId === 'constructor' || clientId === 'prototype') {
          res.end(403);
        }
        const { name } = req.body;
        return WireGuard.updateClientName({ clientId, name });
      }))
      .put('/api/wireguard/client/:clientId/address', Util.promisify(async (req, res) => {
        const { clientId } = req.params;
        if (clientId === '__proto__' || clientId === 'constructor' || clientId === 'prototype') {
          res.end(403);
        }
        const { address } = req.body;
        return WireGuard.updateClientAddress({ clientId, address });
      }))

      .listen(PORT, WEBUI_HOST, () => {
        debug(`Listening on http://${WEBUI_HOST}:${PORT}`);
      });
  }

};
