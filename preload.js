const { contextBridge, ipcRenderer } = require('electron');
const jsmediatags = require('jsmediatags');
const fs = require('fs').promises;
const { getAudioDurationInSeconds } = require('get-audio-duration')

contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    readDirectory: (folderPath) => ipcRenderer.invoke('readDirectory', folderPath)
});


contextBridge.exposeInMainWorld('jsmediaAPI', {
    readTags: (file, callback) => {
        jsmediatags.read(file, callback);
    }
});


contextBridge.exposeInMainWorld('fsAPI', {
    readFile: (filePath) => ipcRenderer.invoke('readFile', filePath)
});


contextBridge.exposeInMainWorld('audioAPI', {
    getAudioDuration: (file) => getAudioDurationInSeconds(file)
});
