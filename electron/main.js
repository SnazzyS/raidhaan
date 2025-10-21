import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { config as loadEnv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
    loadEnv({ path: envPath });
}

if (process.env.NODE_ENV === 'development') {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
}

const isDev = process.env.NODE_ENV === 'development';
const fallbackAppUrl = 'https://raidhaan-main-d9r7ay.laravel.cloud/orders';

const appUrl =
    process.env.ELECTRON_APP_URL ||
    process.env.APP_URL ||
    fallbackAppUrl;

const defaultPrinterName = process.env.ELECTRON_PRINTER_NAME || '';
const defaultSilentPrint =
    process.env.ELECTRON_SILENT_PRINT === 'true' || defaultPrinterName !== '';

let mainWindow = null;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 832,
        minWidth: 960,
        minHeight: 640,
        show: false,
        backgroundColor: '#ffffff',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    if (!isDev) {
        mainWindow.removeMenu();
    }

    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDesc) => {
        console.error(
            `[Electron] Failed to load application URL (${errorCode}): ${errorDesc}`,
        );
    });

    mainWindow.loadURL(appUrl).catch((error) => {
        console.error('[Electron] Unable to load application URL:', error);
    });

    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
};

const printHtml = async (html, options = {}) => {
    if (typeof html !== 'string' || html.trim().length === 0) {
        return false;
    }

    const deviceName =
        typeof options.deviceName === 'string' && options.deviceName.trim().length > 0
            ? options.deviceName.trim()
            : defaultPrinterName;

    const printOptions = {
        silent: options.silent ?? defaultSilentPrint,
        printBackground: options.printBackground ?? true,
        deviceName: deviceName || undefined,
        margins: options.margins,
    };

    const printWindow = new BrowserWindow({
        show: isDev && Boolean(options.debug),
        backgroundColor: '#ffffff',
        webPreferences: {
            sandbox: true,
        },
    });

    try {
        await printWindow.loadURL(
            `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
        );

        await new Promise((resolve, reject) => {
            printWindow.webContents.print(printOptions, (success, failureReason) => {
                if (success) {
                    resolve(true);
                } else {
                    reject(new Error(failureReason || 'Unknown print error'));
                }
            });
        });

        return true;
    } catch (error) {
        console.error('[Electron] Failed to print HTML payload:', error);
        return false;
    } finally {
        if (!printWindow.isDestroyed()) {
            printWindow.close();
        }
    }
};

const registerIpcHandlers = () => {
    ipcMain.handle('print-html', async (_event, payload = {}) => {
        try {
            return await printHtml(payload.html, payload.options);
        } catch (error) {
            console.error('[Electron] print-html handler failed:', error);
            return false;
        }
    });

    ipcMain.handle('list-printers', async () => {
        const targetWindow =
            BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

        if (!targetWindow) {
            return [];
        }

        try {
            return await targetWindow.webContents.getPrintersAsync();
        } catch (error) {
            console.error('[Electron] list-printers handler failed:', error);
            return [];
        }
    });
};

const bootstrap = async () => {
    nativeTheme.themeSource = 'light';

    await app.whenReady();
    registerIpcHandlers();
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
};

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

bootstrap().catch((error) => {
    console.error('[Electron] Failed to bootstrap application:', error);
    app.quit();
});
