import { contextBridge, ipcRenderer } from 'electron';

const safeInvoke = (channel, payload) =>
    ipcRenderer.invoke(channel, payload).catch((error) => {
        console.error(`[Electron][Preload] ${channel} invocation failed:`, error);
        return null;
    });

contextBridge.exposeInMainWorld('electron', {
    isElectron: true,
    printHtml: (html, options = {}) => ipcRenderer.invoke('print-html', { html, options }),
    findPrinters: () => safeInvoke('list-printers'),
});
