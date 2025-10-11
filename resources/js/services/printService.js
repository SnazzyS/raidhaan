import axios from 'axios';
import { isQzEnabled, printHtml } from '../lib/qzClient';

const openBrowserPrintDialog = (html) => {
    if (typeof window === 'undefined') {
        return false;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('sandbox', 'allow-modals allow-same-origin allow-scripts');

    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframeWindow?.document;

    if (!iframeWindow || !iframeDocument) {
        document.body.removeChild(iframe);
        console.warn('[PrintService] Unable to access iframe document for printing');
        return false;
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();

    const triggerPrint = () => {
        iframeWindow.focus();
        iframeWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500);
    };

    if (iframeDocument.readyState === 'complete') {
        triggerPrint();
    } else {
        iframe.onload = triggerPrint;
        // Failsafe in case onload never fires (some browsers)
        setTimeout(triggerPrint, 300);
    }

    return true;
};

export const printOrderReceipt = async (orderId) => {
    try {
        const { data } = await axios.get(`/orders/${orderId}/receipt`, {
            responseType: 'text',
        });

        let printed = false;

        if (isQzEnabled()) {
            printed = await printHtml(data);
        }

        if (!printed) {
            printed = openBrowserPrintDialog(data);
        }

        return printed;
    } catch (error) {
        console.error('[PrintService] Failed to print order receipt', error);
        return false;
    }
};
