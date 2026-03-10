import { contextBridge } from 'electron'
import { exposeElectronAPI } from '@electron-toolkit/preload'

if (process.contextIsolated) {
    try {
        exposeElectronAPI()
        contextBridge.exposeInMainWorld('api', {})
    } catch (error) {
        console.error(error)
    }
}
