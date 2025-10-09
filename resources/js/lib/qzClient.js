const qzEnabled = import.meta.env.VITE_QZ_ENABLED === 'true';
const qzPrinterName = import.meta.env.VITE_QZ_PRINTER_NAME ?? '';

let qzReadyPromise = null;

const loadQzScript = () =>
    new Promise((resolve, reject) => {
        if (window.qz) {
            resolve(window.qz);
            return;
        }

        const existing = document.querySelector('script[data-qz-tray]');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.qz));
            existing.addEventListener('error', reject);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qz-tray/qz-tray.js';
        script.async = true;
        script.dataset.qzTray = 'true';
        script.onload = () => resolve(window.qz);
        script.onerror = reject;
        document.head.appendChild(script);
    });

const configureSecurity = (qz) => {
    qz.security.setCertificatePromise((resolve) => {
        // DEVELOPMENT: returning "null" allows communication with an unsigned certificate.
        resolve(null);
    });

    qz.security.setSignaturePromise((toSign) => {
        // DEVELOPMENT: disable signing. For production, supply a signing endpoint or certificate.
        return Promise.resolve(null);
    });
};

const connect = async () => {
    if (!qzEnabled) {
        throw new Error('QZ Tray integration disabled');
    }

    if (qzReadyPromise) {
        return qzReadyPromise;
    }

    qzReadyPromise = (async () => {
        const qz = await loadQzScript();

        if (!qz) {
            throw new Error('QZ Tray script failed to load');
        }

        if (!window.Promise) {
            throw new Error('Browser does not support Promises required by QZ Tray');
        }

        qz.api.setPromiseType((resolver) => new Promise(resolver));
        configureSecurity(qz);

        if (!qz.websocket.isActive()) {
            await qz.websocket.connect();
        }

        return qz;
    })();

    try {
        return await qzReadyPromise;
    } catch (error) {
        qzReadyPromise = null;
        throw error;
    }
};

const createConfig = (qz) => {
    if (qzPrinterName && qzPrinterName.trim().length > 0) {
        return qz.configs.create(qzPrinterName.trim(), { copies: 1, duplex: false });
    }

    return qz.configs.create(null, { copies: 1, duplex: false });
};

export const isQzEnabled = () => qzEnabled;

export const printHtml = async (html) => {
    if (!qzEnabled) {
        return false;
    }

    try {
        const qz = await connect();
        const config = createConfig(qz);

        await qz.print(config, [
            {
                type: 'html',
                format: 'plain',
                data: html,
            },
        ]);

        return true;
    } catch (error) {
        console.error('[QZ] Unable to print receipt:', error);
        return false;
    }
};

export const findPrinters = async () => {
    if (!qzEnabled) {
        return [];
    }

    try {
        const qz = await connect();
        return await qz.printers.find();
    } catch (error) {
        console.error('[QZ] Unable to list printers:', error);
        return [];
    }
};
