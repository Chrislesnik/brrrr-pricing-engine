declare global {
  interface Liveblocks {
    UserMeta: {
      id: string
      info: {
        name: string
        avatar: string
      }
    }

    // Required for useThreads, FloatingComposer, FloatingThreads, AnchoredThreads
    ThreadMetadata: {}
  }
}

export {}
