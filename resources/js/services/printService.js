import axios from 'axios';
import { isQzEnabled, printHtml } from '../lib/qzClient';

const openBrowserPrintDialog = (html) => {
    if (typeof window === 'undefined') {
        return false;
    }

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) {
        console.warn('[PrintService] Unable to open browser print window (blocked by popup policy)');
        return false;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Give the browser a moment to render before invoking print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 50);

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
