import axios from 'axios';
import { isQzEnabled, printHtml } from '../lib/qzClient';

export const printOrderReceipt = async (orderId) => {
    if (!isQzEnabled()) {
        return;
    }

    try {
        const { data } = await axios.get(`/orders/${orderId}/receipt`, {
            responseType: 'text',
        });

        await printHtml(data);
    } catch (error) {
        console.error('[PrintService] Failed to print order receipt', error);
    }
};
