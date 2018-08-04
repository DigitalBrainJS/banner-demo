
import {documentReady} from "./utils";

function isSupported(){
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        return !!new AudioContext();
    }catch(e){}
    return false;
}

export default {
    isSupported
}





