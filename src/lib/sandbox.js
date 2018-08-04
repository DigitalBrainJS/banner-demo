import {global} from './utils';


export default {
    isSandbox: function (unkownValue) {
        if (window.parent === window) return false;

        let frame;

        try {
            frame = global && global.frameElement;
        } catch (e) {
        }

        if (frame) {
            return frame.hasAttribute('sandbox');
        } else {
            if (document.domain !== '') return unkownValue;
            if (location.protocol !== 'data:') return true;
        }

        return unkownValue;
    }
}