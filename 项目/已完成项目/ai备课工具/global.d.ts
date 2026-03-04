// Global type declarations for the application

interface AIStudioAPI {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

interface Window {
  aistudio?: AIStudioAPI;
}
